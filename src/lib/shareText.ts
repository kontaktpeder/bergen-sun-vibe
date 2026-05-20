import type { SunStatus, CrowdLevel } from "@/lib/contribution-types";
import { SITE_BASE } from "@/lib/seo";

export type ShareVenue = {
  name: string;
  slug?: string | null;
  id?: string;
  city?: string | null;
};

export type ShareLive = {
  sun?: SunStatus;
  crowd?: CrowdLevel;
  beerPrice?: number;
};

export type ShareData = { title: string; text: string; url: string };

export function buildVenueShareUrl(v: ShareVenue): string {
  const slug = v.slug ?? v.id;
  return `${SITE_BASE}/steder/${slug}`;
}

export function buildVenueShareText(v: ShareVenue, live?: ShareLive): ShareData {
  const url = buildVenueShareUrl(v);
  const title = `${v.name} — Utefolket`;

  let text: string;
  if (live?.beerPrice && live.beerPrice > 0) {
    text = `${live.beerPrice}kr pils på ${v.name} 🍺`;
  } else if (live?.sun === "sun") {
    text = `Sol på ${v.name} akkurat nå ☀️`;
  } else if (live?.sun === "partial") {
    text = `Delvis sol på ${v.name} nå ⛅`;
  } else if (live?.sun === "going_down") {
    text = `Kveldssol på ${v.name} akkurat nå 🌇`;
  } else if (live?.crowd === "full") {
    text = `Helt fullt på ${v.name} i kveld 🔥`;
  } else if (live?.crowd === "quiet") {
    text = `Rolig på ${v.name} nå 😌`;
  } else {
    const cityPart = v.city ? ` i ${v.city}` : "";
    text = `${v.name}${cityPart} — sjekk live status`;
  }

  return { title, text, url };
}

// Extract latest live status from a contributions feed (newest first).
// Looks within the last `maxAgeHours` to keep "live" honest.
export function latestLiveFromContributions(
  contributions: Array<{ type: string; data: Record<string, unknown>; created_at: string }>,
  maxAgeHours = 6,
): ShareLive {
  const cutoff = Date.now() - maxAgeHours * 3600 * 1000;
  const live: ShareLive = {};
  for (const c of contributions) {
    if (new Date(c.created_at).getTime() < cutoff) continue;
    if (!live.sun && c.type === "sun_report") {
      const s = c.data?.status as SunStatus | undefined;
      if (s) live.sun = s;
    } else if (!live.crowd && c.type === "crowd_report") {
      const l = c.data?.level as CrowdLevel | undefined;
      if (l) live.crowd = l;
    } else if (!live.beerPrice && c.type === "beer_price") {
      const p = Number(c.data?.price);
      if (p > 0) live.beerPrice = p;
    }
    if (live.sun && live.crowd && live.beerPrice) break;
  }
  return live;
}
