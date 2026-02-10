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
  const text = [event.title, event.body].filter(Boolean).join(" ").toLowerCase();
  if (filters?.includeKeywords?.length) {
    for (const k of filters.includeKeywords) {
      if (text.includes(k.toLowerCase())) score += 10;
    }
  }
  return score;
}

/** High-signal keywords for promoter: only promo-worthy events get extra score */
const PROMO_KEYWORDS: { keyword: string; points: number }[] = [
  { keyword: "release", points: 10 },
  { keyword: "breaking", points: 15 },
  { keyword: "security", points: 15 },
  { keyword: "launch", points: 10 },
  { keyword: "announce", points: 8 },
];

/** Score event for promoter: includeKeywords match + high-signal content keywords */
export function promoScoreEvent(
  event: NormalizedEvent,
  filters: SubscriptionFilters | null | undefined
): number {
  let score = scoreEvent(event, filters);
  const text = [event.title, event.body].filter(Boolean).join(" ").toLowerCase();
  for (const { keyword, points } of PROMO_KEYWORDS) {
    if (text.includes(keyword)) score += points;
  }
  return score;
}
