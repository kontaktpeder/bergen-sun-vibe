import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { POINTS, type ContributionPayload } from "@/lib/contribution-types";

type Result = {
  awardedPoints: number;
  newPoints: number;
  contributionId: string;
  venueId?: string;
};

function getAwardedPoints(payload: ContributionPayload): number {
  if (payload.type === "beer_price" && payload.isConfirm) return POINTS.beer_price_confirm;
  return POINTS[payload.type];
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function useAddContribution(userId: string | undefined, currentPoints: number) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ContributionPayload): Promise<Result> => {
      if (!userId) throw new Error("Du må være innlogget for å bidra.");
      const awardedPoints = getAwardedPoints(payload);

      let venueId: string | undefined =
        payload.type === "venue_add" ? undefined : payload.venueId;

      if (payload.type === "venue_add") {
        const slug = `${slugify(payload.data.name)}-${Date.now().toString(36)}`;
        const { data: venue, error: venueError } = await supabase
          .from("venues")
          .insert({
            name: payload.data.name,
            category: payload.data.category,
            lat: payload.data.lat,
            lng: payload.data.lng,
            image_url: payload.data.image_url ?? null,
            last_activity_at: new Date().toISOString(),
            tags: [],
            slug,
          })
          .select("id")
          .single();
        if (venueError) throw venueError;
        venueId = venue.id;
      }

      const { data: contribution, error: cError } = await supabase
        .from("contributions")
        .insert({
          user_id: userId,
          venue_id: venueId ?? null,
          type: payload.type,
          data: payload.data as never,
          points_awarded: awardedPoints,
          status: "active",
        })
        .select("id, created_at")
        .single();
      if (cError) throw cError;

      const { error: pError } = await supabase.from("point_events").insert({
        user_id: userId,
        source_type: "contribution_create",
        source_id: contribution.id,
        delta: awardedPoints,
      });
      if (pError) throw pError;

      const newPoints = currentPoints + awardedPoints;
      const { error: uError } = await supabase
        .from("profiles")
        .update({ points: newPoints })
        .eq("id", userId);
      if (uError) throw uError;

      if (venueId) {
        await supabase
          .from("venues")
          .update({ last_activity_at: new Date().toISOString() })
          .eq("id", venueId);
      }

      return { awardedPoints, newPoints, contributionId: contribution.id, venueId };
    },

    onSuccess: ({ venueId }) => {
      qc.invalidateQueries({ queryKey: ["venues"] });
      qc.invalidateQueries({ queryKey: ["venue"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      if (venueId) qc.invalidateQueries({ queryKey: ["contributions", venueId] });
    },
  });
}
