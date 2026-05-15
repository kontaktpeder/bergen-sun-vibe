import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { VenueContribution } from "@/hooks/useVenueContributions";

export type FavoriteContribution = VenueContribution & { venue_id: string };

export function useFavoriteContributionsFeed(venueDbIds: string[]) {
  const ids = [...new Set(venueDbIds.filter(Boolean))].sort();
  const key = ids.join(",");

  return useQuery<FavoriteContribution[]>({
    queryKey: ["favorite-contributions-feed", key],
    enabled: ids.length > 0,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contributions")
        .select("id, type, data, created_at, user_id, points_awarded, venue_id")
        .in("venue_id", ids)
        .eq("status", "active")
        .in("type", ["sun_report", "beer_price", "photo", "crowd_report"])
        .order("created_at", { ascending: false })
        .limit(25);
      if (error) throw error;
      return (data ?? []) as FavoriteContribution[];
    },
  });
}
