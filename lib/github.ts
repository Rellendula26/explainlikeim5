import { RepoAnalysisContext, RepoCoordinates } from "./types";

const GITHUB_API_BASE = "https://api.github.com";
const MAX_FILE_BYTES = 80_000;
const MAX_SNIPPET_CHARS = 6_000;
const MAX_FILES_TO_FETCH = 14;

const PRIORITY_MATCHERS = [
  /^README\.md$/i,
  /^package\.json$/i,
  /^requirements\.txt$/i,
  /^pyproject\.toml$/i,
  /^next\.config\./i,
  /^app\//i,
  /^pages\//i,
  /^src\//i,
  /^lib\//i,
  /^components\//i,
  /^api\//i,
  /^server\//i,
  /^routes\//i
];

type GitHubRepoResponse = {
  name: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  topics: string[];
  default_branch: string;
  updated_at: string;
  private: boolean;
};

type GitHubTreeItem = {
  path: string;
  mode: string;
  type: "tree" | "blob";
  sha: string;
  size?: number;
  url: string;
};

type GitHubTreeResponse = {
  tree: GitHubTreeItem[];
  truncated: boolean;
};

type GitHubContentResponse = {
  path: string;
  content?: string;
  encoding?: string;
  size?: number;
};

export function parseRepoInput(input: string): RepoCoordinates | null {
  const cleaned = input.trim().replace(/\.git$/, "");
  if (!cleaned) return null;

  const plainPair = cleaned.match(/^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/);
  if (plainPair) {
    return { owner: plainPair[1], repo: plainPair[2] };
  }

  const normalized = cleaned.startsWith("http") ? cleaned : `https://${cleaned}`;
  try {
    const parsed = new URL(normalized);
    if (!parsed.hostname.includes("github.com")) return null;
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    return { owner: parts[0], repo: parts[1] };
  } catch {
    return null;
  }
}

function githubHeaders() {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "explain-my-repo-like-im-five"
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  return headers;
}

async function githubFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${GITHUB_API_BASE}${path}`, {
    headers: githubHeaders(),
    cache: "no-store"
  });

  if (response.status === 403) {
    throw new Error("GitHub API rate limit reached. Please try again later.");
  }
  if (response.status === 404) {
    throw new Error("Repository not found or it may be private.");
  }
  if (!response.ok) {
    throw new Error(`GitHub API error (${response.status}).`);
  }

  return (await response.json()) as T;
}

function scorePath(path: string): number {
  let score = 0;
  for (const matcher of PRIORITY_MATCHERS) {
    if (matcher.test(path)) score += 10;
  }
  if (path.endsWith(".md")) score += 3;
  if (path.endsWith(".ts") || path.endsWith(".tsx") || path.endsWith(".js")) score += 2;
  return score;
}

function cleanSnippet(content: string): string {
  return content.replace(/\r\n/g, "\n").slice(0, MAX_SNIPPET_CHARS);
}

async function fetchFileContent(
  owner: string,
  repo: string,
  path: string,
  ref: string
): Promise<{ path: string; snippet: string } | null> {
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  const data = await githubFetch<GitHubContentResponse>(
    `/repos/${owner}/${repo}/contents/${encodedPath}?ref=${encodeURIComponent(ref)}`
  );

  if (data.encoding !== "base64" || !data.content) return null;
  const decoded = Buffer.from(data.content, "base64").toString("utf8");
  return { path, snippet: cleanSnippet(decoded) };
}

export async function buildRepoContext(repoInput: string): Promise<RepoAnalysisContext> {
  const parsed = parseRepoInput(repoInput);
  if (!parsed) {
    throw new Error("Invalid GitHub repo URL. Use owner/repo or github.com/owner/repo.");
  }

  const { owner, repo } = parsed;
  const repoData = await githubFetch<GitHubRepoResponse>(`/repos/${owner}/${repo}`);
  if (repoData.private) {
    throw new Error("This repository is private. Please use a public repository.");
  }

  const treeData = await githubFetch<GitHubTreeResponse>(
    `/repos/${owner}/${repo}/git/trees/${encodeURIComponent(repoData.default_branch)}?recursive=1`
  );

  const blobEntries = treeData.tree.filter(
    (item) => item.type === "blob" && (item.size ?? 0) <= MAX_FILE_BYTES
  );

  const prioritizedPaths = blobEntries
    .map((entry) => ({ path: entry.path, score: scorePath(entry.path) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_FILES_TO_FETCH)
    .map((entry) => entry.path);

  const fileSnippets = (
    await Promise.all(
      prioritizedPaths.map((path) => fetchFileContent(owner, repo, path, repoData.default_branch))
    )
  ).filter((value): value is { path: string; snippet: string } => Boolean(value));

  const topLevelFolders = Array.from(
    new Set(
      treeData.tree
        .map((entry) => entry.path.split("/")[0])
        .filter((segment) => segment && !segment.includes("."))
    )
  ).slice(0, 12);

  return {
    repoFullName: `${owner}/${repo}`,
    metadata: {
      name: repoData.name,
      description: repoData.description ?? "No description provided.",
      stars: repoData.stargazers_count,
      forks: repoData.forks_count,
      primaryLanguage: repoData.language ?? "Unknown",
      topics: repoData.topics ?? [],
      defaultBranch: repoData.default_branch,
      updatedAt: repoData.updated_at
    },
    treeSummary: {
      totalFiles: blobEntries.length,
      topLevelFolders,
      keyPaths: prioritizedPaths
    },
    fileSnippets
  };
}
