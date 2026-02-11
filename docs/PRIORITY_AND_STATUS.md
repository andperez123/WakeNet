# WakeNet: complete review and priority list

Where things stand and what needs to get done, in order.

---

## 1. Where you’re at (review)

### Live and working

| Area | Status | Notes |
|------|--------|--------|
| **WakeNet app** | ✅ Live | https://wake-net.vercel.app — feeds, subscriptions, events, webhooks, promoter, pull |
| **Inngest** | ✅ Connected | Poll every 5 min, queued delivery every 2 min, daily digest |
| **Admin** | ✅ Live | `/admin` — create feeds/subscriptions, poll, view events (optional ADMIN_SECRET) |
| **API key** | ✅ Optional | `WAKENET_API_KEY` locks POSTs; GETs open; admin cookie bypass |
| **Pull endpoint** | ✅ Working | `GET /api/subscriptions/:id/pull` — returns “sent” deliveries; client dedupes (e.g. pull-loop) |
| **MCP server** | ✅ In repo | 10 tools: health, smoketest, list/create feed, list/create/ensure subscription, list events, poll, pull |
| **Skill** | ✅ In repo | `skill/wakenet-listener/` — SKILL.md + action.json; Clawdbot loads it |

### Done in repo (consistency and packaging)

| Item | Status |
|------|--------|
| **Canonical env** | ✅ `WAKENET_BASE_URL`, `WAKENET_API_KEY`, `WAKENET_SUBSCRIPTION_ID`, `WAKENET_SUBSCRIPTION_SECRET` everywhere (no WAKENET_URL) |
| **Golden-path payloads** | ✅ Feed `config.url`; subscription `name` + top-level `pullEnabled`; docs and skill match |
| **Smoketest** | ✅ Pass = health + create feed + create sub + poll OK + pull valid JSON ([] OK); no-events = warning |
| **ensure_subscription** | ✅ Uniqueness = feedId + name; multiple matches → return newest + warn |
| **Packaging checklist** | ✅ docs/SKILL_PACKAGING_CHECKLIST.md |
| **Webhook snippets** | ✅ Node, Next.js, Cloudflare Workers in skill; rotation note |
| **Clawdbot setup** | ✅ docs/CLAWDBOT_SETUP.md — step-by-step install, env, MCP, feed/sub, webhook vs pull, verify |

### Not done (optional / future)

| Area | Status |
|------|--------|
| **Pull “consume once”** | ❌ `/pull` returns same deliveries every time; no server-side cursor/ack; clients dedupe (e.g. pull-loop) |
| **Subscription API** | ❌ No PATCH `/api/subscriptions/:id`; no idempotency key on POST; MCP `wakenet_ensure_subscription` avoids duplicates on the agent side |
| **ClawdHub** | ❌ One-command install not set up; depends on ClawdHub package format |
| **Webhook helpers** | ✅ Snippets only (no new code); pull-only users don’t need them |

---

## 2. Priority list (what needs to get done)

Ordered by impact and dependency. Nothing here is blocking “set up my Clawdbot” — that path is done.

### P0 — Nothing blocking

- **Clawdbot setup:** You can install the skill, set env, add MCP, create feed/sub (Admin or MCP), and receive events (webhook or pull) using docs/CLAWDBOT_SETUP.md. No P0 work required.

---

### P1 — WakeNet-side improvements (optional, cleaner/better)

1. **Server-side cursor/ack for pull (“consume once”)**  
   - **What:** So `/pull` is “consume once” without client dedupe (e.g. return only deliveries not yet “acked”, then support `POST /api/subscriptions/:id/pull/ack` with deliveryIds, or cursor-based `?since= cursor`).  
   - **Why:** Cleaner for clients; optional — current pull-loop + client dedupe works.  
   - **Effort:** Medium (schema/API change + migration).

2. **Idempotency / PATCH for subscriptions**  
   - **What:** Either idempotency key on `POST /api/subscriptions` (e.g. `Idempotency-Key: name+feedId`) or `PATCH /api/subscriptions/:id` to update (e.g. `pullEnabled`, `webhookUrl`) without creating new records.  
   - **Why:** Prevents duplicates and allows toggling pull/webhook without new subs; agent-side `wakenet_ensure_subscription` already reduces duplicates.  
   - **Effort:** Small (PATCH) to medium (idempotency key + store).

---

### P2 — Distribution

3. **ClawdHub one-command install**  
   - **What:** Package skill for ClawdHub so `npx clawdhub install wakenet-listener` (or equivalent) works.  
   - **Why:** Better distribution for other Clawdbots.  
   - **Effort:** Depends on ClawdHub format; likely small once format is known.

---

### P3 — Nice-to-have

4. **Webhook signing/verification helpers (docs/snippets only)**  
   - **What:** Any extra runtimes (e.g. Python, Deno) or a single “verification only” doc that links to Node/Next/Workers.  
   - **Why:** Helpful for webhook users; not required if using pull.  
   - **Effort:** Small.

---

## 3. Summary table

| Priority | Item | Blocking? | Effort |
|----------|------|-----------|--------|
| — | Clawdbot setup (skill, env, MCP, feed/sub, webhook or pull) | No — done | — |
| P1 | Pull: server-side cursor/ack (“consume once”) | No | Medium |
| P1 | Subscriptions: idempotency key or PATCH | No | Small–Medium |
| P2 | ClawdHub one-command install | No | Small (once format known) |
| P3 | Extra webhook verification snippets/docs | No | Small |

**Bottom line:** You’re in good shape for your Clawdbot and for other agents using the repo. Remaining work is optional polish (pull consume-once, subscription PATCH/idempotency), distribution (ClawdHub), and optional docs (more webhook snippets).

---

## 4. Priority for agent adoption at scale

**Goal:** Get many agents using WakeNet and test the market — minimize friction so another agent can install, run, and succeed quickly.

This order optimizes for **adoption and first-run success**, not just “nice to have.”

### P1 — Distribution (so agents can install in one step)

| # | Item | Why it matters at scale |
|---|------|--------------------------|
| 1 | **ClawdHub one-command install** | Today: clone repo, copy skill, wire MCP. Friction = fewer installs. One command (`npx clawdhub install wakenet-listener` or equivalent) = more agents try it. **Do this first.** |

*Blocker:* Need ClawdHub package format / publish flow. Once known, effort is small.

---

### P2 — “It just works” (so agents don’t fail or get confused)

| # | Item | Why it matters at scale |
|---|------|--------------------------|
| 2 | **Pull “consume once” (cursor/ack)** | Right now pull returns the same deliveries every time; clients must dedupe. At scale, many agents will get duplicate events or wrong mental model. Server-side “only unseen” (cursor or ack) = one clear contract, less client code, fewer support issues. |
| 3 | **Subscription idempotency or PATCH** | Retries and “setup again” create duplicate subscriptions. PATCH or idempotency key = one sub per (feed + name), ability to toggle pull/webhook without new records. Fewer duplicates, cleaner UX at scale. |

---

### P3 — Discovery and trust (so agents find and believe it)

| # | Item | Why it matters at scale |
|---|------|--------------------------|
| 4 | **Single “Integrate your agent” entry point** | One URL (e.g. `/docs/integrate` or `/for-agents`) that is the canonical “how another agent uses WakeNet”: install → env → MCP → feed/sub → webhook or pull → verify. Link this everywhere (landing, skill, README). You have the content (CLAWDBOT_SETUP); make it the default shareable page. |
| 5 | **Landing + docs CTAs** | Ensure “View Docs” / “See Clawdbot Example” point to the integrate page or a clear path so new visitors become integrators. |

---

### P4 — Scale and safety (when many agents are on one instance)

| # | Item | Why it matters at scale |
|---|------|--------------------------|
| 6 | **Per-agent or per-org API keys (optional)** | Right now one shared `WAKENET_API_KEY` or open. At scale you may want: each agent/team gets a key, optional isolation (e.g. only see own feeds/subs). Reduces abuse and supports “many agents, one WakeNet” cleanly. |
| 7 | **Rate limits or quotas (optional)** | Protect the shared instance from one noisy agent; document limits so agents know the rules. |

---

### P5 — Nice-to-have

| # | Item |
|---|------|
| 8 | Extra webhook verification snippets (Python, Deno) for webhook users. |

---

## 5. Summary: priority for adoption at scale

| Order | Item | Goal |
|-------|------|------|
| **1** | ClawdHub one-command install | Get installs (lower friction) |
| **2** | Pull consume-once (cursor/ack) | “It just works” for pull users |
| **3** | Subscription PATCH / idempotency | Fewer duplicates, toggle pull/webhook |
| **4** | Single “integrate your agent” page + CTAs | Discovery and one place to send people |
| **5** | Per-agent API keys / isolation (optional) | Safe multi-tenant when you have many agents |
| **6** | Rate limits / quotas (optional) | Protect shared instance |
| **7** | Extra webhook snippets | Nice-to-have for webhook users |

**Bottom line for scale:** Ship **distribution (ClawdHub)** first so agents can install in one step. Then make **pull and subscriptions** robust so first-run success is high. Then make **discovery** obvious (one integrate page, clear CTAs). Add **per-agent keys and limits** when you’re ready to support many agents on one instance.
