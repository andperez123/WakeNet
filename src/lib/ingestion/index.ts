import type { FeedConfig, FeedType, NormalizedEvent } from "../types";
import { pollRss } from "./rss";
import { pollGithubReleases } from "./github-releases";
import { pollHttpJson } from "./http-json";
import { pollGithubCommits } from "./github-commits";
import { pollGithubPullRequests } from "./github-pull-requests";
import { pollSitemap } from "./sitemap";
import { pollHtmlChange } from "./html-change";

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
    case "webhook_inbox":
      return []; // no polling; events arrive via POST /api/ingest/webhook/:token
    case "github_commits":
      if (!("owner" in config) || !("repo" in config))
        throw new Error("github_commits config requires owner and repo");
      return pollGithubCommits(
        config.owner,
        config.repo,
        "branch" in config ? config.branch : undefined,
        "pathPrefix" in config ? config.pathPrefix : undefined
      );
    case "github_pull_requests":
      if (!("owner" in config) || !("repo" in config))
        throw new Error("github_pull_requests config requires owner and repo");
      return pollGithubPullRequests(
        config.owner,
        config.repo,
        "state" in config ? config.state : undefined,
        "labels" in config ? config.labels : undefined,
        "base" in config ? config.base : undefined
      );
    case "sitemap":
      if (!("url" in config)) throw new Error("sitemap config requires url");
      return pollSitemap(
        config.url,
        "mode" in config ? config.mode : undefined,
        "include" in config ? config.include : undefined,
        "exclude" in config ? config.exclude : undefined
      );
    case "html_change":
      if (!("url" in config)) throw new Error("html_change config requires url");
      return pollHtmlChange(
        config.url,
        "marker" in config ? config.marker : "selector" in config ? config.selector : undefined,
        "mode" in config ? config.mode : undefined
      );
    default:
      throw new Error(`Unknown feed type: ${type}`);
  }
}

export { pollRss, pollGithubReleases, pollHttpJson, pollGithubCommits, pollGithubPullRequests, pollSitemap, pollHtmlChange };
