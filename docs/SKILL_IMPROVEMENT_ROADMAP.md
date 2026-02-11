# Skill improvement roadmap

Assessment of the proposed improvements and status.

---

## Verdict: **Good path**

The review is right: the skill is currently a **guide**, not a full integration surface. The proposed target (installable by one command, MCP-first, testable, with idempotent UX and reference code) is the right direction.

---

## Priority overview

| # | Item | Impact | In-repo? | Status |
|---|------|--------|----------|--------|
| 1 | **Installable (ClawdHub)** | High | Need registry/format | Pending — depends on ClawdHub publish flow |
| 2 | **Skill self-contained** (env, recipes, payloads) | High | Yes | Partially in SKILL.md; can tighten |
| 3 | **Subscription UX** (idempotent / ensure) | High | MCP yes; API optional | MCP tool `wakenet_ensure_subscription` in progress |
| 4 | **Pull-loop helper** | Medium | Yes | `examples/pull-loop.ts` + docs |
| 5 | **Webhook verifier** (multi-runtime) | Medium | Yes | Node/Next exist; add Workers + rotation |
| 6 | **MCP as primary** | High | Yes | Skill already leads with MCP; can reinforce |
| 7 | **Smoke-test** | High | Yes | MCP tool `wakenet_smoketest` in progress |

---

## What we’re doing in-repo (no API/registry dependency)

1. **MCP: `wakenet_ensure_subscription`**  
   Find by name + feedId; create if missing, optionally update (e.g. pullEnabled). Avoids duplicate subscriptions when agents retry or user runs “setup” again.

2. **MCP: `wakenet_smoketest`**  
   One tool: create test feed → create pull subscription → poll → pull events → report OK/fail + remediation. Lets users and agents verify WakeNet + API key + MCP in one go.

3. **Skill doc upgrades**  
   - Required env: `WAKENET_URL`, `WAKENET_API_KEY`, and when to use `SUBSCRIPTION_ID` (pull).  
   - Golden-path recipes: create feed, create subscription (pull vs webhook), poll, pull — with exact payload shapes (e.g. `config.url` for RSS, `pullEnabled` top-level).  
   - Health: point to `wakenet_health` and “run smoketest.”

4. **`examples/pull-loop.ts`**  
   Minimal reference: every N minutes call `/pull`, dedupe by eventId, optional cursor/lastSeen. Document in skill + README.

5. **Webhook verifier**  
   Keep Node/Next in docs; add Cloudflare Workers snippet and a short “rotating secrets” section (create new sub → swap env → remove old sub).

6. **MCP-first in skill**  
   Lead with “wire MCP → set env → call these tools”; add a “common workflows” and “errors → fixes” subsection.

---

## What needs more than the repo

- **ClawdHub (one-command install)**  
  Depends on ClawdHub’s package format and publish process. Once known: add manifest/versioning and document `npx clawdhub install wakenet-listener` (or equivalent).

- **API idempotency / PATCH**  
  Optional. Idempotency key on `POST /api/subscriptions` or `PATCH /api/subscriptions/:id` would improve UX; the MCP `wakenet_ensure_subscription` improves behavior without API changes.

---

## Bottom line

- **Distribution:** Package for one-command install when the registry path is clear; until then, repo install + clear docs.  
- **Integration:** MCP as default; skill teaches wiring, tools, and workflows.  
- **Reliability:** Idempotent subscription (ensure) + smoketest + pull-loop example + verifier snippets.  

Implementing the in-repo items above gets you most of the way without blocking on ClawdHub or API changes.
