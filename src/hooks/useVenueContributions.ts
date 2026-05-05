import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface VenueContribution {
  id: string;
  type: string;
  data: Record<string, unknown>;
  created_at: string;
  user_id: string;
  points_awarded: number;
}

export function useVenueContributions(venueDbId: string | undefined) {
  return useQuery<VenueContribution[]>({
    queryKey: ["contributions", venueDbId],
    enabled: !!venueDbId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contributions")
        .select("id, type, data, created_at, user_id, points_awarded")
        .eq("venue_id", venueDbId as string)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data ?? []) as VenueContribution[];
    },
    staleTime: 30_000,
  });
}
