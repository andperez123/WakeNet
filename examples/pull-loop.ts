#!/usr/bin/env npx tsx
/**
 * Minimal pull-loop example for WakeNet.
 *
 * Use when your agent has a pull-enabled subscription and no webhook.
 * Runs every N minutes, calls /pull, dedupes by eventId, and invokes a handler.
 *
 * Env:
 *   WAKENET_BASE_URL     — Base URL (default: https://wake-net.vercel.app)
 *   WAKENET_SUBSCRIPTION_ID — Pull-enabled subscription UUID
 *   PULL_INTERVAL_MINUTES — Minutes between pulls (default: 5)
 *
 * Run: npx tsx examples/pull-loop.ts
 */

const WAKENET_BASE_URL = (process.env.WAKENET_BASE_URL || "https://wake-net.vercel.app").replace(
  /\/$/,
  ""
);
const SUB_ID = process.env.WAKENET_SUBSCRIPTION_ID;
const INTERVAL_MIN = Number(process.env.PULL_INTERVAL_MINUTES) || 5;

const seenEventIds = new Set<string>();

async function pull(): Promise<void> {
  if (!SUB_ID) {
    console.error("WAKENET_SUBSCRIPTION_ID is not set");
    return;
  }
  const res = await fetch(`${WAKENET_BASE_URL}/api/subscriptions/${SUB_ID}/pull`);
  if (!res.ok) {
    console.error("Pull failed:", res.status, await res.text());
    return;
  }
  const items = (await res.json()) as { eventId?: string; deliveryId?: string; event?: unknown; createdAt?: string }[];
  for (const item of items) {
    const id = item.eventId ?? item.deliveryId ?? JSON.stringify(item);
    if (seenEventIds.has(id)) continue;
    seenEventIds.add(id);
    // Handle the event (e.g. trigger agent, append to queue)
    console.log(JSON.stringify({ eventId: id, event: item.event, createdAt: item.createdAt }));
  }
}

async function loop(): Promise<void> {
  await pull();
  setTimeout(loop, INTERVAL_MIN * 60 * 1000);
}

loop().catch((e) => {
  console.error(e);
  process.exit(1);
});
