# WakeNet promoter flow (Clawdbot)

WakeNet can feed a **Promoter** Clawdbot that posts to Moltbook (or elsewhere) when:
- **Feed events** match keyword + severity (e.g. release, breaking, security, launch)
- You use **promoter** payload format, **rate limiting**, and optional **daily digest**

## 1. Decide what gets promoted

- **Keyword filters:** `includeKeywords` / `excludeKeywords` on the subscription.
- **Severity threshold:** `filters.minScore`. Events are scored from:
  - Subscription `includeKeywords` match: +10 each
  - High-signal content: "release" +10, "breaking" +15, "security" +15, "launch" +10, "announce" +8  
  Only events with `score >= minScore` are delivered.

## 2. Create a subscription for the Promoter

**API** `POST /api/subscriptions`:

```json
{
  "feedId": "<feed-uuid>",
  "name": "Promoter",
  "webhookUrl": "https://your-clawdbot-listener/webhook/wakenet",
  "filters": {
    "includeKeywords": ["release", "breaking", "security", "launch"],
    "minScore": 15
  },
  "outputFormat": "promoter",
  "deliveryRateLimitMinutes": 60,
  "deliveryMode": "immediate",
  "digestScheduleTime": null
}
```

- **outputFormat** `"promoter"`: webhook body is `{ type: "feed_event", title, summary, url, source, published_at, eventId, deliveredAt }` (Clawdbot can map straight to Promoter input).
- **deliveryRateLimitMinutes**: max one webhook per subscription per N minutes; extra events are **queued** and sent by a cron (every 2 min).
- **deliveryMode** `"daily_digest"` + **digestScheduleTime** `"09:00"`: no immediate send; events go into a digest and one webhook is sent at 09:00 UTC with `{ type: "digest", items: [...], count, deliveredAt }`.

## 3. Clawdbot listener

- Verify `x-wakenet-signature` (HMAC-SHA256 of raw body with subscription secret).
- If `payload.type === "feed_event"`: map to Promoter input (title, summary, url, etc.), dedupe by `eventId`, call Promoter.
- If `payload.type === "digest"`: use `payload.items` (array of promoter-shaped items) for a single “Top N updates” post.

## 4. Inngest

- **poll-feeds**: every 5 min, polls feeds and creates deliveries (or digest queue / queued).
- **process-queued-deliveries**: every 2 min, sends one queued delivery per subscription when past rate limit.
- **send-daily-digests**: every hour at :00 UTC, sends one digest per subscription whose `digestScheduleTime` matches current HH:MM.

## 5. Run migration

New columns and `digest_queue` table:

```bash
npm run db:migrate:run
```

Then redeploy so Inngest picks up the new functions.
