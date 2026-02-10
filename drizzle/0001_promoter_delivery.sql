-- Promoter flow: output format, rate limit, digest mode, digest queue
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "output_format" text NOT NULL DEFAULT 'default';
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "delivery_rate_limit_minutes" integer;
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "delivery_mode" text NOT NULL DEFAULT 'immediate';
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "digest_schedule_time" text;
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "last_delivery_at" timestamp with time zone;

CREATE TABLE IF NOT EXISTS "digest_queue" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "subscription_id" uuid NOT NULL REFERENCES "subscriptions"("id") ON DELETE CASCADE,
  "event_id" uuid NOT NULL REFERENCES "events"("id") ON DELETE CASCADE,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Allow 'queued' status on deliveries
-- (no schema change needed if status is just a string)
