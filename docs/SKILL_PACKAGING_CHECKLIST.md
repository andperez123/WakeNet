# Skill packaging quality gates (before ClawdHub)

Run this checklist so other agents don’t install broken docs or mismatched tooling.

## 1. Manifest and instructions

- [ ] **action.json present** in `skill/wakenet-listener/`
- [ ] **SKILL.md referenced correctly** — `action.json` has `"instructionsFile": "SKILL.md"` and that file exists in the same directory
- [ ] **action.json** has `name`, `description`, `version`

## 2. Env and payload consistency (single source of truth)

- [ ] **Canonical env** documented only: `WAKENET_BASE_URL`, `WAKENET_API_KEY`, `WAKENET_SUBSCRIPTION_ID`, `WAKENET_SUBSCRIPTION_SECRET` (no `WAKENET_URL` alongside)
- [ ] **MCP server** reads `WAKENET_BASE_URL` (and `WAKENET_API_KEY`)
- [ ] **Examples** use `WAKENET_BASE_URL` and `WAKENET_SUBSCRIPTION_ID`
- [ ] **Subscription payload**: `pullEnabled` and `name` are top-level in all docs; feed uses `config.url` for RSS

## 3. Examples

- [ ] **examples/pull-loop.ts** runs with: `npx tsx examples/pull-loop.ts` (and README documents env)
- [ ] No references to `config.pullEnabled`; only top-level `pullEnabled`

## 4. MCP tool list vs server code

- [ ] **MCP server** exports exactly the tools listed in SKILL.md and mcp-server/README.md:
  - wakenet_health
  - wakenet_smoketest
  - wakenet_list_feeds
  - wakenet_create_feed
  - wakenet_list_subscriptions
  - wakenet_create_subscription
  - wakenet_ensure_subscription
  - wakenet_list_events
  - wakenet_poll_feed
  - wakenet_pull_events

## 5. Smoketest behavior

- [ ] **wakenet_smoketest** pass criteria: health OK, create feed OK, create subscription OK, poll returns OK, pull returns valid JSON (even `[]`). “No events yet” is a warning, not a failure.

## 6. ensure_subscription uniqueness

- [ ] **wakenet_ensure_subscription** defines uniqueness as `feedId + name`; if multiple matches, return newest and warn.

---

After all items pass, the skill is ready for one-command install (ClawdHub) and safe for other agents to consume.
