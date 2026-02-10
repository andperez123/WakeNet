import { signPayload } from "./sign";

const WAKENET_SIGNATURE_HEADER = "x-wakenet-signature";

export interface WebhookPayload {
  id: string;
  feedId: string;
  event: {
    id: string;
    source: string;
    title: string;
    link?: string;
    published?: string;
    body?: string;
    metadata?: Record<string, unknown>;
  };
  deliveredAt: string;
}

/** Promoter-style payload for Clawdbot (type, title, summary, url, etc.) */
export interface PromoterPayload {
  type: "feed_event" | "skill_release";
  title: string;
  summary: string;
  url?: string;
  tags?: string[];
  source?: string;
  published_at?: string;
  eventId?: string;
  deliveredAt?: string;
}

export async function deliverWebhook(
  url: string,
  payload: WebhookPayload | PromoterPayload,
  secret: string
): Promise<{ ok: boolean; status: number }> {
  const body = JSON.stringify(payload);
  const signature = signPayload(body, secret);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      [WAKENET_SIGNATURE_HEADER]: signature,
    },
    body,
  });

  return { ok: res.ok, status: res.status };
}

export function buildPromoterPayload(
  event: WebhookPayload["event"],
  eventId: string,
  type: "feed_event" | "skill_release" = "feed_event"
): PromoterPayload {
  const summary =
    (event.body && event.body.length > 200 ? event.body.slice(0, 200) + "…" : event.body) ||
    event.title;
  return {
    type,
    title: event.title,
    summary,
    url: event.link,
    source: event.source,
    published_at: event.published,
    eventId,
    deliveredAt: new Date().toISOString(),
  };
}

export { WAKENET_SIGNATURE_HEADER };
