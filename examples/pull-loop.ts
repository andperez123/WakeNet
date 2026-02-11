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

let nextCursor: string | null = null;

async function pull(): Promise<void> {
  if (!SUB_ID) {
    console.error("WAKENET_SUBSCRIPTION_ID is not set");
    return;
  }
  const url = nextCursor
    ? `${WAKENET_BASE_URL}/api/subscriptions/${SUB_ID}/pull?after=${encodeURIComponent(nextCursor)}`
    : `${WAKENET_BASE_URL}/api/subscriptions/${SUB_ID}/pull`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error("Pull failed:", res.status, await res.text());
    return;
  }
  const body = (await res.json()) as { items: { eventId?: string; deliveryId?: string; event?: unknown; createdAt?: string }[]; nextCursor: string | null };
  const items = body.items ?? [];
  for (const item of items) {
    // Handle the event (e.g. trigger agent, append to queue)
    console.log(JSON.stringify({ eventId: item.eventId ?? item.deliveryId, event: item.event, createdAt: item.createdAt }));
  }
  if (body.nextCursor) nextCursor = body.nextCursor;
}

async function loop(): Promise<void> {
  await pull();
  setTimeout(loop, INTERVAL_MIN * 60 * 1000);
}

loop().catch((e) => {
  console.error(e);
  process.exit(1);
});
