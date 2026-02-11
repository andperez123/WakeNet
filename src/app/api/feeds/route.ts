import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
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
  // webhook_inbox: enforce unique token/secret so ingest route resolves to a single feed
  if (parsed.data.type === "webhook_inbox") {
    const cfg = parsed.data.config as { token?: string; secret?: string };
    const token = cfg.token ?? cfg.secret;
    if (token) {
      const existing = await db.select().from(feeds).where(eq(feeds.type, "webhook_inbox"));
      const conflict = existing.some((f) => {
        const c = f.config as { token?: string; secret?: string };
        return c.token === token || c.secret === token;
      });
      if (conflict) {
        return NextResponse.json({ error: "A webhook_inbox feed with this token or secret already exists" }, { status: 409 });
      }
    }
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
