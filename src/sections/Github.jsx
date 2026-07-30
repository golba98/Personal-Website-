import { useMemo } from "react";
import Words from "../components/Words";
import { repoBlurbs } from "../content";
import {
  GITHUB_PROFILE_FALLBACK,
  GITHUB_USERNAME,
  REPO_CARD_LIMIT,
  formatCount,
  formatRepoDate,
} from "../github";

export default function Github({ data, loading, error }) {
  const githubProfile = data.profile ?? {
    login: GITHUB_USERNAME,
    url: GITHUB_PROFILE_FALLBACK,
    publicRepos: 0,
  };
  const profileUrl = githubProfile.url || GITHUB_PROFILE_FALLBACK;

  const repos = useMemo(
    () =>
      data.repos
        // Drop the profile-README repo (GitHub names it after the user) and forks.
        .filter((repo) => repo.name.toLowerCase() !== GITHUB_USERNAME.toLowerCase() && !repo.fork)
        .slice(0, REPO_CARD_LIMIT)
        .map((repo) => ({
          name: repo.name,
          url: repo.url,
          description:
            repoBlurbs[repo.name] || repo.description || `${repo.language || "Public"} repository.`,
          language: repo.language,
          stars: repo.stars,
          updated: formatRepoDate(repo.pushedAt || repo.updatedAt),
        })),
    [data.repos],
  );

  return (
    <section id="github" className="section">
      <div className="section-head" data-reveal>
        <p className="eyebrow" data-stagger>
          Public code
        </p>
        <h2 data-stagger>
          <Words text="On GitHub" />
        </h2>
        <p className="lede" data-stagger>
          Live from{" "}
          <a className="link" href={profileUrl} target="_blank" rel="noreferrer">
            @{githubProfile.login}
          </a>
          {!loading && githubProfile.publicRepos
            ? ` · ${formatCount(githubProfile.publicRepos)} public repos`
            : ""}
          .
        </p>
      </div>

      <div className="repo-grid" data-reveal aria-live="polite">
        {loading &&
          Array.from({ length: REPO_CARD_LIMIT }, (_, index) => (
            <div className="repo repo-skeleton" key={`skeleton-${index}`} aria-hidden="true">
              <span className="sk sk-title" />
              <span className="sk" />
              <span className="sk sk-short" />
            </div>
          ))}

        {!loading &&
          !error &&
          repos.map((repo, index) => (
            <a
              className="repo"
              href={repo.url}
              key={repo.name}
              target="_blank"
              rel="noreferrer"
              data-stagger
              data-magnet
              // These mount after the reveal observer has run, so set the
              // cascade index here rather than relying on it to assign one.
              style={{ "--i": index }}
            >
              <h3>{repo.name}</h3>
              <p>{repo.description}</p>
              <div className="repo-meta">
                {repo.language && <span className="repo-lang">{repo.language}</span>}
                {repo.stars > 0 && <span>{formatCount(repo.stars)} stars</span>}
                <span>{repo.updated}</span>
              </div>
            </a>
          ))}

        {!loading && (error || repos.length === 0) && (
          <p className="repo-empty">
            {error || "No public repositories to show right now."}{" "}
            <a className="link" href={profileUrl} target="_blank" rel="noreferrer">
              Open GitHub directly
            </a>
            .
          </p>
        )}
      </div>

      <div className="section-foot" data-reveal>
        <a className="button" href={profileUrl} target="_blank" rel="noreferrer">
          View all repositories
        </a>
      </div>
    </section>
  );
}
