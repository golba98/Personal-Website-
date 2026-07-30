const DEFAULT_USERNAME = "golba98";
const CACHE_CONTROL = "s-maxage=3600, stale-while-revalidate=86400";
const GITHUB_REST_API = "https://api.github.com";
const GITHUB_GRAPHQL_API = "https://api.github.com/graphql";
const USERNAME_PATTERN = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;

function normalizeUsername(value) {
  const username = value.trim();

  if (!USERNAME_PATTERN.test(username)) {
    return null;
  }

  return username;
}

function getConfiguredUsername() {
  return normalizeUsername(process.env.VITE_GITHUB_USERNAME || DEFAULT_USERNAME) || DEFAULT_USERNAME;
}

function getRequestedUsername(req) {
  const rawUsername =
    typeof req.query?.username === "string" ? req.query.username : getConfiguredUsername();

  return normalizeUsername(rawUsername);
}

function json(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", statusCode === 200 ? CACHE_CONTROL : "no-store");
  res.end(JSON.stringify(payload));
}

function githubHeaders(extraHeaders = {}) {
  return {
    Accept: "application/vnd.github+json",
    "User-Agent": "transition-portfolio",
    ...extraHeaders,
  };
}

function normalizeProfile(user) {
  const followers =
    typeof user.followers === "number" ? user.followers : user.followers?.totalCount ?? 0;
  const following =
    typeof user.following === "number" ? user.following : user.following?.totalCount ?? 0;

  return {
    login: user.login,
    name: user.name || "",
    bio: user.bio || "",
    url: user.html_url || user.url || `https://github.com/${user.login}`,
    avatarUrl: user.avatar_url || user.avatarUrl || "",
    publicRepos: user.public_repos ?? user.repositories?.totalCount ?? 0,
    followers,
    following,
    location: user.location || "",
    company: user.company || "",
    blog: user.blog || user.websiteUrl || "",
    createdAt: user.created_at || user.createdAt || "",
    updatedAt: user.updated_at || user.updatedAt || "",
  };
}

function normalizeRestRepo(repo, isPinned = false) {
  return {
    name: repo.name,
    url: repo.html_url,
    description: repo.description || "",
    language: repo.language || "",
    topics: Array.isArray(repo.topics) ? repo.topics : [],
    stars: repo.stargazers_count ?? 0,
    forks: repo.forks_count ?? 0,
    watchers: repo.watchers_count ?? 0,
    updatedAt: repo.updated_at || "",
    pushedAt: repo.pushed_at || "",
    homepage: repo.homepage || "",
    archived: Boolean(repo.archived),
    fork: Boolean(repo.fork),
    isPinned,
  };
}

function normalizeGraphqlRepo(repo) {
  return {
    name: repo.name,
    url: repo.url,
    description: repo.description || "",
    language: repo.primaryLanguage?.name || "",
    topics: repo.repositoryTopics.nodes.map((node) => node.topic.name),
    stars: repo.stargazerCount ?? 0,
    forks: repo.forkCount ?? 0,
    watchers: repo.watchers.totalCount ?? 0,
    updatedAt: repo.updatedAt || "",
    pushedAt: repo.pushedAt || "",
    homepage: repo.homepageUrl || "",
    archived: Boolean(repo.isArchived),
    fork: Boolean(repo.isFork),
    isPinned: true,
  };
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`GitHub request failed with ${response.status}`);
  }

  return response.json();
}

async function fetchRecentRepos(username) {
  const [profile, repos] = await Promise.all([
    fetchJson(`${GITHUB_REST_API}/users/${encodeURIComponent(username)}`, {
      headers: githubHeaders(),
    }),
    fetchJson(
      `${GITHUB_REST_API}/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated&type=owner`,
      {
        headers: githubHeaders(),
      },
    ),
  ]);

  return {
    profile: normalizeProfile(profile),
    repos: repos
      // Skip forks and the profile-README repo, which GitHub names after the user.
      .filter((repo) => !repo.fork && repo.name.toLowerCase() !== username.toLowerCase())
      .slice(0, 6)
      .map((repo) => normalizeRestRepo(repo)),
    source: "rest-recent",
  };
}

async function fetchPinnedRepos(username, token) {
  const query = `
    query PortfolioPinnedRepos($login: String!) {
      user(login: $login) {
        login
        name
        bio
        url
        avatarUrl
        location
        company
        websiteUrl
        createdAt
        updatedAt
        repositories {
          totalCount
        }
        followers {
          totalCount
        }
        following {
          totalCount
        }
        pinnedItems(first: 6, types: REPOSITORY) {
          nodes {
            ... on Repository {
              name
              url
              description
              primaryLanguage {
                name
              }
              stargazerCount
              forkCount
              watchers {
                totalCount
              }
              pushedAt
              updatedAt
              homepageUrl
              isArchived
              isFork
              repositoryTopics(first: 6) {
                nodes {
                  topic {
                    name
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const payload = await fetchJson(GITHUB_GRAPHQL_API, {
    method: "POST",
    headers: githubHeaders({
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({ query, variables: { login: username } }),
  });

  if (payload.errors?.length) {
    throw new Error(payload.errors[0].message);
  }

  if (!payload.data?.user) {
    throw new Error("GitHub user not found");
  }

  return {
    profile: normalizeProfile(payload.data.user),
    repos: payload.data.user.pinnedItems.nodes.filter(Boolean).map(normalizeGraphqlRepo),
    source: "graphql-pinned",
  };
}

export default async function handler(req, res) {
  if (req.method && req.method !== "GET") {
    res.setHeader("Allow", "GET");
    json(res, 405, { error: "Method not allowed." });
    return;
  }

  const username = getRequestedUsername(req);
  const configuredUsername = getConfiguredUsername();

  if (!username) {
    json(res, 400, { error: "Invalid GitHub username." });
    return;
  }

  if (username.toLowerCase() !== configuredUsername.toLowerCase()) {
    json(res, 403, { error: "GitHub username is not allowed for this site." });
    return;
  }

  try {
    const token = process.env.GITHUB_TOKEN;
    const data = token ? await fetchPinnedRepos(username, token) : await fetchRecentRepos(username);
    json(res, 200, data);
  } catch (error) {
    try {
      const data = await fetchRecentRepos(username);
      json(res, 200, { ...data, source: "rest-recent-fallback" });
    } catch {
      json(res, 502, {
        error: "GitHub data is temporarily unavailable.",
      });
    }
  }
}
