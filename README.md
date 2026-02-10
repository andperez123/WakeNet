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

### API (no auth in MVP)

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/feeds` | List feeds, create feed (type: `rss` \| `github_releases` \| `http_json`) |
| GET | `/api/feeds/[id]` | Get one feed |
| GET/POST | `/api/subscriptions` | List subscriptions, create (feedId, name, webhookUrl, filters) |
| GET | `/api/subscriptions/[id]/pull` | Pull-based delivery (when `pullEnabled`) |
| GET | `/api/events` | List events (?feedId=, ?limit=) |
| POST | `/api/poll/[feedId]` | Manually trigger poll for a feed |

Webhooks send `POST` with JSON body and `x-wakenet-signature` (HMAC-SHA256 of body). Inngest cron runs every 5 min to poll due feeds; register at [Inngest](https://inngest.com) and set `INNGEST_SIGNING_KEY` for production.

---

## Stack

- **Next.js 14** (App Router), **Tailwind CSS**, **TypeScript**
- Fonts: Space Grotesk, JetBrains Mono (Google Fonts at runtime)
