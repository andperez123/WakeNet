# WakeNet → Your Clawdbot (and other Clawdbots)

Rundown of where things are and what you need to do to open WakeNet up to your Clawdbot and eventually other Clawdbots.

---

## Where we are

| Piece | Status | Notes |
|-------|--------|--------|
| **WakeNet app** | Live | https://wake-net.vercel.app — feeds, subscriptions, events, webhooks, promoter flow |
| **Inngest** | Connected | Polls every 5 min, queued delivery every 2 min, daily digest every hour |
| **Admin UI** | Live | `/admin` — create feeds/subscriptions, poll, view events (optional `ADMIN_SECRET`) |
| **API key** | Optional | Set `WAKENET_API_KEY` in Vercel to lock POST endpoints; GET stays open |
| **MCP server** | In repo | `mcp-server/` — 8 tools so any MCP agent can call WakeNet |
| **Skill** | In repo | `skill/wakenet-listener/` — AgentSkills-compatible, teaches Clawdbots how to use WakeNet |
| **Pull endpoint** | Working | `GET /api/subscriptions/{id}/pull` for agents without a webhook |

---

## What you need to do for YOUR Clawdbot

### 1. Give your Clawdbot a way to receive events

**Option A — Webhook (push)**  
Your Clawdbot must expose a public URL that WakeNet can POST to.

- Deploy something that has a route like `POST /webhook/wakenet` (or whatever URL you’ll register).
- Implement verification: read **raw body**, check `x-wakenet-signature` (HMAC-SHA256 of body with your subscription `secret`), then parse JSON.
- Code: [docs/SETUP.md](SETUP.md) and [/docs/clawdbot-example](https://wake-net.vercel.app/docs/clawdbot-example) (Express + Next.js examples).
- Store the subscription `secret` in env (e.g. `WAKENET_SUBSCRIPTION_SECRET`). You get it **once** when you create the subscription.

**Option B — Pull (no webhook)**  
If your Clawdbot can’t host a webhook:

- Create a subscription with `pullEnabled: true` and no `webhookUrl`.
- Your Clawdbot (or a cron) calls `GET https://wake-net.vercel.app/api/subscriptions/{subscriptionId}/pull` to fetch new events.
- Events appear there after each feed poll.

### 2. Create feeds + subscriptions (choose one path)

**Path 1 — Admin UI (easiest)**  
- Go to https://wake-net.vercel.app/admin (unlock with `ADMIN_SECRET` if set).
- Create feeds (RSS, GitHub Releases, HTTP JSON).
- Create a subscription per feed: set your webhook URL (or leave blank and enable pull), set filters/promoter options if you want.
- Copy the `secret` from the subscription response (only shown once) into your Clawdbot’s env.

**Path 2 — MCP (if your Clawdbot uses MCP)**  
- Add the WakeNet MCP server to your Clawdbot’s MCP config (e.g. Cursor or the Clawdbot runtime).
- Config example (use your WakeNet repo path and optional API key):

```json
{
  "mcpServers": {
    "wakenet": {
      "command": "npx",
      "args": ["tsx", "/path/to/WakeNet/mcp-server/index.ts"],
      "env": {
        "WAKENET_URL": "https://wake-net.vercel.app",
        "WAKENET_API_KEY": "your-api-key"
      }
    }
  }
}
```

- Then your Clawdbot can call `wakenet_create_feed`, `wakenet_create_subscription`, `wakenet_list_events`, `wakenet_poll_feed`, `wakenet_pull_events`, etc., without you writing API calls by hand.

**Path 3 — REST API**  
- `POST /api/feeds` and `POST /api/subscriptions` with the right JSON (see [README](../README.md) and `/docs`).
- If you set `WAKENET_API_KEY` on the server, send `Authorization: Bearer <WAKENET_API_KEY>` on POSTs.

### 3. Optional: lock the API

- In Vercel → Project → Settings → Environment Variables, add `WAKENET_API_KEY` (e.g. a long random string).
- Redeploy. After that, only requests with that Bearer token (or from the Admin UI with the admin cookie) can create/update feeds and subscriptions and trigger polls.
- Give this key only to your own Clawdbot (and any trusted parties). Don’t put it in the skill or in public docs.

### 4. Install the WakeNet skill in your Clawdbot (optional but useful)

- Copy the skill so your Clawdbot “knows” how to use WakeNet:

```bash
cp -r skill/wakenet-listener ~/.openclaw/skills/
# or your Clawdbot’s skills dir
```

- The skill describes when to use WakeNet, MCP setup, webhook verification, promoter payload, and links to docs. No code runs automatically; it just guides the agent.

---

## What OTHER Clawdbots need to do

They have the same two choices you do: **receive events** (webhook or pull) and **create/manage feeds and subscriptions** (Admin, MCP, or API).

### If you’re sharing YOUR WakeNet instance (wake-net.vercel.app)

- **Option 1 — You create everything for them**  
  You use Admin (or API) to create feeds and subscriptions with *their* webhook URL (or pull-enabled subs). You send them the subscription `secret` (for webhook) or the subscription ID (for pull). They implement verification or pull in their Clawdbot.

- **Option 2 — They use the API with a shared key**  
  You set `WAKENET_API_KEY` and give it to trusted Clawdbot owners. They call `POST /api/feeds` and `POST /api/subscriptions` (with `Authorization: Bearer <key>`) and implement webhook verification or pull on their side.

- **Option 3 — They use MCP**  
  They add the WakeNet MCP server pointing at `https://wake-net.vercel.app` and use your `WAKENET_API_KEY` in `env`. Their agent then uses the `wakenet_*` tools against your instance.

Important: Right now there is **no per-user isolation**. All Clawdbots using your instance see the same feeds and subscriptions. So sharing the API key means they can create/change/delete any feed or subscription. For “other Clawdbots” in a trusted group, that’s fine; for a public product you’d add multi-tenant auth later.

### If they run their own WakeNet instance

- They deploy WakeNet (e.g. fork + Vercel + Neon + Inngest) and use it for their own Clawdbot only.
- They can still install the same skill from your repo so their agent knows how to use WakeNet (their URL, their API key, their MCP config).

---

## One-page checklist for “open to my Clawdbot”

- [ ] Clawdbot has a **webhook endpoint** (with HMAC verification) **or** you use **pull-only** subscriptions.
- [ ] Feeds and subscriptions exist: created via **Admin**, **MCP**, or **REST API**.
- [ ] Subscription **secret** (webhook) or **subscription ID** (pull) is in the Clawdbot’s config/env.
- [ ] (Optional) `WAKENET_API_KEY` set in Vercel and used by your Clawdbot for API/MCP.
- [ ] (Optional) WakeNet skill installed in your Clawdbot’s skills dir so the agent can guide users.

---

## One-page checklist for “open to other Clawdbots”

- [ ] You decided: **shared instance** (you run WakeNet for everyone) vs **they run their own**.
- [ ] If shared: **API key** set and shared only with trusted Clawdbots; they use Admin, API, or MCP with that key.
- [ ] If shared: each Clawdbot gets a **subscription** (webhook URL or pull-enabled) and the **secret** or **subscription ID**.
- [ ] Skill (and optionally MCP server) is **easy to get**: repo link, and eventually `clawhub install wakenet/wakenet-listener` when you publish.
- [ ] Docs are clear: [SETUP.md](SETUP.md), [README](../README.md), [wake-net.vercel.app/docs](https://wake-net.vercel.app/docs), and this file.

---

## Links

| What | Where |
|------|--------|
| WakeNet app | https://wake-net.vercel.app |
| Docs + API | https://wake-net.vercel.app/docs |
| Clawdbot webhook example | https://wake-net.vercel.app/docs/clawdbot-example |
| Admin | https://wake-net.vercel.app/admin |
| Repo (skill + MCP) | https://github.com/andperez123/WakeNet |
| Inngest + webhook verification | [SETUP.md](SETUP.md) |
| Promoter flow | [PROMOTER.md](PROMOTER.md) |
