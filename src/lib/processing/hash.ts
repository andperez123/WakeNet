import { createHash } from "crypto";
import type { NormalizedEvent } from "../types";

export function contentHash(event: NormalizedEvent): string {
  const payload = [
    event.id,
    event.source,
    event.title,
    event.link ?? "",
    event.published ?? "",
    event.body ?? "",
  ].join("|");
  return createHash("sha256").update(payload).digest("hex");
}
