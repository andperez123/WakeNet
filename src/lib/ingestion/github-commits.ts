import type { NormalizedEvent } from "../types";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const headers: HeadersInit = {
  Accept: "application/vnd.github.v3+json",
  "User-Agent": "WakeNet/1.0",
};
if (GITHUB_TOKEN) (headers as Record<string, string>)["Authorization"] = `Bearer ${GITHUB_TOKEN}`;

export async function pollGithubCommits(
  owner: string,
  repo: string,
  branch?: string,
  pathPrefix?: string
): Promise<NormalizedEvent[]> {
  const sha = branch ? encodeURIComponent(branch) : undefined;
  const url = `https://api.github.com/repos/${owner}/${repo}/commits?per_page=30${sha ? `&sha=${sha}` : ""}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  const data = (await res.json()) as Array<{
    sha: string;
    commit: { message: string; author?: { date: string; name?: string } };
    html_url: string;
    author?: { login: string };
  }>;
  const source = `${owner}/${repo}`;

  if (!pathPrefix) {
    return data.map((c) => ({
      id: `commit-${c.sha}`,
      source,
      title: (c.commit.message || "No message").split("\n")[0]!.slice(0, 200),
      link: c.html_url,
      published: c.commit.author?.date,
      body: c.commit.message ?? undefined,
      metadata: {
        sha: c.sha,
        author: c.author?.login ?? c.commit.author?.name,
      },
    }));
  }

  const filtered: NormalizedEvent[] = [];
  const limit = 10;
  for (const c of data) {
    if (filtered.length >= limit) break;
    const detailUrl = `https://api.github.com/repos/${owner}/${repo}/commits/${c.sha}`;
    const dr = await fetch(detailUrl, { headers });
    if (!dr.ok) continue;
    const detail = (await dr.json()) as { files?: Array<{ filename: string }> };
    const files = detail.files ?? [];
    const touches = files.some((f) => f.filename.startsWith(pathPrefix));
    if (touches) {
      filtered.push({
        id: `commit-${c.sha}`,
        source,
        title: (c.commit.message || "No message").split("\n")[0]!.slice(0, 200),
        link: c.html_url,
        published: c.commit.author?.date,
        body: c.commit.message ?? undefined,
        metadata: {
          sha: c.sha,
          author: c.author?.login ?? c.commit.author?.name,
          pathPrefix,
        },
      });
    }
  }
  return filtered;
}
