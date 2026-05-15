import type { Venue } from "@/lib/domain";
import { distanceMeters } from "@/lib/geo";

export { distanceMeters };

function normName(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

export interface DedupeBadgeInfo {
  photoCount?: number;
  beerPrice?: number | null;
  sun?: string | null;
  latestPhotoUrl?: string | null;
}

// Group venues by (normalized name + within 50m) and keep the "best".
export function dedupeVenues(
  venues: Venue[],
  badges?: Record<string, DedupeBadgeInfo>,
): Venue[] {
  const groups: Venue[][] = [];
  for (const v of venues) {
    const n = normName(v.name);
    const g = groups.find((grp) => {
      const head = grp[0];
      if (normName(head.name) !== n) return false;
      return distanceMeters(head.lat, head.lng, v.lat, v.lng) < 50;
    });
    if (g) g.push(v);
    else groups.push([v]);
  }

  const score = (v: Venue): number => {
    const b = badges?.[v.dbId];
    let s = 0;
    if (b?.latestPhotoUrl) s += 1000;
    if ((b?.photoCount ?? 0) > 0) s += 500;
    if (b?.beerPrice != null) s += 200;
    if (b?.sun) s += 100;
    if (v.image) s += 50;
    if (v.rating > 0) s += Math.round(v.rating * 10);
    return s;
  };

  return groups.map((grp) => {
    if (grp.length === 1) return grp[0];
    return [...grp].sort((a, b) => score(b) - score(a))[0];
  });
}

// Find a possible duplicate for a candidate name+coords.
export function findPossibleDuplicate(
  venues: Venue[],
  name: string,
  lat: number,
  lng: number,
  radiusMeters = 50,
): Venue | null {
  const n = normName(name);
  if (!n) return null;
  for (const v of venues) {
    if (distanceMeters(v.lat, v.lng, lat, lng) > radiusMeters) continue;
    if (normName(v.name) === n) return v;
  }
  return null;
}
