import { z } from "zod";

export const feedTypeSchema = z.enum([
  "rss",
  "github_releases",
  "http_json",
  "github_commits",
  "github_pull_requests",
  "webhook_inbox",
  "sitemap",
  "html_change",
]);
export type FeedType = z.infer<typeof feedTypeSchema>;

export const rssConfigSchema = z.object({ url: z.string().url() });
export const githubReleasesConfigSchema = z.object({
  owner: z.string(),
  repo: z.string(),
});
export const httpJsonConfigSchema = z.object({
  url: z.string().url(),
  path: z.string().optional(), // JSONPath to array, e.g. "items"
});

export const githubCommitsConfigSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  branch: z.string().optional(),
  pathPrefix: z.string().optional(),
});
export const githubPullRequestsConfigSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  state: z.enum(["open", "closed", "all"]).optional(),
  labels: z.array(z.string()).optional(),
  base: z.string().optional(),
});
export const webhookInboxConfigSchema = z.object({
  token: z.string().min(1).optional(),
  secret: z.string().min(1).optional(),
}).refine((c) => !!(c.token ?? c.secret), { message: "token or secret required" });
export const sitemapConfigSchema = z.object({
  url: z.string().url(),
  mode: z.enum(["index", "urls"]).optional(),
  include: z.array(z.string()).optional(),
  exclude: z.array(z.string()).optional(),
});
export const htmlChangeConfigSchema = z.object({
  url: z.string().url(),
  /** Optional substring/anchor in the HTML to hash (only that region). Not a CSS selector. */
  marker: z.string().optional(),
  mode: z.enum(["etag", "hash", "both"]).optional(),
});

export const feedConfigSchema = z.union([
  rssConfigSchema,
  githubReleasesConfigSchema,
  httpJsonConfigSchema,
  githubCommitsConfigSchema,
  githubPullRequestsConfigSchema,
  webhookInboxConfigSchema,
  sitemapConfigSchema,
  htmlChangeConfigSchema,
]);
export type FeedConfig = z.infer<typeof feedConfigSchema>;

export const subscriptionFiltersSchema = z.object({
  includeKeywords: z.array(z.string()).optional(),
  excludeKeywords: z.array(z.string()).optional(),
  minScore: z.number().int().min(0).optional(),
});
export type SubscriptionFilters = z.infer<typeof subscriptionFiltersSchema>;

/** Promoter-style payload for Clawdbot (skill_release | feed_event) */
export const promoterPayloadSchema = z.object({
  type: z.enum(["feed_event", "skill_release"]),
  title: z.string(),
  summary: z.string(),
  url: z.string().optional(),
  tags: z.array(z.string()).optional(),
  source: z.string().optional(),
  published_at: z.string().optional(),
  eventId: z.string().optional(),
});
export type PromoterPayload = z.infer<typeof promoterPayloadSchema>;

export const normalizedEventSchema = z.object({
  id: z.string(),
  source: z.string(),
  title: z.string(),
  link: z.string().optional(),
  published: z.string().optional(),
  body: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type NormalizedEvent = z.infer<typeof normalizedEventSchema>;
