import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mapDbVenue, type DbVenue, type Venue } from "@/lib/domain";

// Slår opp en venue via slug (rute-param `id` i appen er slug).
export function useVenue(slug: string | undefined) {
  return useQuery<Venue | null>({
    queryKey: ["venue", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("venues")
        .select("*")
        .eq("slug", slug as string)
        .maybeSingle();
      if (error) throw error;
      return data ? mapDbVenue(data as unknown as DbVenue) : null;
    },
    staleTime: 60_000,
  });
}
