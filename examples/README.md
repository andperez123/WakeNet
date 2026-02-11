# WakeNet examples

## pull-loop.ts

Minimal reference for **pull-only** agents: poll WakeNet every N minutes, dedupe by `eventId`, process new events.

**Setup**

1. Create a pull-enabled subscription (Admin or MCP `wakenet_create_subscription` with `pullEnabled: true`).
2. Set env:
   - `WAKENET_SUBSCRIPTION_ID` — subscription UUID
   - `WAKENET_BASE_URL` — optional (default: https://wake-net.vercel.app)
   - `PULL_INTERVAL_MINUTES` — optional (default: 5)

**Run**

```bash
npx tsx examples/pull-loop.ts
```

**Behavior**

- Calls `GET /api/subscriptions/:id/pull` on an interval.
- Dedupes by `eventId` in memory (restart = rescan; for production, persist lastSeen or cursor).
- Logs each new event; replace the `console.log` with your handler (e.g. enqueue for agent, write to DB).

**Production**

- Persist `seenEventIds` or a `lastCreatedAt` cursor so restarts don’t reprocess old events if you need exactly-once handling.
- Run behind a process manager (systemd, PM2) or as a cron that calls a small script that does one pull and exits.
