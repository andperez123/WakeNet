import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { feeds } from "@/lib/db/schema";
import { feedTypeSchema, feedConfigSchema } from "@/lib/types";
import { requireApiKey } from "@/lib/auth";
import { z } from "zod";

const createBodySchema = z.object({
  type: feedTypeSchema,
  config: feedConfigSchema,
  pollIntervalMinutes: z.number().int().min(1).max(1440).optional(),
});

export async function GET() {
  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  const list = await db.select().from(feeds).orderBy(feeds.createdAt);
  return NextResponse.json(list);
}

export async function POST(req: Request) {
  const authError = requireApiKey(req);
  if (authError) return authError;
  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  const body = await req.json();
  const parsed = createBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const [feed] = await db
    .insert(feeds)
    .values({
      type: parsed.data.type,
      config: parsed.data.config as Record<string, unknown>,
      pollIntervalMinutes: parsed.data.pollIntervalMinutes ?? 15,
    })
    .returning();
  return NextResponse.json(feed);
}
