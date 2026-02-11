import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deliveries, events, subscriptions } from "@/lib/db/schema";
import { eq, and, gt, asc } from "drizzle-orm";

/**
 * Pull delivered events for a pull-enabled subscription.
 * Optional ?after=<ISO timestamp>: return only deliveries with createdAt > after (consume-once cursor).
 * Response includes nextCursor: pass it as ?after= on the next request to get only new events.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  const { id: subscriptionId } = await params;
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.id, subscriptionId));
  if (!sub?.pullEnabled) {
    return NextResponse.json({ error: "Subscription not found or pull not enabled" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const afterParam = searchParams.get("after"); // ISO timestamp cursor
  const afterDate = afterParam ? new Date(afterParam) : null;
  if (afterParam && isNaN(afterDate!.getTime())) {
    return NextResponse.json({ error: "Invalid after cursor (use ISO timestamp)" }, { status: 400 });
  }

  const conditions = [
    eq(deliveries.subscriptionId, subscriptionId),
    eq(deliveries.status, "sent"),
  ];
  if (afterDate) {
    conditions.push(gt(deliveries.createdAt, afterDate));
  }

  const pending = await db
    .select({
      deliveryId: deliveries.id,
      eventId: events.id,
      normalized: events.normalized,
      createdAt: deliveries.createdAt,
    })
    .from(deliveries)
    .innerJoin(events, eq(deliveries.eventId, events.id))
    .where(and(...conditions))
    .orderBy(asc(deliveries.createdAt))
    .limit(50);

  const items = pending.map(({ deliveryId, eventId, normalized, createdAt }) => ({
    deliveryId,
    eventId,
    event: normalized,
    createdAt,
  }));

  const lastCreatedAt = items.length > 0 ? items[items.length - 1].createdAt : null;
  const nextCursor = lastCreatedAt ? new Date(lastCreatedAt).toISOString() : null;

  return NextResponse.json({ items, nextCursor });
}
