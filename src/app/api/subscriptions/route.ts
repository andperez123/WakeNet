import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { subscriptionFiltersSchema } from "@/lib/types";
import { z } from "zod";
import { randomBytes } from "crypto";

const createBodySchema = z.object({
  feedId: z.string().uuid(),
  name: z.string().min(1),
  webhookUrl: z.string().url().optional(),
  pullEnabled: z.boolean().optional(),
  filters: subscriptionFiltersSchema.optional(),
});

export async function GET() {
  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  const list = await db.select().from(subscriptions).orderBy(subscriptions.createdAt);
  return NextResponse.json(list);
}

export async function POST(req: Request) {
  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  const body = await req.json();
  const parsed = createBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const secret = randomBytes(32).toString("hex");
  const [sub] = await db
    .insert(subscriptions)
    .values({
      feedId: parsed.data.feedId,
      name: parsed.data.name,
      webhookUrl: parsed.data.webhookUrl ?? null,
      pullEnabled: parsed.data.pullEnabled ?? false,
      filters: (parsed.data.filters as Record<string, unknown>) ?? null,
      secret,
    })
    .returning();
  return NextResponse.json({ ...sub, secret }); // return secret only on create
}
