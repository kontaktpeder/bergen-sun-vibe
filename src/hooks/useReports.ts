import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ReportReason = "wrong_info" | "spam" | "inappropriate" | "other";

export function useCreateReport(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { contributionId: string; reason: ReportReason }) => {
      if (!userId) throw new Error("Du må være innlogget for å rapportere.");
      const { error } = await supabase.from("reports").insert({
        contribution_id: vars.contributionId,
        reporter_user_id: userId,
        reason: vars.reason,
      });
      if (error) throw new Error(error.message);
      return true;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export type ReportRow = {
  id: string;
  contribution_id: string;
  reason: string;
  created_at: string;
  contribution: {
    id: string;
    type: string;
    data: Record<string, unknown>;
    status: string;
    venue_id: string | null;
    user_id: string;
    points_awarded: number;
  } | null;
  venue: { id: string; name: string } | null;
};

export function useReports() {
  return useQuery({
    queryKey: ["reports"],
    queryFn: async (): Promise<ReportRow[]> => {
      const { data, error } = await supabase
        .from("reports")
        .select("id, contribution_id, reason, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = data ?? [];
      const ids = rows.map((r) => r.contribution_id);
      if (ids.length === 0) return [];

      const { data: contribs } = await supabase
        .from("contributions")
        .select("id, type, data, status, venue_id, user_id, points_awarded")
        .in("id", ids);

      const venueIds = Array.from(new Set((contribs ?? []).map((c) => c.venue_id).filter(Boolean) as string[]));
      const { data: venues } = venueIds.length
        ? await supabase.from("venues").select("id, name").in("id", venueIds)
        : { data: [] as { id: string; name: string }[] };

      const cMap = new Map((contribs ?? []).map((c) => [c.id, c]));
      const vMap = new Map((venues ?? []).map((v) => [v.id, v]));

      return rows.map((r) => {
        const c = cMap.get(r.contribution_id);
        return {
          id: r.id,
          contribution_id: r.contribution_id,
          reason: r.reason,
          created_at: r.created_at,
          contribution: c
            ? {
                id: c.id,
                type: c.type,
                data: (c.data as Record<string, unknown>) ?? {},
                status: c.status,
                venue_id: c.venue_id,
                user_id: c.user_id,
                points_awarded: c.points_awarded,
              }
            : null,
          venue: c?.venue_id ? vMap.get(c.venue_id) ?? null : null,
        };
      });
    },
  });
}

export function useModerateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { reportId: string; action: "ignore" | "remove" }) => {
      const { data, error } = await supabase.rpc("moderate_report", {
        _report_id: vars.reportId,
        _action: vars.action,
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reports"] });
      qc.invalidateQueries({ queryKey: ["venue"] });
      qc.invalidateQueries({ queryKey: ["contributions"] });
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });
}

export function useIsAdmin(userId: string | undefined) {
  return useQuery({
    queryKey: ["isAdmin", userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return false;
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      if (error) return false;
      return !!data;
    },
  });
}
