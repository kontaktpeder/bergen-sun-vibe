import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type VenueBadgeSun = "sunny" | "partial" | "shade" | "unknown";

export interface VenueBadgeState {
  sun: VenueBadgeSun | null;
  sunAt: string | null;
  beerPrice: number | null;
  photoCount: number;
  latestPhotoUrl: string | null;
}

const FRESH_MS = 60 * 60 * 1000; // 60 min

interface ContribRow {
  venue_id: string;
  type: string;
  data: Record<string, unknown> | null;
  created_at: string;
}

function emptyState(): VenueBadgeState {
  return { sun: null, sunAt: null, beerPrice: null, photoCount: 0, latestPhotoUrl: null };
}

function mapSun(status: unknown): VenueBadgeSun | null {
  if (status === "sun") return "sunny";
  if (status === "partial") return "partial";
  if (status === "shade") return "shade";
  return null;
}

export function useVenueBadges(venueIds: string[]) {
  const ids = [...new Set(venueIds)].filter(Boolean).sort();
  const key = ids.join(",");

  return useQuery<Record<string, VenueBadgeState>>({
    queryKey: ["venue-badges", key],
    enabled: ids.length > 0,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contributions")
        .select("venue_id,type,data,created_at")
        .in("venue_id", ids)
        .eq("status", "active")
        .in("type", ["sun_report", "beer_price", "photo"])
        .order("created_at", { ascending: false });
      if (error) throw error;

      const out: Record<string, VenueBadgeState> = {};
      for (const id of ids) out[id] = emptyState();

      for (const r of (data ?? []) as ContribRow[]) {
        if (!r.venue_id) continue;
        const s = out[r.venue_id] ?? emptyState();

        if (r.type === "sun_report" && s.sun === null) {
          const ageMs = Date.now() - new Date(r.created_at).getTime();
          if (ageMs > FRESH_MS) {
            s.sun = "unknown";
          } else {
            s.sun = mapSun(r.data?.status) ?? "unknown";
          }
          s.sunAt = r.created_at;
        } else if (r.type === "beer_price" && s.beerPrice === null) {
          const raw = r.data?.price;
          const n = typeof raw === "number" ? raw : Number(raw);
          if (Number.isFinite(n) && n > 0) s.beerPrice = n;
        } else if (r.type === "photo") {
          s.photoCount += 1;
          if (!s.latestPhotoUrl) {
            const url = (r.data as Record<string, unknown> | null)?.image_url;
            if (typeof url === "string" && url.length > 0) s.latestPhotoUrl = url;
          }
        }

        out[r.venue_id] = s;
      }
      return out;
    },
  });
}
