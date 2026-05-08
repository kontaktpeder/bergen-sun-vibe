import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type VenueBadgeSun = "sunny" | "partial" | "shade" | "unknown";

export interface VenueBadgeState {
  sun: VenueBadgeSun | null;
  sunAt: string | null;
  beerPrice: number | null;
  photoCount: number;
  latestPhotoUrl: string | null;
  crowd: string | null;
  crowdAt: string | null;
}

const FRESH_MS = 60 * 60 * 1000; // 60 min

interface ContribRow {
  venue_id: string;
  type: string;
  data: Record<string, unknown> | null;
  created_at: string;
}

function emptyState(): VenueBadgeState {
  return { sun: null, sunAt: null, beerPrice: null, photoCount: 0, latestPhotoUrl: null, crowd: null, crowdAt: null };
}

function mapSun(status: unknown): VenueBadgeSun | null {
  if (status === "sun") return "sunny";
  if (status === "partial") return "partial";
  if (status === "shade") return "shade";
  if (status === "going_down") return "shade";
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
        .in("type", ["sun_report", "beer_price", "photo", "crowd_report"])
        .order("created_at", { ascending: false });
      if (error) throw error;

      const out: Record<string, VenueBadgeState> = {};
      for (const id of ids) out[id] = emptyState();

      // Collect photo rows separately to apply best-cover selection (oldest mature).
      const photosByVenue: Record<string, ContribRow[]> = {};

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
        } else if (r.type === "crowd_report" && s.crowd === null) {
          const ageMs = Date.now() - new Date(r.created_at).getTime();
          if (ageMs <= FRESH_MS) {
            s.crowd = String((r.data as Record<string, unknown>)?.level ?? "");
            s.crowdAt = r.created_at;
          }
        } else if (r.type === "photo") {
          s.photoCount += 1;
          (photosByVenue[r.venue_id] ||= []).push(r);
        }

        out[r.venue_id] = s;
      }

      // Best photo = oldest mature (>10min). Fallback = oldest available.
      const MATURE_MS = 10 * 60 * 1000;
      const now = Date.now();
      for (const [vid, rows] of Object.entries(photosByVenue)) {
        // rows arrive DESC; sort ASC for stable oldest-first
        const asc = [...rows].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        );
        let pick: string | null = null;
        let fallback: string | null = null;
        for (const r of asc) {
          const url = (r.data as Record<string, unknown> | null)?.image_url;
          if (typeof url !== "string" || url.length === 0) continue;
          if (!fallback) fallback = url;
          if (now - new Date(r.created_at).getTime() >= MATURE_MS) {
            pick = url;
            break;
          }
        }
        const s = out[vid];
        if (s) s.latestPhotoUrl = pick ?? fallback;
      }

      return out;
    },
  });
}
