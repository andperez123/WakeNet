---
name: wakenet-listener
description: Subscribe to WakeNet for event-driven agent wake. Use when the user wants to replace polling with push-based signals, receive RSS/GitHub/HTTP events at a webhook, or integrate WakeNet with their OpenClaw/Clawdbot.
metadata: {"openclaw":{"homepage":"https://wake-net.vercel.app","emoji":"📡"}}
---

# WakeNet listener

WakeNet delivers normalized, deduplicated events to a webhook or via pull so agents run only when something new happens (no polling). **WakeNet works out of the box with no API key**; authentication is optional and only required if the server enforces it.

## Required environment (MCP / API)

Canonical env (single source of truth):

| Variable | Required | Purpose |
|----------|----------|---------|
| `WAKENET_BASE_URL` | No (default: https://wake-net.vercel.app) | Base URL of WakeNet instance |
| `WAKENET_API_KEY` | Yes if server enforces it | Bearer token for create feed/subscription, poll |
| `WAKENET_SUBSCRIPTION_ID` | For pull mode | Pull-enabled subscription UUID; use with pull endpoint or `wakenet_pull_events` |
| `WAKENET_SUBSCRIPTION_SECRET` | For webhook mode | Subscription secret (from create subscription); use for HMAC verification |

**Health / smoke test:** Run `wakenet_health` then `wakenet_smoketest` to verify URL + API key + feed + subscription + poll + pull.

---

## MCP integration (recommended)

Wire the MCP server so the agent can call tools without manual API calls.

**1. Add to MCP config** (Cursor, Claude Desktop, or Clawdbot):

```json
{
  "mcpServers": {
    "wakenet": {
      "command": "npx",
      "args": ["tsx", "/path/to/WakeNet/mcp-server/index.ts"],
      "env": {
        "WAKENET_BASE_URL": "https://wake-net.vercel.app",
        "WAKENET_API_KEY": "your-api-key"
      }
    }
  }
}
```

**2. Tools**

| Tool | Use when |
|------|----------|
| `wakenet_health` | Check instance and DB |
| `wakenet_smoketest` | One-shot: create test feed + pull sub, poll, pull — confirms everything works |
| `wakenet_list_feeds` | List feeds |
| `wakenet_create_feed` | Add RSS / GitHub releases / HTTP JSON feed |
| `wakenet_list_subscriptions` | List subscriptions |
| `wakenet_create_subscription` | Create subscription (webhook or pull) |
| `wakenet_ensure_subscription` | Idempotent: find by name+feedId, create only if missing (avoids duplicates) |
| `wakenet_list_events` | Browse events (optional feedId) |
| `wakenet_poll_feed` | Trigger poll for a feed |
| `wakenet_pull_events` | Pull events for a pull-enabled subscription |

**3. Common workflows**

- **Pull-only agent (no webhook):** `wakenet_create_feed` → `wakenet_ensure_subscription` (name, feedId, pullEnabled: true) → `wakenet_poll_feed` → `wakenet_pull_events` (subscriptionId). Store subscription ID for the pull loop.
- **Webhook agent:** `wakenet_create_feed` → `wakenet_create_subscription` (webhookUrl, name, feedId). Save returned `secret` for verification.
- **Re-run setup safely:** Use `wakenet_ensure_subscription` instead of `wakenet_create_subscription` so the same name+feedId returns the existing subscription instead of creating a second one.

**4. Errors → fixes**

| Symptom | Fix |
|---------|-----|
| 401 on create feed/subscription/poll | Set `WAKENET_API_KEY` in MCP env (and on server). |
| 503 / "Database not configured" | WakeNet instance has no DB or env; check server. |
| Pull returns [] | Subscription is pull-enabled but no events yet; run `wakenet_poll_feed` for that feed, then pull again. |
| Duplicate subscriptions | Use `wakenet_ensure_subscription` next time, or create with a unique name. |

---

## Golden-path payloads (exact shapes)

Must match deployed API. Subscription: `name` required; `pullEnabled` is **top-level**, not under config.

**Create feed (RSS)**  
`POST /api/feeds`  
`{ "type": "rss", "config": { "url": "https://example.com/feed.xml" } }`  
Optional: `pollIntervalMinutes` (default 15).

**Create feed (GitHub releases)**  
`{ "type": "github_releases", "config": { "owner": "vercel", "repo": "next.js" } }`

**Create subscription (pull-only)**  
`POST /api/subscriptions`  
`{ "feedId": "<uuid>", "name": "My pull sub", "pullEnabled": true }`  
No `webhookUrl`. `pullEnabled` is top-level.

**Create subscription (webhook)**  
`{ "feedId": "<uuid>", "name": "My webhook sub", "webhookUrl": "https://your-agent.com/webhook", "pullEnabled": false }`  
Save the returned `secret` for `x-wakenet-signature` verification.

**Promoter (webhook)**  
`{ "feedId": "<uuid>", "name": "Promoter", "webhookUrl": "https://...", "pullEnabled": false, "outputFormat": "promoter", "filters": { "includeKeywords": ["release", "security"], "minScore": 10 }, "deliveryMode": "immediate" }`

---

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

**Rotating secrets:** Create a new subscription (same feed), point your app at the new secret, then remove or disable the old subscription in Admin.

**Cloudflare Workers (minimal)**  
Read raw body, verify HMAC-SHA256, reject 401 on mismatch, parse JSON:

```js
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export default {
  async fetch(req, env) {
    if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
    const rawBody = await req.text();
    const sig = req.headers.get("x-wakenet-signature");
    const secret = env.WAKENET_SUBSCRIPTION_SECRET;
    if (!sig || !secret) return new Response("Unauthorized", { status: 401 });
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const buf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
    const expected = Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
    if (!timingSafeEqual(sig, expected)) return new Response("Invalid signature", { status: 401 });
    const payload = JSON.parse(rawBody);
    // handle payload.event
    return new Response("OK", { status: 200 });
  },
};
```

---

## Pull loop (reference)

For pull-only agents: every N minutes call `GET /api/subscriptions/:subscriptionId/pull`. Dedupe by `eventId` (or deliveryId). Optional: store last `createdAt` or cursor. See repo `examples/pull-loop.ts` for a minimal script.

---

## Payload shapes

**Default webhook:** `id`, `feedId`, `event`, `deliveredAt`. `event`: `id`, `source`, `title`, `link`, `published`, `body`, `metadata`.

**Promoter:** `type`, `title`, `summary`, `url`, `source`, `published_at`, `eventId`, `deliveredAt`.

---

## Links

- Docs and API: https://wake-net.vercel.app/docs
- Clawdbot example (Express + Next.js): https://wake-net.vercel.app/docs/clawdbot-example
- MCP server + examples: https://github.com/andperez123/WakeNet/tree/main/mcp-server
- Admin: https://wake-net.vercel.app/admin
