import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mapDbVenue, type DbVenue, type Venue } from "@/lib/domain";
import { dedupeVenues } from "@/lib/dedupe-venues";

export function useVenues() {
  return useQuery<Venue[]>({
    queryKey: ["venues"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("venues")
        .select("*")
        .order("last_activity_at", { ascending: false });
      if (error) throw error;
      const mapped = (data as unknown as DbVenue[]).map(mapDbVenue);
      // MVP dedupe: collapse same-name venues within 50m so users don't see
      // visible duplicates like "Highbury Pub" twice.
      return dedupeVenues(mapped);
    },
    staleTime: 60_000,
  });
}
