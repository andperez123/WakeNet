import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { feeds } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  const { id } = await params;
  const [feed] = await db.select().from(feeds).where(eq(feeds.id, id));
  if (!feed) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(feed);
}
