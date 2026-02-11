import { createHash } from "crypto";
import type { NormalizedEvent } from "../types";

export async function pollHtmlChange(
  url: string,
  marker?: string,
  mode?: "etag" | "hash" | "both"
): Promise<NormalizedEvent[]> {
  const res = await fetch(url, { headers: { "User-Agent": "WakeNet/1.0" } });
  if (!res.ok) throw new Error(`HTML fetch failed: ${res.status} ${url}`);
  const body = await res.text();
  const etag = res.headers.get("etag") ?? "";
  const lastMod = res.headers.get("last-modified") ?? "";

  const useEtag = mode !== "hash";
  const useHash = mode !== "etag";
  let contentToHash = "";
  if (useEtag) contentToHash += etag + lastMod;
  if (useHash) {
    let slice = body;
    if (marker) {
      const idx = body.indexOf(marker);
      if (idx >= 0) {
        const start = Math.max(0, idx - 500);
        slice = body.slice(start, idx + 2000);
      }
    }
    contentToHash += createHash("sha256").update(slice).digest("hex");
  }
  const id = createHash("sha256").update(contentToHash || url).digest("hex");
  const now = new Date().toISOString();

  return [
    {
      id: `html-${id}`,
      source: url,
      title: "Page changed",
      link: url,
      published: now,
      body: undefined,
      metadata: { etag: etag || undefined, lastModified: lastMod || undefined },
    },
  ];
}
