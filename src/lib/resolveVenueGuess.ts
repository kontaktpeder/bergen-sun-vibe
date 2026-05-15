import type { Venue } from "@/lib/domain";
import { distanceMeters } from "@/lib/dedupe-venues";
import type { VenueBadgeState } from "@/hooks/useVenueBadges";

export type VenueGuessConfidence = "high" | "medium" | "low";

export interface VenueGuess {
  venue: Venue;
  distanceM: number;
  score: number;
}

export interface VenueGuessResult {
  confidence: VenueGuessConfidence;
  primary: VenueGuess | null;
  candidates: VenueGuess[];
}

const AUTO_CONFIRM_M = 60;
const SINGLE_SUGGEST_M = 120;
const MAX_CANDIDATE_M = 400;

function recencyBoost(iso: string | null | undefined): number {
  if (!iso) return 0;
  const ageMin = (Date.now() - new Date(iso).getTime()) / 60000;
  if (ageMin <= 30) return 200;
  if (ageMin <= 120) return 100;
  if (ageMin <= 360) return 40;
  return 0;
}

export function scoreVenue(
  venue: Venue,
  userLat: number,
  userLng: number,
  favoriteIds: Set<string>,
  badge?: VenueBadgeState | null,
): VenueGuess | null {
  const distanceM = distanceMeters(userLat, userLng, venue.lat, venue.lng);
  if (distanceM > MAX_CANDIDATE_M) return null;

  let score = Math.max(0, 1000 - distanceM);
  if (favoriteIds.has(venue.id)) score += 280;
  score += recencyBoost(badge?.sunAt);
  score += recencyBoost(badge?.crowdAt);
  score += recencyBoost(venue.lastActivityAt);
  if ((badge?.photoCount ?? 0) > 0) score += 30;

  return { venue, distanceM, score };
}

export function resolveVenueGuess(
  userLat: number,
  userLng: number,
  venues: Venue[],
  favoriteIds: string[],
  badgeMap: Record<string, VenueBadgeState> = {},
): VenueGuessResult {
  const favSet = new Set(favoriteIds);
  const ranked = venues
    .map((v) => scoreVenue(v, userLat, userLng, favSet, badgeMap[v.dbId]))
    .filter((x): x is VenueGuess => x != null)
    .sort((a, b) => b.score - a.score);

  if (!ranked.length) {
    return { confidence: "low", primary: null, candidates: [] };
  }

  const best = ranked[0];

  if (best.distanceM <= AUTO_CONFIRM_M) {
    return { confidence: "high", primary: best, candidates: ranked.slice(0, 3) };
  }
  if (best.distanceM <= SINGLE_SUGGEST_M) {
    return { confidence: "medium", primary: best, candidates: ranked.slice(0, 3) };
  }

  return {
    confidence: "low",
    primary: null,
    candidates: ranked.slice(0, 3),
  };
}

export function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m)} meter unna`;
  return `${(m / 1000).toFixed(1)} km unna`;
}
