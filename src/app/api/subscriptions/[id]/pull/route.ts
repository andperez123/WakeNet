import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deliveries, events, subscriptions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  _req: Request,
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
  const pending = await db
    .select({
      deliveryId: deliveries.id,
      eventId: events.id,
      normalized: events.normalized,
      createdAt: events.createdAt,
    })
    .from(deliveries)
    .innerJoin(events, eq(deliveries.eventId, events.id))
    .where(
      and(
        eq(deliveries.subscriptionId, subscriptionId),
        eq(deliveries.status, "sent")
      )
    )
    .limit(50);
  return NextResponse.json(
    pending.map(({ deliveryId, eventId, normalized, createdAt }) => ({
      deliveryId,
      eventId,
      event: normalized,
      createdAt,
    }))
  );
}
