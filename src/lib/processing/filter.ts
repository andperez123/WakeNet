import type { NormalizedEvent } from "../types";
import type { SubscriptionFilters } from "../types";

export function matchesFilters(
  event: NormalizedEvent,
  filters: SubscriptionFilters | null | undefined
): boolean {
  if (!filters) return true;
  const text = [event.title, event.body, event.source]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (filters.excludeKeywords?.length) {
    const hasExcluded = filters.excludeKeywords.some((k) =>
      text.includes(k.toLowerCase())
    );
    if (hasExcluded) return false;
  }

  if (filters.includeKeywords?.length) {
    const hasIncluded = filters.includeKeywords.some((k) =>
      text.includes(k.toLowerCase())
    );
    if (!hasIncluded) return false;
  }

  return true;
}

export function scoreEvent(
  event: NormalizedEvent,
  filters: SubscriptionFilters | null | undefined
): number {
  let score = 0;
  if (!filters?.includeKeywords?.length) return score;
  const text = [event.title, event.body].filter(Boolean).join(" ").toLowerCase();
  for (const k of filters.includeKeywords) {
    if (text.includes(k.toLowerCase())) score += 10;
  }
  return score;
}
