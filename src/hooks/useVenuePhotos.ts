import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type VenuePhotoMap = Record<string, string | undefined>;



/**
 * Batched lookup: latest user-uploaded photo URL per venue id.
 * Matches what the venue detail page shows as cover.
 */
export function useVenuePhotos(venueIds: string[]) {
  const ids = [...new Set(venueIds.filter(Boolean))].sort();
  const key = ids.join(",");
  return useQuery<VenuePhotoMap>({
    queryKey: ["venue-photos-batch", "latest", key],
    enabled: ids.length > 0,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contributions")
        .select("venue_id, data, created_at")
        .in("venue_id", ids)
        .eq("type", "photo")
        .eq("status", "active")
        .order("created_at", { ascending: false }); // newest first
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
