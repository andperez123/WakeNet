import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { subscriptionFiltersSchema } from "@/lib/types";
import { requireApiKey } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { z } from "zod";

const patchBodySchema = z.object({
  name: z.string().min(1).optional(),
  webhookUrl: z.string().url().nullable().optional(),
  pullEnabled: z.boolean().optional(),
  enabled: z.boolean().optional(),
  filters: subscriptionFiltersSchema.nullable().optional(),
  outputFormat: z.enum(["default", "promoter"]).optional(),
  deliveryRateLimitMinutes: z.number().int().min(0).max(1440).nullable().optional(),
  deliveryMode: z.enum(["immediate", "daily_digest"]).optional(),
  digestScheduleTime: z.string().regex(/^\d{1,2}:\d{2}$/).nullable().optional(),
});

function normalizeHHMM(s: string): string {
  const [h, m] = s.split(":");
  return `${h!.padStart(2, "0")}:${m!.padStart(2, "0")}`;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  const { id } = await params;
  const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.id, id));
  if (!sub) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(sub);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireApiKey(req);
  if (authError) return authError;
  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  const { id } = await params;
  const [existing] = await db.select().from(subscriptions).where(eq(subscriptions.id, id));
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = patchBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.webhookUrl !== undefined) updates.webhookUrl = parsed.data.webhookUrl;
  if (parsed.data.pullEnabled !== undefined) updates.pullEnabled = parsed.data.pullEnabled;
  if (parsed.data.enabled !== undefined) updates.enabled = parsed.data.enabled;
  if (parsed.data.filters !== undefined) updates.filters = parsed.data.filters as Record<string, unknown>;
  if (parsed.data.outputFormat !== undefined) updates.outputFormat = parsed.data.outputFormat;
  if (parsed.data.deliveryRateLimitMinutes !== undefined) updates.deliveryRateLimitMinutes = parsed.data.deliveryRateLimitMinutes;
  if (parsed.data.deliveryMode !== undefined) updates.deliveryMode = parsed.data.deliveryMode;
  if (parsed.data.digestScheduleTime !== undefined) {
    updates.digestScheduleTime = parsed.data.digestScheduleTime ? normalizeHHMM(parsed.data.digestScheduleTime) : null;
  }

  const [updated] = await db
    .update(subscriptions)
    .set(updates as Record<string, unknown>)
    .where(eq(subscriptions.id, id))
    .returning();
  return NextResponse.json(updated);
}
