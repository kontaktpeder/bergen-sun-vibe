import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getLevel, type LevelName } from "@/lib/levels";

export type LeaderboardEntry = {
  id: string;
  username: string | null;
  avatarUrl: string | null;
  points: number;
  level: LevelName;
};

export function useLeaderboard(limit = 10) {
  return useQuery({
    queryKey: ["leaderboard", limit],
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, points")
        .order("points", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []).map((p) => ({
        id: p.id,
        username: p.username,
        avatarUrl: p.avatar_url,
        points: p.points ?? 0,
        level: getLevel(p.points ?? 0),
      }));
    },
  });
}
