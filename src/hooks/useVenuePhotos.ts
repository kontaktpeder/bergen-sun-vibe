import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type VenuePhotoMap = Record<string, string | undefined>;

const MIN_AGE_MS = 10 * 60 * 1000; // 10 minutes anti-troll window

/**
 * Batched lookup: BEST (stable cover) user-uploaded photo URL per venue id.
 *
 * Selection logic (MVP):
 *  - Filter active photo contributions
 *  - Drop entries without image_url
 *  - Drop entries newer than 10 minutes (anti-troll)
 *  - Pick the OLDEST remaining (stable over time, doesn't jump)
 *  - If no candidate qualifies, fall back to the oldest active photo regardless of age
 */
export function useVenuePhotos(venueIds: string[]) {
  const ids = [...new Set(venueIds.filter(Boolean))].sort();
  const key = ids.join(",");
  return useQuery<VenuePhotoMap>({
    queryKey: ["venue-photos-batch", "best", key],
    enabled: ids.length > 0,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contributions")
        .select("venue_id, data, created_at")
        .in("venue_id", ids)
        .eq("type", "photo")
        .eq("status", "active")
        .order("created_at", { ascending: true }); // oldest first
      if (error) return {};

      const now = Date.now();
      // Two passes per venue: prefer oldest "mature" photo (>10min), else oldest any.
      const best: VenuePhotoMap = {};
      const fallback: VenuePhotoMap = {};

      for (const row of data ?? []) {
        const vid = row.venue_id as string | null;
        if (!vid) continue;
        const url = (row.data as Record<string, unknown> | null)?.image_url;
        if (typeof url !== "string" || url.length === 0) continue;

        if (!fallback[vid]) fallback[vid] = url;

        const ageMs = now - new Date(row.created_at).getTime();
        if (ageMs >= MIN_AGE_MS && !best[vid]) {
          best[vid] = url;
        }
      }

      const map: VenuePhotoMap = {};
      for (const vid of ids) {
        map[vid] = best[vid] ?? fallback[vid];
      }
      return map;
    },
  });
}
