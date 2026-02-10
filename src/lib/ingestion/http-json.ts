import type { NormalizedEvent } from "../types";

function getAtPath(obj: unknown, path: string): unknown {
  const parts = path.split(".");
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

export async function pollHttpJson(
  url: string,
  pathToArray?: string
): Promise<NormalizedEvent[]> {
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as unknown;
  const rawItems = pathToArray
    ? (getAtPath(data, pathToArray) as unknown[])
    : Array.isArray(data)
      ? data
      : [data];
  if (!Array.isArray(rawItems)) return [];

  const source = url;
  return rawItems.map((item: unknown, i: number) => {
    const o = item as Record<string, unknown>;
    const id = String(o.id ?? o.guid ?? o.url ?? i);
    const title = String(o.title ?? o.name ?? o.subject ?? id);
    const link = typeof o.url === "string" ? o.url : typeof o.link === "string" ? o.link : undefined;
    const published = typeof o.published_at === "string" ? o.published_at : typeof o.pubDate === "string" ? o.pubDate : undefined;
    const body = typeof o.body === "string" ? o.body : typeof o.content === "string" ? o.content : undefined;
    return {
      id,
      source,
      title,
      link,
      published,
      body,
      metadata: o,
    } as NormalizedEvent;
  });
}
