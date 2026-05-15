import type { VenueBadgeState } from "@/hooks/useVenueBadges";

export type PreviewBadgeTone = "sun" | "crowd" | "beer" | "cta";

export interface PreviewBadge {
  key: string;
  tone: PreviewBadgeTone;
  icon: string;
  label: string;
}

const CROWD_LABEL: Record<string, { icon: string; label: string }> = {
  quiet: { icon: "😌", label: "Rolig" },
  some: { icon: "🙂", label: "Litt liv" },
  full: { icon: "🔥", label: "Livlig" },
  queue: { icon: "🔥", label: "Livlig" },
};

/**
 * Preview-badge policy (felles for alle miniatyrkort):
 *  - "sunny" → ☀️ Sol nå
 *  - "partial" → ⛅ Delvis sol
 *  - "shade"/utløpt → vises IKKE (ingen falsk skygge på kort)
 *  - crowd vises hvis tilgjengelig
 *  - beerPrice vises hvis tilgjengelig
 *  - hvis ingenting → "✨ Trenger ditt bidrag"
 *
 * Ekte skygge-status vises kun på stedssiden, ikke på preview-kort.
 */
export function getVenuePreviewBadges(badge: VenueBadgeState | null | undefined): PreviewBadge[] {
  const out: PreviewBadge[] = [];

  if (badge?.sun === "sunny") {
    out.push({ key: "sun", tone: "sun", icon: "☀️", label: "Sol nå" });
  } else if (badge?.sun === "partial") {
    out.push({ key: "sun", tone: "sun", icon: "⛅", label: "Delvis sol" });
  }

  if (badge?.crowd && CROWD_LABEL[badge.crowd]) {
    const c = CROWD_LABEL[badge.crowd];
    out.push({ key: "crowd", tone: "crowd", icon: c.icon, label: c.label });
  }

  if (badge?.beerPrice != null) {
    out.push({ key: "beer", tone: "beer", icon: "🍺", label: `${badge.beerPrice} kr` });
  }

  if (out.length === 0) {
    out.push({ key: "cta", tone: "cta", icon: "✨", label: "Trenger ditt bidrag" });
  }

  return out;
}
