import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const MIN_AGE_MS = 10 * 60 * 1000;

/**
 * Returns the URL of the BEST (stable cover) user-uploaded photo for a venue.
 * Mirrors useVenuePhotos selection logic for single-venue lookups.
 */
export function useLatestVenuePhoto(venueDbId: string | undefined) {
  return useQuery<string | null>({
    queryKey: ["venue-best-photo", venueDbId],
    enabled: !!venueDbId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contributions")
        .select("data, created_at")
        .eq("venue_id", venueDbId!)
        .eq("type", "photo")
        .eq("status", "active")
        .order("created_at", { ascending: true });
      if (error) return null;

      const now = Date.now();
      let fallback: string | null = null;
      for (const row of data ?? []) {
        const url = (row?.data as Record<string, unknown> | undefined)?.image_url;
        if (typeof url !== "string" || url.length === 0) continue;
        if (!fallback) fallback = url;
        const ageMs = now - new Date(row.created_at).getTime();
        if (ageMs >= MIN_AGE_MS) return url; // oldest mature photo
      }
      return fallback;
    },
  });
}
