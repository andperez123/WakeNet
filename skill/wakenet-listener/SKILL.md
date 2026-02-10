---
name: wakenet-listener
description: Subscribe to WakeNet for event-driven agent wake. Use when the user wants to replace polling with push-based signals, receive RSS/GitHub/HTTP events at a webhook, or integrate WakeNet with their OpenClaw/Clawdbot.
metadata: {"openclaw":{"homepage":"https://wake-net.vercel.app","emoji":"📡"}}
---

# WakeNet listener

WakeNet delivers normalized, deduplicated events to a webhook so agents run only when something new happens (no polling).

## When to use

- User wants their agent to react to RSS feeds, GitHub releases, or HTTP JSON.
- User wants to replace cron/polling with push-based wake.
- User asks how to receive WakeNet events or verify webhook signatures.

## Quick flow

1. **Create a feed** (WakeNet API or [Admin](https://wake-net.vercel.app/admin)):
   - `POST https://wake-net.vercel.app/api/feeds` with `{ "type": "rss"|"github_releases"|"http_json", "config": { ... } }`.
2. **Create a subscription** with the user's webhook URL. Save the returned `secret`; it is shown only once.
3. **Verify incoming webhooks** using the raw body and `x-wakenet-signature` (HMAC-SHA256 of body with `secret`).

## Webhook verification (Node)

Use the **raw request body** for verification, then parse JSON.

```js
const crypto = require("crypto");
function verify(rawBody, signature, secret) {
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return signature.length === expected.length && crypto.timingSafeEqual(Buffer.from(signature,"utf8"), Buffer.from(expected,"utf8"));
}
// In handler: if (!verify(req.body.toString(), req.headers["x-wakenet-signature"], process.env.WAKENET_SUBSCRIPTION_SECRET)) return res.status(401).end();
const payload = JSON.parse(req.body.toString());
// payload.event: { id, source, title, link, published, body, metadata }
```

## Payload shape

- `id`, `feedId`, `event`, `deliveredAt`
- `event`: `id`, `source`, `title`, `link`, `published`, `body`, `metadata`

## Links

- Docs and API: https://wake-net.vercel.app/docs
- Clawdbot example (Express + Next.js): https://wake-net.vercel.app/docs/clawdbot-example
- Admin (feeds/subscriptions): https://wake-net.vercel.app/admin
