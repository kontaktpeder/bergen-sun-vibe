import type { Venue } from "@/lib/domain";
import type { FavoriteContribution } from "@/hooks/useFavoriteContributionsFeed";

export interface DigestLine {
  emoji: string;
  text: string;
}

export interface FollowedVenueDigest {
  venue: Venue;
  updatedAt: string;
  lines: DigestLine[];
  newPhotosCount: number;
  latestBeerKr: number | null;
  latestSunLabel: string | null;
  latestCrowdLabel: string | null;
  hasNewSince: boolean; // any line within last 24h
}

const DAY_MS = 24 * 60 * 60 * 1000;
const PHOTO_WINDOW_MS = 7 * DAY_MS;
const FRESH_MS = 60 * 60 * 1000;

const SUN_LABEL: Record<string, { emoji: string; text: string }> = {
  sun: { emoji: "☀️", text: "Sol nå" },
  partial: { emoji: "⛅", text: "Delvis sol" },
  going_down: { emoji: "🌇", text: "Sol på vei ned" },
  shade: { emoji: "🌥️", text: "Skygge" },
};

const CROWD_LABEL: Record<string, { emoji: string; text: string }> = {
  quiet: { emoji: "😌", text: "Rolig" },
  some: { emoji: "🙂", text: "Litt liv" },
  full: { emoji: "🔥", text: "Livlig" },
  queue: { emoji: "🔥", text: "Livlig / kø" },
};

export function buildFollowedVenueDigests(
  rows: FavoriteContribution[],
  venueByDbId: Record<string, Venue>,
): FollowedVenueDigest[] {
  const now = Date.now();
  const grouped: Record<string, FavoriteContribution[]> = {};
  for (const r of rows) {
    if (!r.venue_id || !venueByDbId[r.venue_id]) continue;
    (grouped[r.venue_id] ||= []).push(r);
  }

  const out: FollowedVenueDigest[] = [];

  for (const [venueId, items] of Object.entries(grouped)) {
    const venue = venueByDbId[venueId];
    // Sort desc just in case
    const desc = [...items].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    let latestBeerKr: number | null = null;
    let latestBeerAt: string | null = null;
    let latestSunLabel: string | null = null;
    let latestSunAt: string | null = null;
    let latestCrowdLabel: string | null = null;
    let latestCrowdAt: string | null = null;
    let newPhotosCount = 0;
    let latestPhotoAt: string | null = null;

    for (const r of desc) {
      const ts = new Date(r.created_at).getTime();
      const d = (r.data ?? {}) as Record<string, unknown>;

      if (r.type === "beer_price" && latestBeerKr == null) {
        const n = Number(d.price);
        if (Number.isFinite(n) && n > 0) {
          latestBeerKr = n;
          latestBeerAt = r.created_at;
        }
      } else if (r.type === "sun_report" && latestSunLabel == null) {
        if (now - ts <= FRESH_MS) {
          const meta = SUN_LABEL[String(d.status ?? "")];
          if (meta) {
            latestSunLabel = meta.text;
            latestSunAt = r.created_at;
          }
        }
      } else if (r.type === "crowd_report" && latestCrowdLabel == null) {
        if (now - ts <= FRESH_MS) {
          const meta = CROWD_LABEL[String(d.level ?? "")];
          if (meta) {
            latestCrowdLabel = meta.text;
            latestCrowdAt = r.created_at;
          }
        }
      } else if (r.type === "photo") {
        if (now - ts <= PHOTO_WINDOW_MS) {
          newPhotosCount += 1;
          if (!latestPhotoAt) latestPhotoAt = r.created_at;
        }
      }
    }

    const lines: DigestLine[] = [];
    if (latestSunLabel) {
      const meta = Object.values(SUN_LABEL).find((m) => m.text === latestSunLabel)!;
      lines.push({ emoji: meta.emoji, text: latestSunLabel });
    }
    if (latestCrowdLabel) {
      const meta = Object.values(CROWD_LABEL).find((m) => m.text === latestCrowdLabel)!;
      lines.push({ emoji: meta.emoji, text: latestCrowdLabel });
    }
    if (latestBeerKr != null) {
      lines.push({ emoji: "🍺", text: `Ølpris ${latestBeerKr} kr` });
    }
    if (newPhotosCount > 0) {
      lines.push({
        emoji: "📸",
        text: newPhotosCount === 1 ? "1 nytt bilde" : `${newPhotosCount} nye bilder`,
      });
    }

    if (lines.length === 0) continue;

    const times = [latestBeerAt, latestSunAt, latestCrowdAt, latestPhotoAt].filter(
      Boolean,
    ) as string[];
    const updatedAt = times.reduce((a, b) => (new Date(a) > new Date(b) ? a : b));

    out.push({
      venue,
      updatedAt,
      lines: lines.slice(0, 4),
      newPhotosCount,
      latestBeerKr,
      latestSunLabel,
      latestCrowdLabel,
      hasNewSince: now - new Date(updatedAt).getTime() <= DAY_MS,
    });
  }

  out.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  return out;
}
