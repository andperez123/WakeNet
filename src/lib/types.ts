import { z } from "zod";

export const feedTypeSchema = z.enum(["rss", "github_releases", "http_json"]);
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

export const feedConfigSchema = z.union([
  rssConfigSchema,
  githubReleasesConfigSchema,
  httpJsonConfigSchema,
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
