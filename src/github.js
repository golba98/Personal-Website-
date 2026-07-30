import { useEffect, useState } from "react";

/*
 * Client-side tier of the GitHub data path. `useGithubData` calls /api/github
 * first and falls back to public REST here if that endpoint is missing or
 * failing — see the three-tier description in DOCUMENTATION.md. The normalizers
 * below must keep the same field names as shared/github.js, or the tiers stop
 * being interchangeable.
 */

const DEFAULT_GITHUB_USERNAME = "golba98";

export const GITHUB_USERNAME =
  import.meta.env.VITE_GITHUB_USERNAME?.trim() || DEFAULT_GITHUB_USERNAME;
export const GITHUB_PROFILE_FALLBACK = `https://github.com/${GITHUB_USERNAME}`;
export const REPO_CARD_LIMIT = 6;

export function formatCount(value) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatRepoDate(value) {
  if (!value) return "Recently updated";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently updated";
  return `Updated ${new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(date)}`;
}

function normalizeGithubProfile(user) {
  return {
    login: user.login || GITHUB_USERNAME,
    name: user.name || "",
    url: user.html_url || user.url || GITHUB_PROFILE_FALLBACK,
    publicRepos: user.public_repos ?? user.publicRepos ?? 0,
  };
}

function normalizeGithubRepo(repo) {
  return {
    name: repo.name,
    url: repo.html_url || repo.url,
    description: repo.description || "",
    language: repo.language || "",
    stars: repo.stargazers_count ?? repo.stars ?? 0,
    updatedAt: repo.updated_at || repo.updatedAt || "",
    pushedAt: repo.pushed_at || repo.pushedAt || "",
    fork: Boolean(repo.fork),
  };
}

async function fetchGithubRestFallback(signal) {
  const [profileResponse, reposResponse] = await Promise.all([
    fetch(`https://api.github.com/users/${GITHUB_USERNAME}`, {
      signal,
      headers: { Accept: "application/vnd.github+json" },
    }),
    fetch(
      `https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&sort=updated&type=owner`,
      { signal, headers: { Accept: "application/vnd.github+json" } },
    ),
  ]);

  if (!profileResponse.ok || !reposResponse.ok) throw new Error("GitHub REST fallback failed");

  const [profileData, repoData] = await Promise.all([
    profileResponse.json(),
    reposResponse.json(),
  ]);

  return {
    profile: normalizeGithubProfile(profileData),
    repos: Array.isArray(repoData)
      ? repoData.filter((repo) => !repo.fork).map(normalizeGithubRepo)
      : [],
    source: "client-rest",
  };
}

export function useGithubData() {
  const [data, setData] = useState({ profile: null, repos: [], source: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await fetch(
          `/api/github?username=${encodeURIComponent(GITHUB_USERNAME)}`,
          { signal: controller.signal, headers: { Accept: "application/json" } },
        );
        if (!response.ok) throw new Error(`GitHub endpoint failed with ${response.status}`);

        const payload = await response.json();
        if (!controller.signal.aborted) {
          setData({
            profile: payload.profile ? normalizeGithubProfile(payload.profile) : null,
            repos: Array.isArray(payload.repos) ? payload.repos.map(normalizeGithubRepo) : [],
            source: payload.source || "server",
          });
        }
      } catch (requestError) {
        if (requestError.name === "AbortError") return;
        try {
          const fallback = await fetchGithubRestFallback(controller.signal);
          if (!controller.signal.aborted) setData(fallback);
        } catch (fallbackError) {
          if (fallbackError.name !== "AbortError") {
            setError("GitHub is not reachable right now.");
            setData({ profile: null, repos: [], source: "" });
          }
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    load();
    return () => controller.abort();
  }, []);

  return { data, loading, error };
}
