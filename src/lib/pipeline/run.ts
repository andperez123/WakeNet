import { db } from "../db";
import { feeds, events, subscriptions, deliveries, digestQueue } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { pollFeed } from "../ingestion";
import { contentHash, matchesFilters, promoScoreEvent } from "../processing";
import {
  deliverWebhook,
  buildPromoterPayload,
  type WebhookPayload,
} from "../delivery";
import type { FeedType, FeedConfig, SubscriptionFilters } from "../types";
import type { NormalizedEvent } from "../types";
import type { Feed } from "../db/schema";

export type RunFeedPollResult =
  | { eventsFound: number; eventsNew: number; deliveriesCreated: number }
  | { error: string };

/** Process raw events into DB and create deliveries. Used by poll and webhook ingest. */
export async function processRawEvents(
  feed: Feed,
  rawEvents: NormalizedEvent[]
): Promise<{ eventsNew: number; deliveriesCreated: number }> {
  const feedId = feed.id;
  let eventsNew = 0;
  const newEvents: { eventId: string; normalized: WebhookPayload["event"] }[] = [];

  for (const raw of rawEvents) {
    // Idempotency: same event id for this feed => skip (avoids duplicate deliveries when producer retries)
    const [existingByExternalId] = await db
      .select()
      .from(events)
      .where(and(eq(events.feedId, feedId), eq(events.externalId, raw.id)));
    if (existingByExternalId) continue;

    const hash = contentHash(raw);
    const [existingByHash] = await db
      .select()
      .from(events)
      .where(and(eq(events.feedId, feedId), eq(events.contentHash, hash)));
    if (existingByHash) continue;

    const [inserted] = await db
      .insert(events)
      .values({
        feedId,
        externalId: raw.id,
        contentHash: hash,
        normalized: raw,
        score: 0,
      })
      .returning({ id: events.id });
    if (inserted) {
      eventsNew++;
      newEvents.push({
        eventId: inserted.id,
        normalized: {
          id: raw.id,
          source: raw.source,
          title: raw.title,
          link: raw.link,
          published: raw.published,
          body: raw.body,
          metadata: raw.metadata,
        },
      });
    }
  }

  const subs = await db
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.feedId, feedId), eq(subscriptions.enabled, true)));

  const now = new Date();
  let deliveriesCreated = 0;
  const nowMs = now.getTime();
  const subLastDelivery = new Map<string, number>();
  for (const sub of subs) {
    if (!sub.webhookUrl && !sub.pullEnabled) continue;
    const filters = (sub.filters as SubscriptionFilters | null) ?? undefined;
    const minScore = filters?.minScore ?? 0;
    const outputFormat = sub.outputFormat ?? "default";
    const deliveryMode = sub.deliveryMode ?? "immediate";
    const rateLimitMin = sub.deliveryRateLimitMinutes ?? 0;
    const lastDeliveryAt =
      subLastDelivery.get(sub.id) ??
      (sub.lastDeliveryAt ? new Date(sub.lastDeliveryAt).getTime() : 0);
    const rateLimitOk = rateLimitMin === 0 || nowMs - lastDeliveryAt >= rateLimitMin * 60 * 1000;

    for (const { eventId, normalized } of newEvents) {
      if (!matchesFilters(normalized, filters)) continue;
      const score = promoScoreEvent(normalized, filters);
      if (score < minScore) continue;

      if (deliveryMode === "daily_digest") {
        await db.insert(digestQueue).values({ subscriptionId: sub.id, eventId });
        deliveriesCreated++;
        continue;
      }

      // Pull-only subscriptions: create delivery record as "sent" (available via pull endpoint)
      if (!sub.webhookUrl && sub.pullEnabled) {
        await db.insert(deliveries).values({
          subscriptionId: sub.id,
          eventId,
          status: "sent",
          retries: 0,
        });
        deliveriesCreated++;
        continue;
      }

      const [del] = await db
        .insert(deliveries)
        .values({
          subscriptionId: sub.id,
          eventId,
          status: rateLimitOk ? "pending" : "queued",
          retries: 0,
        })
        .returning({ id: deliveries.id });
      if (!del) continue;
      deliveriesCreated++;

      if (!rateLimitOk) continue;

      const payload =
        outputFormat === "promoter"
          ? buildPromoterPayload(normalized, eventId, "feed_event")
          : ({
              id: eventId,
              feedId,
              event: normalized,
              deliveredAt: new Date().toISOString(),
            } as WebhookPayload);
      const { ok, status } = await deliverWebhook(sub.webhookUrl!, payload, sub.secret);
      await db
        .update(deliveries)
        .set({
          status: ok ? "sent" : "failed",
          responseCode: status,
          lastAttemptAt: new Date(),
        })
        .where(eq(deliveries.id, del.id));
      if (ok) {
        subLastDelivery.set(sub.id, nowMs);
        await db
          .update(subscriptions)
          .set({ lastDeliveryAt: new Date(), updatedAt: new Date() })
          .where(eq(subscriptions.id, sub.id));
      }
    }
  }

  return { eventsNew, deliveriesCreated };
}

export async function runFeedPoll(feedId: string): Promise<RunFeedPollResult> {
  if (!db) return { error: "Database not configured" };
  const [feed] = await db
    .select()
    .from(feeds)
    .where(and(eq(feeds.id, feedId), eq(feeds.enabled, true)));
  if (!feed) return { error: "Feed not found or disabled" };

  const config = feed.config as FeedConfig;
  const type = feed.type as FeedType;
  const rawEvents = await pollFeed(type, config);

  const { eventsNew, deliveriesCreated } = await processRawEvents(feed, rawEvents);

  const now = new Date();
  await db
    .update(feeds)
    .set({ lastPolledAt: now, updatedAt: now })
    .where(eq(feeds.id, feedId));

  return {
    eventsFound: rawEvents.length,
    eventsNew,
    deliveriesCreated,
  };
}

const POLLABLE_TYPES = ["rss", "github_releases", "http_json", "github_commits", "github_pull_requests", "sitemap", "html_change"];

export async function getFeedsDueForPoll(): Promise<string[]> {
  if (!db) return [];
  const all = await db
    .select({ id: feeds.id, type: feeds.type, lastPolledAt: feeds.lastPolledAt, pollIntervalMinutes: feeds.pollIntervalMinutes })
    .from(feeds)
    .where(eq(feeds.enabled, true));
  const now = Date.now();
  const due = all.filter((f) => {
    if (!POLLABLE_TYPES.includes(f.type)) return false; // e.g. webhook_inbox has no polling
    const intervalMs = (f.pollIntervalMinutes ?? 15) * 60 * 1000;
    const last = f.lastPolledAt ? new Date(f.lastPolledAt).getTime() : 0;
    return now - last >= intervalMs;
  });
  return due.map((f) => f.id);
}
