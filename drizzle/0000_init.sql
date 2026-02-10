CREATE TABLE IF NOT EXISTS "feeds" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "type" text NOT NULL,
  "config" jsonb NOT NULL,
  "poll_interval_minutes" integer DEFAULT 15 NOT NULL,
  "last_polled_at" timestamp with time zone,
  "enabled" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "subscriptions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "feed_id" uuid NOT NULL REFERENCES "feeds"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "webhook_url" text,
  "pull_enabled" boolean DEFAULT false NOT NULL,
  "filters" jsonb,
  "secret" text NOT NULL,
  "enabled" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "feed_id" uuid NOT NULL REFERENCES "feeds"("id") ON DELETE CASCADE,
  "external_id" text NOT NULL,
  "content_hash" text NOT NULL,
  "score" integer DEFAULT 0 NOT NULL,
  "normalized" jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "events_feed_hash_idx" ON "events" ("feed_id", "content_hash");

CREATE TABLE IF NOT EXISTS "deliveries" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "subscription_id" uuid NOT NULL REFERENCES "subscriptions"("id") ON DELETE CASCADE,
  "event_id" uuid NOT NULL REFERENCES "events"("id") ON DELETE CASCADE,
  "status" text NOT NULL,
  "response_code" integer,
  "retries" integer DEFAULT 0 NOT NULL,
  "last_attempt_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
