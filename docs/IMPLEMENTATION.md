# WakeNet MVP — Implementation Roadmap

This doc maps the PMP deliverables to concrete build steps and suggested tech stack. Use it as the dev execution plan.

---

## Tech Stack Recommendation

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **App** | Next.js 14 (existing) | Keep landing + add API routes + minimal admin UI in one deploy |
| **Language** | TypeScript | Same as landing page, type-safe APIs and workers |
| **DB** | PostgreSQL | Feeds, subscriptions, events, deliveries; good for relational + JSON |
| **Cache / queue** | Redis + BullMQ (or Inngest) | Scheduling polls, dedupe cache, webhook retry queue |
| **Host** | Vercel (front + API) + separate worker | Or Fly.io / Render for app+worker+Redis; Vercel for front, external for workers |
| **Auth** | API keys + HMAC for webhooks | No user auth in MVP; keys per subscription |

**Alternative:** Pure Node.js API + separate React admin (if you want to split landing from app later). For 30-day MVP, monorepo Next.js + background jobs is fastest.

---

## Repo Structure (Proposed)

```
WakeNet/
├── src/
│   ├── app/                    # Next.js App Router (existing)
│   │   ├── page.tsx            # Landing (keep)
│   │   ├── (admin)/            # Admin UI routes
│   │   │   ├── feeds/
│   │   │   ├── subscriptions/
│   │   │   └── events/
│   │   └── api/                # API routes
│   │       ├── feeds/
│   │       ├── subscriptions/
│   │       ├── webhooks/       # Inbound from WakeNet → customer
│   │       └── pull/          # Pull-based delivery
│   ├── lib/                    # Shared logic
│   │   ├── db/                 # Postgres client, migrations
│   │   ├── ingestion/          # RSS, GitHub, HTTP pollers
│   │   ├── processing/        # Normalize, dedupe, filter
│   │   ├── delivery/          # Webhook + pull, HMAC
│   │   └── queue/              # Job definitions (BullMQ/Inngest)
│   └── workers/               # Poll cron + delivery jobs (or serverless cron)
├── docs/
│   ├── PROJECT_PLAN.md         # PMP (this plan)
│   └── IMPLEMENTATION.md       # This file
├── scripts/                    # Migrations, seed
└── clawdbot-example/           # Example skill (optional subfolder or separate repo)
```

---

## Build Order (Phases → Tasks)

### Phase 1 — Planning (Days 1–2) ✓
- [x] PMP and implementation roadmap in repo
- [ ] Lock stack: confirm Node/TS + Postgres + Redis + host
- [ ] Finalize data model (tables below) and API contract (OpenAPI sketch)

### Phase 2 — Core (Days 3–12)

**2.1 Persistence**
- [ ] Postgres setup (local + hosted: Neon / Supabase / Railway)
- [ ] Migrations: `feeds`, `subscriptions`, `events`, `deliveries`
- [ ] Optional: Redis for dedupe cache + job queue

**2.2 Ingestion**
- [ ] RSS/Atom poller (fetch, parse, emit raw items)
- [ ] GitHub Releases poller (API, map to same raw shape)
- [ ] HTTP JSON poller (configurable URL + path to array)
- [ ] Poll scheduler: recurring jobs per feed (cron or BullMQ repeat)

**2.3 Event processing**
- [ ] Normalization: one canonical event schema (id, source, title, link, published, body, metadata)
- [ ] Deduplication: content hash + TTL (e.g. 24h), skip if seen
- [ ] Keyword filters (include/exclude) per subscription
- [ ] Priority scoring (rule-based, e.g. keyword match = higher score)

### Phase 3 — Delivery (Days 13–18)
- [ ] Webhook delivery: POST to subscription URL with signed payload, retries with backoff
- [ ] Pull endpoint: GET queue for a subscription (optional fallback)
- [ ] HMAC signing (payload + secret), verification doc for Clawdbot
- [ ] Delivery logging (status, response code, retries)

### Phase 4 — Integration (Days 19–22)
- [ ] Clawdbot example skill: `wakenet_listener` (receive webhook, verify HMAC, route to agent)
- [ ] Demo workflow: one feed → WakeNet → Clawdbot → action
- [ ] E2E test: create feed → create subscription → trigger poll → event delivered

### Phase 5 — UI & Docs (Days 23–27)
- [ ] Admin UI: feed CRUD, subscription CRUD, event log viewer, enable/disable toggles
- [ ] OpenAPI spec for public API
- [ ] Integration guide + cost/token savings explanation

### Phase 6 — Validation (Days 28–30)
- [ ] Load test: many feeds, many events, confirm dedupe and delivery
- [ ] Token savings demo vs polling baseline
- [ ] Cost check: infra < $150/month

---

## Data Model (Draft)

**feeds**  
- id, type (rss | github_releases | http_json), config (JSON), poll_interval_min, enabled, created_at, updated_at  

**subscriptions**  
- id, feed_id, name, webhook_url, pull_enabled, filters (keywords JSON), secret (HMAC), enabled, created_at  

**events**  
- id, feed_id, external_id, content_hash, normalized (JSON), score, created_at  
- Unique on (feed_id, content_hash) or similar for dedupe  

**deliveries**  
- id, subscription_id, event_id, status (pending | sent | failed), response_code, retries, last_attempt_at, created_at  

---

## Next Step

1. **Confirm stack** (Node/TS + Postgres + Redis + Vercel vs Fly/Render).  
2. **Start Phase 2.1**: add DB dependency, create first migration and `feeds` + `subscriptions` tables.  
3. Then implement ingestion (2.2) and processing (2.3) in order.

Once you confirm the stack and where you want to host (Vercel + external worker vs all-in-one), we can generate the initial migration and API route stubs.
