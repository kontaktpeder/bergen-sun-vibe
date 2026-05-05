import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Returns the URL of the most recent user-uploaded photo for a venue, if any.
 * Lightweight per-venue lookup; cached by react-query.
 */
export function useLatestVenuePhoto(venueDbId: string | undefined) {
  return useQuery<string | null>({
    queryKey: ["venue-latest-photo", venueDbId],
    enabled: !!venueDbId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contributions")
        .select("data, created_at")
        .eq("venue_id", venueDbId!)
        .eq("type", "photo")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1);
      if (error) return null;
      const row = data?.[0];
      const url = (row?.data as Record<string, unknown> | undefined)?.image_url;
      return typeof url === "string" && url.length > 0 ? url : null;
    },
  });
}
