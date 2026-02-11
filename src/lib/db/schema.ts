import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  integer,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const feeds = pgTable("feeds", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: text("type").notNull(), // rss | github_releases | http_json | github_commits | github_pull_requests | webhook_inbox | sitemap | html_change
  config: jsonb("config").notNull(), // { url?, repo?, path? }
  pollIntervalMinutes: integer("poll_interval_minutes").notNull().default(15),
  lastPolledAt: timestamp("last_polled_at", { withTimezone: true }),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  feedId: uuid("feed_id")
    .notNull()
    .references(() => feeds.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  webhookUrl: text("webhook_url"),
  pullEnabled: boolean("pull_enabled").notNull().default(false),
  filters: jsonb("filters"), // { includeKeywords?, excludeKeywords?, minScore? }
  secret: text("secret").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  outputFormat: text("output_format").notNull().default("default"), // 'default' | 'promoter'
  deliveryRateLimitMinutes: integer("delivery_rate_limit_minutes"),
  deliveryMode: text("delivery_mode").notNull().default("immediate"), // 'immediate' | 'daily_digest'
  digestScheduleTime: text("digest_schedule_time"), // e.g. '09:00' UTC
  lastDeliveryAt: timestamp("last_delivery_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    feedId: uuid("feed_id")
      .notNull()
      .references(() => feeds.id, { onDelete: "cascade" }),
    externalId: text("external_id").notNull(),
    contentHash: text("content_hash").notNull(),
    normalized: jsonb("normalized").notNull(),
    score: integer("score").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("events_feed_hash_idx").on(t.feedId, t.contentHash),
  ]
);

export const deliveries = pgTable("deliveries", {
  id: uuid("id").primaryKey().defaultRandom(),
  subscriptionId: uuid("subscription_id")
    .notNull()
    .references(() => subscriptions.id, { onDelete: "cascade" }),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  status: text("status").notNull(), // 'pending' | 'sent' | 'failed' | 'queued'
  responseCode: integer("response_code"),
  retries: integer("retries").notNull().default(0),
  lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const digestQueue = pgTable("digest_queue", {
  id: uuid("id").primaryKey().defaultRandom(),
  subscriptionId: uuid("subscription_id")
    .notNull()
    .references(() => subscriptions.id, { onDelete: "cascade" }),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Feed = typeof feeds.$inferSelect;
export type NewFeed = typeof feeds.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type Delivery = typeof deliveries.$inferSelect;
export type NewDelivery = typeof deliveries.$inferInsert;
export type DigestQueue = typeof digestQueue.$inferSelect;
export type NewDigestQueue = typeof digestQueue.$inferInsert;
