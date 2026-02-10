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
});
export type SubscriptionFilters = z.infer<typeof subscriptionFiltersSchema>;

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
