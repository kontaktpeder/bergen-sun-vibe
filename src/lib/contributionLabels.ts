import type { VenueContribution } from "@/hooks/useVenueContributions";

export interface ContributionFeedLabel {
  emoji: string;
  label: string;
}

export function getContributionFeedLabel(
  c: Pick<VenueContribution, "type" | "data">,
): ContributionFeedLabel {
  const d = (c.data ?? {}) as Record<string, unknown>;

  switch (c.type) {
    case "photo":
      return { emoji: "📸", label: "Nytt bilde" };
    case "sun_report": {
      const s = String(d.status ?? "");
      const map: Record<string, ContributionFeedLabel> = {
        sun: { emoji: "☀️", label: "Sol nå" },
        partial: { emoji: "⛅", label: "Delvis sol" },
        going_down: { emoji: "🌇", label: "Sol på vei ned" },
        shade: { emoji: "🌥️", label: "Skygge" },
      };
      return map[s] ?? { emoji: "☀️", label: "Solrapport" };
    }
    case "beer_price": {
      const n = Number(d.price);
      return Number.isFinite(n) && n > 0
        ? { emoji: "🍺", label: `Ny ølpris · ${n} kr` }
        : { emoji: "🍺", label: "Ny ølpris" };
    }
    case "crowd_report": {
      const lvl = String(d.level ?? "");
      const map: Record<string, ContributionFeedLabel> = {
        quiet: { emoji: "😌", label: "Rolig stemning" },
        some: { emoji: "🙂", label: "Litt liv" },
        full: { emoji: "🔥", label: "Fullt / livlig" },
        queue: { emoji: "🔥", label: "Fullt / livlig" },
      };
      return map[lvl] ?? { emoji: "🙂", label: "Folkestatus" };
    }
    default:
      return { emoji: "✨", label: "Ny oppdatering" };
  }
}
