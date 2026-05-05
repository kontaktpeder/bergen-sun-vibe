import { timeAgo } from "@/lib/time";
import type { VenueContribution } from "@/hooks/useVenueContributions";

type Props = { contributions: VenueContribution[] };

export function VenueStatusBadges({ contributions }: Props) {
  const sun = contributions.find((c) => c.type === "sun_report");
  const beer = contributions
    .filter((c) => c.type === "beer_price")
    .map((c) => ({ price: Number((c.data as Record<string, unknown>)?.price), at: c.created_at }))
    .filter((b) => Number.isFinite(b.price) && b.price > 0);
  const photos = contributions.filter((c) => c.type === "photo");

  const cheapest = beer.length
    ? beer.reduce((acc, b) => (b.price < acc.price ? b : acc), beer[0])
    : null;

  const sunStatus = sun?.data as { status?: string } | undefined;
  const sunIsSun = sunStatus?.status === "sun";

  return (
    <div className="mt-5 grid grid-cols-3 gap-2">
      <Badge
        emoji={sunIsSun ? "☀️" : sun ? "🌥️" : "☀️"}
        label={sun ? (sunIsSun ? "Sol" : "Skygge") : "Ingen rapport"}
        sub={sun ? timeAgo(sun.created_at) : "vær først"}
        active={!!sun}
      />
      <Badge
        emoji="🍺"
        label={cheapest ? `kr ${cheapest.price}` : "Ingen pris"}
        sub={cheapest ? timeAgo(cheapest.at) : "del prisen"}
        active={!!cheapest}
      />
      <Badge
        emoji="📸"
        label={photos.length > 0 ? `${photos.length} bilde${photos.length > 1 ? "r" : ""}` : "Ingen bilder"}
        sub={photos[0] ? timeAgo(photos[0].created_at) : "del et bilde"}
        active={photos.length > 0}
      />
    </div>
  );
}

function Badge({ emoji, label, sub, active }: { emoji: string; label: string; sub: string; active: boolean }) {
  return (
    <div className={`rounded-2xl p-3 text-center ${active ? "bg-card shadow-soft" : "bg-secondary/40"}`}>
      <div className="text-xl leading-none">{emoji}</div>
      <div className={`mt-1 text-sm font-semibold leading-tight ${active ? "" : "text-muted-foreground"}`}>{label}</div>
      <div className="mt-0.5 text-[10px] text-muted-foreground">{sub}</div>
    </div>
  );
}
