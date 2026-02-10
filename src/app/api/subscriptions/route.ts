import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { subscriptionFiltersSchema } from "@/lib/types";
import { requireApiKey } from "@/lib/auth";
import { z } from "zod";
import { randomBytes } from "crypto";

const createBodySchema = z.object({
  feedId: z.string().uuid(),
  name: z.string().min(1),
  webhookUrl: z.string().url().optional(),
  pullEnabled: z.boolean().optional(),
  filters: subscriptionFiltersSchema.optional(),
  outputFormat: z.enum(["default", "promoter"]).optional(),
  deliveryRateLimitMinutes: z.number().int().min(0).max(1440).optional(),
  deliveryMode: z.enum(["immediate", "daily_digest"]).optional(),
  digestScheduleTime: z.string().regex(/^\d{1,2}:\d{2}$/).optional(), // e.g. "09:00" UTC (stored normalized)
});
function normalizeHHMM(s: string): string {
  const [h, m] = s.split(":");
  return `${h!.padStart(2, "0")}:${m!.padStart(2, "0")}`;
}

export async function GET() {
  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  const list = await db.select().from(subscriptions).orderBy(subscriptions.createdAt);
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
      outputFormat: parsed.data.outputFormat ?? "default",
      deliveryRateLimitMinutes: parsed.data.deliveryRateLimitMinutes ?? null,
      deliveryMode: parsed.data.deliveryMode ?? "immediate",
      digestScheduleTime: parsed.data.digestScheduleTime ? normalizeHHMM(parsed.data.digestScheduleTime) : null,
    })
    .returning();
  return NextResponse.json({ ...sub, secret }); // return secret only on create
}
