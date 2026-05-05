import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ContributionPayload } from "@/lib/contribution-types";
import type { VenueContribution } from "@/hooks/useVenueContributions";
import { POINTS } from "@/lib/contribution-types";

type Result = {
  awardedPoints: number;
  newPoints: number;
  contributionId: string;
  venueId?: string;
  venueSlug?: string;
};

type Profile = { id: string; points: number; username?: string | null; avatar_url?: string | null };

function estimatePoints(p: ContributionPayload): number {
  if (p.type === "beer_price") return p.isConfirm ? POINTS.beer_price_confirm : POINTS.beer_price;
  return POINTS[p.type];
}

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
        venue_slug?: string | null;
        awarded_points: number;
        new_points: number;
      };

      return {
        awardedPoints: r.awarded_points,
        newPoints: r.new_points,
        contributionId: r.contribution_id,
        venueId: r.venue_id ?? undefined,
        venueSlug: r.venue_slug ?? undefined,
      };
    },

    onMutate: async (payload) => {
      if (!userId) return;
      const venueId = payload.type === "venue_add" ? undefined : payload.venueId;
      const estPoints = estimatePoints(payload);

      // Cancel outgoing refetches
      await Promise.all([
        venueId ? qc.cancelQueries({ queryKey: ["contributions", venueId] }) : Promise.resolve(),
        qc.cancelQueries({ queryKey: ["profile", userId] }),
      ]);

      const prevContribs = venueId
        ? qc.getQueryData<VenueContribution[]>(["contributions", venueId])
        : undefined;
      const prevProfile = qc.getQueryData<Profile>(["profile", userId]);

      // Optimistic feed insert
      if (venueId && payload.type !== "venue_add") {
        const tempId = `temp-${Date.now()}`;
        const optimistic: VenueContribution = {
          id: tempId,
          type: payload.type,
          data: payload.data as Record<string, unknown>,
          created_at: new Date().toISOString(),
          user_id: userId,
          points_awarded: estPoints,
        };
        qc.setQueryData<VenueContribution[]>(["contributions", venueId], (old) =>
          [optimistic, ...(old ?? [])].slice(0, 10),
        );
      }

      // Optimistic points bump
      if (prevProfile) {
        qc.setQueryData<Profile>(["profile", userId], {
          ...prevProfile,
          points: (prevProfile.points ?? 0) + estPoints,
        });
      }

      return { prevContribs, prevProfile, venueId };
    },

    onError: (_err, _payload, ctx) => {
      if (!ctx || !userId) return;
      if (ctx.venueId && ctx.prevContribs !== undefined) {
        qc.setQueryData(["contributions", ctx.venueId], ctx.prevContribs);
      }
      if (ctx.prevProfile) {
        qc.setQueryData(["profile", userId], ctx.prevProfile);
      }
    },

    onSuccess: ({ venueId }) => {
      qc.invalidateQueries({ queryKey: ["venues"] });
      qc.invalidateQueries({ queryKey: ["venue"] });
      if (userId) qc.invalidateQueries({ queryKey: ["profile", userId] });
      if (venueId) qc.invalidateQueries({ queryKey: ["contributions", venueId] });
      if (venueId) qc.invalidateQueries({ queryKey: ["venue-latest-photo", venueId] });
      qc.invalidateQueries({ queryKey: ["venue-badges"] });
    },
  });
}
