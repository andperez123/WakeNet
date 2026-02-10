import Parser from "rss-parser";
import type { NormalizedEvent } from "../types";

const parser = new Parser();

export async function pollRss(url: string): Promise<NormalizedEvent[]> {
  const feed = await parser.parseURL(url);
  const source = feed.title ?? feed.link ?? url;
  const events: NormalizedEvent[] = (feed.items ?? []).map((item, i) => ({
    id: item.guid ?? item.link ?? `rss-${i}-${Date.now()}`,
    source,
    title: item.title ?? "",
    link: item.link,
    published: item.pubDate ?? item.isoDate,
    body: item.contentSnippet ?? item.content,
    metadata: {
      creator: item.creator,
      categories: item.categories,
    },
  }));
  return events;
}
