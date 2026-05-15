import type { Venue, SunStatus } from "@/lib/domain";
import type { VenueBadgeState } from "@/hooks/useVenueBadges";
import { FACET_DEFS } from "@/lib/seo";

export interface VenueFact {
  label: string;
  value: string;
}

export interface VenueTip {
  title: string;
  body: string;
}

export interface VenueContentBlocks {
  introShort: string;
  introFull: string;
  showReadMore: boolean;
  facts: VenueFact[];
  tips: VenueTip[];
  vibeLabels: string[];
}

const PRICE_LABELS: Record<number, string> = {
  1: "Billig",
  2: "Middels",
  3: "Dyrt",
  4: "Premium",
};

const SUN_STATUS_LABELS: Record<SunStatus, string> = {
  "sun-now": "Sol nå",
  "sun-until": "Sol en stund til",
  "evening-sun": "Kveldssol",
  "shade-soon": "Skygge snart",
  shade: "Skygge",
};

const CROWD_LABELS: Record<string, string> = {
  quiet: "Rolig",
  some: "Litt liv",
  full: "Livlig",
  queue: "Kø / fullt",
};

const OUTDOOR_TAG = /ute|utendør|terrasse|tak|rooftop|uteservering/i;

function trimIntro(text: string, maxLen = 280): string {
  const t = text.trim();
  if (!t) return "";
  if (t.length <= maxLen) return t;
  const slice = t.slice(0, maxLen);
  const lastPeriod = Math.max(slice.lastIndexOf(". "), slice.lastIndexOf("! "), slice.lastIndexOf("? "));
  if (lastPeriod > 80) return slice.slice(0, lastPeriod + 1).trim();
  return `${slice.trim()}…`;
}

function fallbackIntro(venue: Venue): string {
  const area = venue.area ? ` på ${venue.area}` : "";
  const city = venue.city ? ` i ${venue.city}` : "";
  return `${venue.name} er et ${venue.category}${area}${city}. Sjekk live status for sol, stemning og pris.`;
}

function liveSunLabel(badge?: VenueBadgeState | null, venue?: Venue): string | null {
  if (badge?.sun === "sunny") return "Sol nå";
  if (badge?.sun === "partial") return "Delvis sol";
  if (venue?.sunStatus) return SUN_STATUS_LABELS[venue.sunStatus] ?? null;
  return null;
}

function liveCrowdLabel(badge?: VenueBadgeState | null): string | null {
  if (!badge?.crowd) return null;
  return CROWD_LABELS[badge.crowd] ?? null;
}

function idealForLabels(venue: Venue): string {
  const matched = FACET_DEFS.filter((f) => f.match(venue)).map((f) => f.label);
  if (venue.familyFriendly && !matched.includes("Familie")) {
    matched.push("Familievennlig");
  }
  return matched.slice(0, 4).join(", ") || "Ute";
}

function bestTimeHint(venue: Venue, badge?: VenueBadgeState | null): string | null {
  if (badge?.sun === "sunny" || badge?.sun === "partial") return "Nå (sol ute)";
  if (venue.sunStatus === "evening-sun") return "Ettermiddag / kveld";
  if (venue.tags.some((t) => /kveldssol|sunset|kveld/i.test(t))) return "Ettermiddag / kveld";
  if (venue.tags.some((t) => /afterwork|happyhour/i.test(t))) return "Etter jobb";
  return null;
}

function outdoorHint(venue: Venue): string | null {
  if (venue.tags.some((t) => OUTDOOR_TAG.test(t))) return "Ja";
  return null;
}

function buildVibeLabels(venue: Venue, badge?: VenueBadgeState | null): string[] {
  const out: string[] = [];
  const sun = liveSunLabel(badge, venue);
  if (sun) out.push(sun);
  const crowd = liveCrowdLabel(badge);
  if (crowd) out.push(crowd);
  if (badge?.beerPrice != null) out.push(`🍺 ${badge.beerPrice} kr`);
  for (const f of FACET_DEFS) {
    if (f.match(venue) && !out.includes(f.label)) out.push(f.label);
  }
  if (venue.familyFriendly && !out.some((l) => /familie/i.test(l))) {
    out.push("Familievennlig");
  }
  return out.slice(0, 6);
}

function buildFacts(venue: Venue, badge?: VenueBadgeState | null): VenueFact[] {
  const best = bestTimeHint(venue, badge);
  const sun = liveSunLabel(badge, venue);
  const crowd = liveCrowdLabel(badge);
  const ideal = idealForLabels(venue);
  const outdoor = outdoorHint(venue);
  const rows: (VenueFact | null)[] = [
    best ? { label: "Beste tid", value: best } : null,
    sun ? { label: "Sol", value: sun } : null,
    crowd ? { label: "Stemning", value: crowd } : null,
    { label: "Prisnivå", value: PRICE_LABELS[venue.priceLevel] ?? "Middels" },
    ideal ? { label: "Passer for", value: ideal } : null,
    outdoor ? { label: "Uteplass", value: outdoor } : null,
    venue.hours?.trim() ? { label: "Åpningstider", value: venue.hours.trim() } : null,
    badge?.beerPrice != null ? { label: "Øl fra", value: `${badge.beerPrice} kr` } : null,
  ];
  return rows.filter((r): r is VenueFact => r != null);
}

export function buildVenueContentBlocks(
  venue: Venue,
  badge?: VenueBadgeState | null,
): VenueContentBlocks {
  const introFull = venue.description?.trim() || fallbackIntro(venue);
  const introShort = trimIntro(introFull);
  const showReadMore = introFull.length > introShort.length + 20;

  return {
    introShort,
    introFull,
    showReadMore,
    facts: buildFacts(venue, badge),
    tips: [], // Fase B: content_blocks
    vibeLabels: buildVibeLabels(venue, badge),
  };
}
