import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type VenuePhotoMap = Record<string, string | undefined>;

const MIN_AGE_MS = 10 * 60 * 1000; // 10 minutes anti-troll window

/**
 * Batched lookup: best user-uploaded photo URL per venue id.
 * MVP: pick the OLDEST active photo so the cover is stable and matches what
 * the venue detail page shows.
 */
export function useVenuePhotos(venueIds: string[]) {
  const ids = [...new Set(venueIds.filter(Boolean))].sort();
  const key = ids.join(",");
  return useQuery<VenuePhotoMap>({
    queryKey: ["venue-photos-batch", "oldest", key],
    enabled: ids.length > 0,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contributions")
        .select("venue_id, data, created_at")
        .in("venue_id", ids)
        .eq("type", "photo")
        .eq("status", "active")
        .order("created_at", { ascending: true });
      if (error) return {};

      const map: VenuePhotoMap = {};
      for (const row of data ?? []) {
        const vid = row.venue_id as string | null;
        if (!vid || map[vid]) continue;
        const url = (row.data as Record<string, unknown> | null)?.image_url;
        if (typeof url !== "string" || url.length === 0) continue;
        map[vid] = url;
      }
      return map;
    },
  });
}
