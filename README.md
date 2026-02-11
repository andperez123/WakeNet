# WakeNet

Event-driven wake infrastructure for AI agents. This repo has the **landing page** (live on Vercel) and will host the **MVP** as we build it.

## Deploy to Vercel (landing page live in ~2 min)

**Option A — Push to GitHub, then Vercel**

1. Create a new repo on GitHub (e.g. `wakenet`).
2. In this folder:
   ```bash
   git init
   git add .
   git commit -m "Landing page ready for Vercel"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/wakenet.git
   git push -u origin main
   ```
3. Go to [vercel.com](https://vercel.com) → **Add New Project** → Import your GitHub repo.
4. Leave defaults (Framework: Next.js, Root: `.`) → **Deploy**. Done.

**Option B — Vercel CLI**

```bash
npm i -g vercel
vercel
```

Follow prompts (link to existing project or create new). Then `vercel --prod` to go live.

---

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
npm start
```

## MVP (in progress)

Execution plan and PMP are in `docs/`:

- **[docs/PROJECT_PLAN.md](docs/PROJECT_PLAN.md)** — Scope, schedule, success criteria, risks
- **[docs/IMPLEMENTATION.md](docs/IMPLEMENTATION.md)** — Tech stack, repo structure, build order

### Quick start (API + DB)

1. Copy `.env.example` to `.env` and set `DATABASE_URL` (e.g. [Neon](https://neon.tech) Postgres).
2. Run migrations: `npm run db:migrate:run`
3. Start dev: `npm run dev`

### API

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/feeds` | — | List all feeds |
| POST | `/api/feeds` | Key | Create feed (type: `rss` \| `github_releases` \| `http_json`) |
| GET | `/api/feeds/[id]` | — | Get one feed |
| GET | `/api/subscriptions` | — | List subscriptions |
| POST | `/api/subscriptions` | Key | Create subscription (feedId, name, webhookUrl, filters) |
| GET | `/api/subscriptions/[id]/pull` | — | Pull events (when `pullEnabled`) |
| GET | `/api/events` | — | List events (?feedId=, ?limit=) |
| POST | `/api/poll/[feedId]` | Key | Trigger poll for a feed |
| GET | `/api/health` | — | Health check (`{ ok, db }`) |

**Auth:** If `WAKENET_API_KEY` is set, POST endpoints require `Authorization: Bearer <key>`. GET endpoints stay open. Admin UI users (with `wakenet_admin` cookie) bypass the key.

Webhooks send `POST` with JSON body and `x-wakenet-signature` (HMAC-SHA256 of body).

**Admin UI:** `/admin` — dashboard, feeds, subscriptions, events. Optional `ADMIN_SECRET` env var gates access.

**Inngest:** [docs/SETUP.md](docs/SETUP.md) — cron-based polling every 5 min, queued delivery every 2 min, daily digest every hour.

### MCP server (for agents)

Any MCP-aware agent (Claude, Cursor, OpenClaw) can use WakeNet directly:

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

Tools: `wakenet_list_feeds`, `wakenet_create_feed`, `wakenet_create_subscription`, `wakenet_list_events`, `wakenet_poll_feed`, `wakenet_pull_events`, `wakenet_health`. See [mcp-server/README.md](mcp-server/README.md).

### Clawdbot skill

[skill/wakenet-listener](skill/wakenet-listener/) — AgentSkills-compatible skill. Copy into `~/.openclaw/skills/` or your workspace `skills/`. See [skill/README.md](skill/README.md).

---

## Stack

- **Next.js 14** (App Router), **Tailwind CSS**, **TypeScript**
- Fonts: Space Grotesk, JetBrains Mono (Google Fonts at runtime)
