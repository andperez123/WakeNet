import type { NormalizedEvent } from "../types";

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": "WakeNet/1.0" } });
  if (!res.ok) throw new Error(`Sitemap fetch failed: ${res.status} ${url}`);
  return res.text();
}

function resolveLoc(loc: string, baseUrl: string): string {
  if (loc.startsWith("http")) return loc;
  if (loc.startsWith("/")) return new URL(loc, baseUrl).href;
  return new URL(loc, baseUrl).href;
}

/** Parse sitemap index: returns list of child sitemap URLs. */
function parseSitemapIndex(xml: string, baseUrl: string): string[] {
  const sitemaps: string[] = [];
  const locRe = /<loc>([^<]+)<\/loc>/gi;
  let m: RegExpExecArray | null;
  while ((m = locRe.exec(xml)) !== null) {
    sitemaps.push(resolveLoc(m[1]!.trim(), baseUrl));
  }
  return sitemaps;
}

/** Parse urlset: returns entries with loc and optional lastmod (for "changed page" detection). */
function parseUrlset(xml: string, baseUrl: string): { loc: string; lastmod?: string }[] {
  const entries: { loc: string; lastmod?: string }[] = [];
  const urlBlockRe = /<url>([\s\S]*?)<\/url>/gi;
  let block: RegExpExecArray | null;
  while ((block = urlBlockRe.exec(xml)) !== null) {
    const inner = block[1] ?? "";
    const locM = /<loc>([^<]+)<\/loc>/i.exec(inner);
    const lastmodM = /<lastmod>([^<]*)<\/lastmod>/i.exec(inner);
    if (locM) {
      const loc = resolveLoc(locM[1]!.trim(), baseUrl);
      const lastmod = lastmodM ? lastmodM[1]!.trim() || undefined : undefined;
      entries.push({ loc, lastmod });
    }
  }
  return entries;
}

export async function pollSitemap(
  url: string,
  mode?: "index" | "urls",
  include?: string[],
  exclude?: string[]
): Promise<NormalizedEvent[]> {
  const baseUrl = url.replace(/\/[^/]*$/, "/");
  const xml = await fetchText(url);
  const isIndex = /<sitemapindex/i.test(xml);

  let entries: { loc: string; lastmod?: string }[] = [];

  if (isIndex && mode !== "urls") {
    const sitemaps = parseSitemapIndex(xml, baseUrl);
    for (const sm of sitemaps.slice(0, 50)) {
      try {
        const subXml = await fetchText(sm);
        entries = entries.concat(parseUrlset(subXml, baseUrl));
      } catch {
        // skip failed sitemap
      }
    }
  } else {
    entries = parseUrlset(xml, baseUrl);
  }

  if (include?.length) {
    entries = entries.filter((e) => include.some((p) => e.loc.includes(p)));
  }
  if (exclude?.length) {
    entries = entries.filter((e) => !exclude.some((p) => e.loc.includes(p)));
  }

  const seen = new Set<string>();
  return entries
    .filter((e) => {
      const key = e.lastmod ? `${e.loc}\t${e.lastmod}` : e.loc;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((e) => {
      const id = e.lastmod ? `sitemap-${e.loc}-${e.lastmod}` : `sitemap-${e.loc}`;
      return {
        id,
        source: url,
        title: e.loc,
        link: e.loc,
        published: e.lastmod,
        body: undefined,
        metadata: { loc: e.loc, lastmod: e.lastmod },
      };
    });
}
