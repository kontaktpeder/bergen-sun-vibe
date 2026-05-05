import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mapDbVenue, type DbVenue, type Venue } from "@/lib/domain";

export function useVenues() {
  return useQuery<Venue[]>({
    queryKey: ["venues"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("venues")
        .select("*")
        .order("last_activity_at", { ascending: false });
      if (error) throw error;
      return (data as unknown as DbVenue[]).map(mapDbVenue);
    },
    staleTime: 60_000,
  });
}
