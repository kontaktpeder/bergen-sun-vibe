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
        .limit(200);
      if (error) throw error;

      const rows = (data ?? []) as FavoriteContribution[];
      const cutoff24h = Date.now() - 24 * 60 * 60 * 1000;
      const seenLatest = new Set<string>(); // venueId|type for sun/crowd

      const filtered = rows.filter((r) => {
        if (r.type === "sun_report" || r.type === "crowd_report") {
          if (new Date(r.created_at).getTime() < cutoff24h) return false;
          const k = `${r.venue_id}|${r.type}`;
          if (seenLatest.has(k)) return false;
          seenLatest.add(k);
          return true;
        }
        return true; // beer_price + photo: show all
      });

      return filtered.slice(0, 50);
    },
  });
}
