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

export type RunFeedPollResult =
  | { eventsFound: number; eventsNew: number; deliveriesCreated: number }
  | { error: string };

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

  const now = new Date();
  let eventsNew = 0;
  const newEvents: { eventId: string; normalized: WebhookPayload["event"] }[] = [];

  for (const raw of rawEvents) {
    const hash = contentHash(raw);
    const [existing] = await db
      .select()
      .from(events)
      .where(and(eq(events.feedId, feedId), eq(events.contentHash, hash)));
    if (existing) continue;

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

  await db
    .update(feeds)
    .set({ lastPolledAt: now, updatedAt: now })
    .where(eq(feeds.id, feedId));

  const subs = await db
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.feedId, feedId), eq(subscriptions.enabled, true)));

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

  return {
    eventsFound: rawEvents.length,
    eventsNew,
    deliveriesCreated,
  };
}

export async function getFeedsDueForPoll(): Promise<string[]> {
  if (!db) return [];
  const all = await db
    .select({ id: feeds.id, lastPolledAt: feeds.lastPolledAt, pollIntervalMinutes: feeds.pollIntervalMinutes })
    .from(feeds)
    .where(eq(feeds.enabled, true));
  const now = Date.now();
  const due = all.filter((f) => {
    const intervalMs = (f.pollIntervalMinutes ?? 15) * 60 * 1000;
    const last = f.lastPolledAt ? new Date(f.lastPolledAt).getTime() : 0;
    return now - last >= intervalMs;
  });
  return due.map((f) => f.id);
}
