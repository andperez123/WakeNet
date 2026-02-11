import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { feeds } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { processRawEvents } from "@/lib/pipeline/run";
import type { NormalizedEvent } from "@/lib/types";

/**
 * Ingest endpoint for webhook_inbox feeds. Intentionally does NOT use requireApiKey:
 * authentication is the path token only. When the server enables WAKENET_API_KEY for
 * other routes, this route must remain open so external producers (Stripe, Zapier, etc.)
 * can POST without an API key.
 */

const MAX_BODY_BYTES = 512 * 1024; // 512 KB
const MAX_EVENTS_PER_REQUEST = 100;
const MAX_TITLE_LENGTH = 2000;
const MAX_BODY_LENGTH = 100 * 1024; // 100 KB
const MAX_SOURCE_LENGTH = 500;
const MAX_LINK_LENGTH = 2048;
const MAX_PUBLISHED_LENGTH = 100;

const ingestEventSchema = {
  id: (v: unknown) => typeof v === "string" && v.length > 0 && v.length <= 500,
  source: (v: unknown) => typeof v === "string" && v.length > 0 && v.length <= MAX_SOURCE_LENGTH,
  title: (v: unknown) => typeof v === "string" && v.length > 0 && v.length <= MAX_TITLE_LENGTH,
  link: (v: unknown) => v == null || (typeof v === "string" && v.length <= MAX_LINK_LENGTH),
  published: (v: unknown) => v == null || (typeof v === "string" && v.length <= MAX_PUBLISHED_LENGTH),
  body: (v: unknown) => v == null || (typeof v === "string" && v.length <= MAX_BODY_LENGTH),
  metadata: (v: unknown) =>
    v == null || (typeof v === "object" && v !== null && !Array.isArray(v) && JSON.stringify(v).length <= 50_000),
};

function parseEvent(raw: unknown): NormalizedEvent | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (!ingestEventSchema.id(o.id) || !ingestEventSchema.source(o.source) || !ingestEventSchema.title(o.title))
    return null;
  return {
    id: String(o.id),
    source: String(o.source),
    title: String(o.title).slice(0, MAX_TITLE_LENGTH),
    link: ingestEventSchema.link(o.link) ? String(o.link).slice(0, MAX_LINK_LENGTH) : undefined,
    published: ingestEventSchema.published(o.published) ? String(o.published).slice(0, MAX_PUBLISHED_LENGTH) : undefined,
    body: ingestEventSchema.body(o.body) ? String(o.body).slice(0, MAX_BODY_LENGTH) : undefined,
    metadata: ingestEventSchema.metadata(o.metadata) ? (o.metadata as Record<string, unknown>) : undefined,
  };
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: `Request body too large (max ${MAX_BODY_BYTES / 1024} KB)` },
      { status: 413 }
    );
  }

  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const rows = await db
    .select()
    .from(feeds)
    .where(and(eq(feeds.type, "webhook_inbox"), eq(feeds.enabled, true)));
  const configs = rows.map((r) => r.config as { token?: string; secret?: string });
  const feed = rows.find((_, i) => configs[i]?.token === token || configs[i]?.secret === token);
  if (!feed) return NextResponse.json({ error: "Unknown or disabled ingest token" }, { status: 404 });

  let body: unknown;
  try {
    const text = await req.text();
    if (text.length > MAX_BODY_BYTES) {
      return NextResponse.json(
        { error: `Request body too large (max ${MAX_BODY_BYTES / 1024} KB)` },
        { status: 413 }
      );
    }
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const rawList = Array.isArray(body) ? body : [body];
  if (rawList.length > MAX_EVENTS_PER_REQUEST) {
    return NextResponse.json(
      { error: `Too many events (max ${MAX_EVENTS_PER_REQUEST} per request)` },
      { status: 400 }
    );
  }

  const eventsParsed: NormalizedEvent[] = [];
  for (const raw of rawList) {
    const ev = parseEvent(raw);
    if (ev) eventsParsed.push(ev);
  }
  if (eventsParsed.length === 0) {
    return NextResponse.json({ error: "No valid events (need id, source, title per item; check field length limits)" }, { status: 400 });
  }

  const { eventsNew, deliveriesCreated } = await processRawEvents(feed, eventsParsed);
  return NextResponse.json({ accepted: eventsParsed.length, eventsNew, deliveriesCreated });
}
