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

export async function deliverWebhook(
  url: string,
  payload: WebhookPayload,
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

export { WAKENET_SIGNATURE_HEADER };
