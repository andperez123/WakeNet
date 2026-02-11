# Set up WakeNet on your Clawdbot

Step-by-step so your Clawdbot can use WakeNet (feeds, subscriptions, events via webhook or pull).

---

## Prerequisites

- Clawdbot installed (e.g. skills dir `~/clawd/Skills`, or your config path).
- WakeNet repo on your machine (e.g. `~/wakenet` or `~/WakeNet`) so you can run the MCP server and copy the skill.
- If the WakeNet server has an API key set: you need that key for creating feeds/subscriptions and polling.

---

## Step 1: Install the WakeNet skill

Copy the **entire** skill folder (so Clawdbot sees both `SKILL.md` and `action.json`):

```bash
# From the WakeNet repo root (e.g. ~/wakenet or ~/WakeNet)
cp -r skill/wakenet-listener ~/clawd/Skills/
```

If your Clawdbot uses a different skills path, use it instead of `~/clawd/Skills/`.

Check:

```bash
ls -la ~/clawd/Skills/wakenet-listener
# Should show: SKILL.md   action.json
```

Restart Clawdbot so it reloads skills, then confirm the skill is listed:

```bash
clawdbot skills list
# Expect: wakenet-listener
```

---

## Step 2: Set environment variables

Use this canonical set (single source of truth):

| Variable | When to set | Example |
|----------|-------------|---------|
| `WAKENET_BASE_URL` | Optional | `https://wake-net.vercel.app` (default) |
| `WAKENET_API_KEY` | If the WakeNet server enforces API key | From Vercel env or your own secret |
| `WAKENET_SUBSCRIPTION_ID` | **Pull mode only** — after you create a pull subscription | UUID from create-subscription response |
| `WAKENET_SUBSCRIPTION_SECRET` | **Webhook mode only** — after you create a webhook subscription | Secret from create-subscription (shown once) |

Where to set them depends on how you run Clawdbot:

- **Systemd / user service:** put in the service env file or `Environment=` lines.
- **Shell / tmux:** `export WAKENET_BASE_URL=...` and `export WAKENET_API_KEY=...` in the same shell where you start Clawdbot.
- **MCP config:** set in the `env` block for the `wakenet` server (Step 3). That only affects MCP tools; if Clawdbot also runs a pull loop or webhook handler, set env for that process too.

---

## Step 3: Add the WakeNet MCP server (recommended)

So your Clawdbot can call WakeNet tools (create feed, ensure subscription, poll, pull, health, smoketest).

Find your Clawdbot MCP config file (e.g. `~/clawd/mcp.json` or wherever Clawdbot reads MCP servers). Add:

```json
{
  "mcpServers": {
    "wakenet": {
      "command": "npx",
      "args": ["tsx", "/ABSOLUTE/PATH/TO/WakeNet/mcp-server/index.ts"],
      "env": {
        "WAKENET_BASE_URL": "https://wake-net.vercel.app",
        "WAKENET_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

Replace:

- `/ABSOLUTE/PATH/TO/WakeNet` with the real path to your WakeNet repo (e.g. `/Users/you/wakenet` or `~/wakenet` — use the full path if your config doesn’t expand `~`).
- `YOUR_API_KEY` with your WakeNet API key if the server requires it; otherwise you can omit `WAKENET_API_KEY`.

Restart Clawdbot so it loads the MCP server. The agent can then use tools like `wakenet_health`, `wakenet_smoketest`, `wakenet_create_feed`, `wakenet_ensure_subscription`, `wakenet_poll_feed`, `wakenet_pull_events`.

---

## Step 4: Create a feed and subscription

You need at least one feed and one subscription (webhook or pull) for your Clawdbot.

### Option A — Admin UI (no MCP needed)

1. Open https://wake-net.vercel.app/admin (unlock with your admin secret if set).
2. **Feeds:** Add a feed (e.g. RSS with URL, or GitHub Releases with owner/repo).
3. **Subscriptions:** Add a subscription:
   - **Pull-only:** Pick the feed, set a name, leave webhook blank, enable **pull** (pull-enabled). Copy the subscription **ID** and set `WAKENET_SUBSCRIPTION_ID` in your Clawdbot env.
   - **Webhook:** Pick the feed, set a name, set **Webhook URL** to your Clawdbot’s endpoint (e.g. `https://your-agent.com/webhook/wakenet`). Copy the **secret** (shown once) and set `WAKENET_SUBSCRIPTION_SECRET` in your Clawdbot env.

### Option B — MCP tools (from the agent or you)

1. Run a quick check: use `wakenet_health`, then `wakenet_smoketest` (creates a test feed + pull sub, polls, pulls; reports pass/fail).
2. Create your real feed, e.g. `wakenet_create_feed` with `type: "rss"`, `config: { url: "https://..." }`.
3. Create or ensure subscription:
   - **Pull:** `wakenet_ensure_subscription` with `feedId`, `name`, `pullEnabled: true`. Use the returned subscription `id` as `WAKENET_SUBSCRIPTION_ID`.
   - **Webhook:** `wakenet_create_subscription` with `feedId`, `name`, `webhookUrl`, `pullEnabled: false`. Save the returned `secret` as `WAKENET_SUBSCRIPTION_SECRET`.

Payloads must match the API: subscription has **top-level** `pullEnabled` and required `name`; feed has `config.url` for RSS.

---

## Step 5: Receive events (webhook or pull)

### If you chose webhook

1. Your Clawdbot (or a service it uses) must expose a public `POST` endpoint (e.g. `/webhook/wakenet`).
2. In the handler:
   - Read the **raw** request body (before JSON parsing).
   - Get header `x-wakenet-signature` and env `WAKENET_SUBSCRIPTION_SECRET`.
   - Compute HMAC-SHA256 of the raw body with that secret; compare with the signature (constant-time). If it doesn’t match, return `401`.
   - Parse the body as JSON and handle `payload.event`.
3. See the skill’s “Webhook verification (Node)” and “Cloudflare Workers” snippets, or https://wake-net.vercel.app/docs/clawdbot-example.

### If you chose pull

1. Set `WAKENET_SUBSCRIPTION_ID` and (optionally) `WAKENET_BASE_URL` in the env of the process that will pull.
2. Either:
   - Have the agent call `wakenet_pull_events` with that subscription ID when it needs events, or
   - Run the reference loop: `npx tsx /path/to/WakeNet/examples/pull-loop.ts` (polls on an interval, dedupes by eventId). See `examples/README.md`.

---

## Step 6: Verify

1. **Skill:** `clawdbot skills list` shows `wakenet-listener`.
2. **MCP:** After restart, the agent should have WakeNet tools; run `wakenet_health` then `wakenet_smoketest`.
3. **Pull:** Call `wakenet_poll_feed` for your feed, then `wakenet_pull_events` for your subscription; you should see events (or an empty list if none yet).
4. **Webhook:** Trigger a poll from Admin or MCP; your webhook URL should receive a POST and verify with `WAKENET_SUBSCRIPTION_SECRET`.

---

## Quick reference

| Goal | Action |
|------|--------|
| Install skill | `cp -r skill/wakenet-listener ~/clawd/Skills/` then restart Clawdbot |
| Env vars | `WAKENET_BASE_URL`, `WAKENET_API_KEY`, `WAKENET_SUBSCRIPTION_ID` (pull), `WAKENET_SUBSCRIPTION_SECRET` (webhook) |
| MCP config | Add `wakenet` server with `command`/`args` to `mcp-server/index.ts` and `env.WAKENET_BASE_URL` / `env.WAKENET_API_KEY` |
| Create feed | Admin UI or `wakenet_create_feed` (payload: `type` + `config.url` for RSS) |
| Create subscription | Admin UI or `wakenet_create_subscription` / `wakenet_ensure_subscription` (payload: `feedId`, `name`, `pullEnabled` top-level) |
| Receive events | Webhook (verify with `x-wakenet-signature` + secret) or pull (`/api/subscriptions/:id/pull` or `wakenet_pull_events`) |

---

## Links

- WakeNet app: https://wake-net.vercel.app  
- Admin: https://wake-net.vercel.app/admin  
- Docs + API: https://wake-net.vercel.app/docs  
- Clawdbot webhook example: https://wake-net.vercel.app/docs/clawdbot-example  
- Repo (skill + MCP + examples): https://github.com/andperez123/WakeNet  
