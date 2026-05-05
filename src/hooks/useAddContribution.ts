import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ContributionPayload } from "@/lib/contribution-types";

type Result = {
  awardedPoints: number;
  newPoints: number;
  contributionId: string;
  venueId?: string;
};

export function useAddContribution(userId: string | undefined) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ContributionPayload): Promise<Result> => {
      if (!userId) throw new Error("Du må være innlogget for å bidra.");

      const args =
        payload.type === "venue_add"
          ? {
              _type: "venue_add",
              _venue_id: null as unknown as string,
              _data: {} as never,
              _new_venue: payload.data as never,
            }
          : {
              _type: payload.type,
              _venue_id: payload.venueId,
              _data: payload.data as never,
              _is_confirm: payload.type === "beer_price" ? !!payload.isConfirm : false,
            };

      const { data, error } = await supabase.rpc("submit_contribution", args);
      if (error) throw new Error(error.message);

      const r = data as {
        contribution_id: string;
        venue_id: string | null;
        awarded_points: number;
        new_points: number;
      };

      return {
        awardedPoints: r.awarded_points,
        newPoints: r.new_points,
        contributionId: r.contribution_id,
        venueId: r.venue_id ?? undefined,
      };
    },

    onSuccess: ({ venueId }) => {
      qc.invalidateQueries({ queryKey: ["venues"] });
      qc.invalidateQueries({ queryKey: ["venue"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      if (venueId) qc.invalidateQueries({ queryKey: ["contributions", venueId] });
    },
  });
}
