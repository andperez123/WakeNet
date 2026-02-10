import { db } from "../db";
import { deliveries, subscriptions, events, digestQueue } from "../db/schema";
import { eq, and, asc, inArray } from "drizzle-orm";
import { deliverWebhook, buildPromoterPayload } from "./webhook";
import type { WebhookPayload } from "./webhook";

/** Send one queued delivery per subscription that is past its rate limit. */
export async function processQueuedDeliveries(): Promise<{ sent: number }> {
  if (!db) return { sent: 0 };
  const queued = await db
    .select()
    .from(deliveries)
    .where(eq(deliveries.status, "queued"))
    .orderBy(asc(deliveries.createdAt));
  const now = Date.now();
  let sent = 0;
  const seenSub = new Set<string>();
  for (const d of queued) {
    if (seenSub.has(d.subscriptionId)) continue;
    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, d.subscriptionId));
    if (!sub?.webhookUrl) continue;
    const rateMin = sub.deliveryRateLimitMinutes ?? 0;
    const last = sub.lastDeliveryAt ? new Date(sub.lastDeliveryAt).getTime() : 0;
    if (rateMin > 0 && now - last < rateMin * 60 * 1000) continue;
    const [ev] = await db.select().from(events).where(eq(events.id, d.eventId));
    if (!ev) continue;
    const norm = ev.normalized as WebhookPayload["event"];
    const outputFormat = sub.outputFormat ?? "default";
    const payload =
      outputFormat === "promoter"
        ? buildPromoterPayload(norm, ev.id, "feed_event")
        : ({
            id: ev.id,
            feedId: ev.feedId,
            event: norm,
            deliveredAt: new Date().toISOString(),
          } as WebhookPayload);
    const { ok, status } = await deliverWebhook(sub.webhookUrl, payload, sub.secret);
    await db
      .update(deliveries)
      .set({
        status: ok ? "sent" : "failed",
        responseCode: status,
        lastAttemptAt: new Date(),
      })
      .where(eq(deliveries.id, d.id));
    if (ok) {
      await db
        .update(subscriptions)
        .set({ lastDeliveryAt: new Date(), updatedAt: new Date() })
        .where(eq(subscriptions.id, sub.id));
      sent++;
      seenSub.add(d.subscriptionId);
    }
  }
  return { sent };
}

/** Build and send one digest per subscription with deliveryMode=daily_digest and matching schedule time (HH:MM UTC). */
export async function sendDailyDigests(utcTimeHHMM: string): Promise<{ sent: number }> {
  if (!db) return { sent: 0 };
  const subs = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.enabled, true),
        eq(subscriptions.deliveryMode, "daily_digest"),
        eq(subscriptions.digestScheduleTime, utcTimeHHMM)
      )
    );
  let sent = 0;
  for (const sub of subs) {
    if (!sub.webhookUrl) continue;
    const rows = await db
      .select({ eventId: digestQueue.eventId })
      .from(digestQueue)
      .where(eq(digestQueue.subscriptionId, sub.id))
      .orderBy(asc(digestQueue.createdAt));
    if (rows.length === 0) continue;
    const eventIds = rows.map((r) => r.eventId);
    if (eventIds.length === 0) continue;
    const eventsList = await db
      .select()
      .from(events)
      .where(inArray(events.id, eventIds));
    const eventMap = new Map(eventsList.map((e) => [e.id, e]));
    const items: unknown[] = [];
    for (const eid of eventIds) {
      const ev = eventMap.get(eid);
      if (!ev) continue;
      const norm = ev.normalized as WebhookPayload["event"];
      items.push(
        sub.outputFormat === "promoter"
          ? buildPromoterPayload(norm, ev.id, "feed_event")
          : { id: ev.id, event: norm }
      );
    }
    const payload = {
      type: "digest",
      items,
      count: items.length,
      deliveredAt: new Date().toISOString(),
    };
    const body = JSON.stringify(payload);
    const crypto = await import("crypto");
    const signature = crypto.createHmac("sha256", sub.secret).update(body).digest("hex");
    const res = await fetch(sub.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-wakenet-signature": signature,
      },
      body,
    });
    if (res.ok) {
      await db.delete(digestQueue).where(eq(digestQueue.subscriptionId, sub.id));
      sent++;
    }
  }
  return { sent };
}
