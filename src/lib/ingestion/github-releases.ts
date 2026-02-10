import type { NormalizedEvent } from "../types";

export async function pollGithubReleases(
  owner: string,
  repo: string
): Promise<NormalizedEvent[]> {
  const url = `https://api.github.com/repos/${owner}/${repo}/releases`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "WakeNet/1.0",
    },
  });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  const data = (await res.json()) as Array<{
    id: number;
    tag_name: string;
    name: string;
    body: string | null;
    html_url: string;
    published_at: string;
    author?: { login: string };
  }>;
  const source = `${owner}/${repo}`;
  return data.map((r) => ({
    id: `github-${r.id}`,
    source,
    title: r.name || r.tag_name,
    link: r.html_url,
    published: r.published_at,
    body: r.body ?? undefined,
    metadata: {
      tag: r.tag_name,
      author: r.author?.login,
    },
  }));
}
