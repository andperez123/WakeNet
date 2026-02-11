import type { NormalizedEvent } from "../types";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const headers: HeadersInit = {
  Accept: "application/vnd.github.v3+json",
  "User-Agent": "WakeNet/1.0",
};
if (GITHUB_TOKEN) (headers as Record<string, string>)["Authorization"] = `Bearer ${GITHUB_TOKEN}`;

export async function pollGithubPullRequests(
  owner: string,
  repo: string,
  state?: "open" | "closed" | "all",
  labels?: string[],
  base?: string
): Promise<NormalizedEvent[]> {
  const params = new URLSearchParams();
  params.set("per_page", "30");
  if (state) params.set("state", state);
  if (base) params.set("base", base);
  const url = `https://api.github.com/repos/${owner}/${repo}/pulls?${params}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  const data = (await res.json()) as Array<{
    number: number;
    state: string;
    title: string;
    html_url: string;
    user?: { login: string };
    created_at: string;
    updated_at: string;
    merged_at: string | null;
    labels?: Array<{ name: string }>;
    base?: { ref: string };
  }>;
  const source = `${owner}/${repo}`;

  let list = data;
  if (labels?.length) {
    const set = new Set(labels.map((l) => l.toLowerCase()));
    list = data.filter((pr) => pr.labels?.some((l) => set.has(l.name.toLowerCase())));
  }

  return list.map((pr) => ({
    id: `pr-${pr.number}`,
    source,
    title: pr.title,
    link: pr.html_url,
    published: pr.updated_at || pr.created_at,
    body: undefined,
    metadata: {
      prNumber: pr.number,
      state: pr.state,
      author: pr.user?.login,
      createdAt: pr.created_at,
      mergedAt: pr.merged_at ?? undefined,
      base: pr.base?.ref,
    },
  }));
}
