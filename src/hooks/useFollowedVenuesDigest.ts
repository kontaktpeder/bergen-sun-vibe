import { useMemo } from "react";
import { useFavoriteContributionsFeed } from "@/hooks/useFavoriteContributionsFeed";
import { buildFollowedVenueDigests, type FollowedVenueDigest } from "@/lib/followedVenueDigest";
import type { Venue } from "@/lib/domain";

export function useFollowedVenuesDigest(
  venueDbIds: string[],
  venueByDbId: Record<string, Venue>,
) {
  // Reuse same upstream feed query (same cache key) — aggregation is pure JS.
  const { data: rows = [], isLoading, error } = useFavoriteContributionsFeed(venueDbIds);

  const digests: FollowedVenueDigest[] = useMemo(
    () => buildFollowedVenueDigests(rows, venueByDbId),
    [rows, venueByDbId],
  );

  return { digests, isLoading, error };
}
