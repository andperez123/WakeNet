import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: Request) {
  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  const { searchParams } = new URL(req.url);
  const feedId = searchParams.get("feedId");
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);
  const list = feedId
    ? await db
        .select()
        .from(events)
        .where(eq(events.feedId, feedId))
        .orderBy(desc(events.createdAt))
        .limit(limit)
    : await db
        .select()
        .from(events)
        .orderBy(desc(events.createdAt))
        .limit(limit);
  return NextResponse.json(list);
}
