import type { FeedConfig, FeedType, NormalizedEvent } from "../types";
import { pollRss } from "./rss";
import { pollGithubReleases } from "./github-releases";
import { pollHttpJson } from "./http-json";

export async function pollFeed(
  type: FeedType,
  config: FeedConfig
): Promise<NormalizedEvent[]> {
  switch (type) {
    case "rss":
      if (!("url" in config)) throw new Error("RSS config requires url");
      return pollRss(config.url);
    case "github_releases":
      if (!("owner" in config) || !("repo" in config))
        throw new Error("GitHub config requires owner and repo");
      return pollGithubReleases(config.owner, config.repo);
    case "http_json":
      if (!("url" in config)) throw new Error("HTTP JSON config requires url");
      return pollHttpJson(config.url, "path" in config ? config.path : undefined);
    default:
      throw new Error(`Unknown feed type: ${type}`);
  }
}

export { pollRss, pollGithubReleases, pollHttpJson };
