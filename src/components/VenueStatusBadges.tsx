import { timeAgo } from "@/lib/time";
import type { VenueContribution } from "@/hooks/useVenueContributions";
import { cn } from "@/lib/utils";

type Props = {
  contributions: VenueContribution[];
  onSun?: () => void;
  onCrowd?: () => void;
  onBeer?: () => void;
  onPhoto?: () => void;
};

const SUN_LABELS: Record<string, { emoji: string; label: string }> = {
  sun: { emoji: "☀️", label: "Sol" },
  partial: { emoji: "⛅", label: "Delvis" },
  going_down: { emoji: "🌇", label: "På vei ned" },
  shade: { emoji: "🌥️", label: "Skygge" },
};

const CROWD_LABELS: Record<string, { emoji: string; label: string }> = {
  quiet: { emoji: "🌿", label: "Rolig" },
  some: { emoji: "👥", label: "Litt folk" },
  full: { emoji: "🔥", label: "Fullt" },
  queue: { emoji: "🚷", label: "Kø ute" },
};

export function VenueStatusBadges({ contributions, onSun, onCrowd, onBeer, onPhoto }: Props) {
  const sun = contributions.find((c) => c.type === "sun_report");
  const crowd = contributions.find((c) => c.type === "crowd_report");
  const beer = contributions
    .filter((c) => c.type === "beer_price")
    .map((c) => ({ price: Number((c.data as Record<string, unknown>)?.price), at: c.created_at }))
    .filter((b) => Number.isFinite(b.price) && b.price > 0);
  const photos = contributions.filter((c) => c.type === "photo");

  const cheapest = beer.length
    ? beer.reduce((acc, b) => (b.price < acc.price ? b : acc), beer[0])
    : null;

  const sunStatus = (sun?.data as { status?: string } | undefined)?.status ?? "";
  const sunMeta = SUN_LABELS[sunStatus];

  const crowdLevel = (crowd?.data as { level?: string } | undefined)?.level ?? "";
  const crowdMeta = CROWD_LABELS[crowdLevel];

  return (
    <div className="mt-5 grid grid-cols-2 gap-2">
      <BadgeButton
        emoji={sunMeta?.emoji ?? "☀️"}
        label={sunMeta?.label ?? "Ingen rapport"}
        sub={sun ? timeAgo(sun.created_at) : "Rapportér sol"}
        active={!!sun}
        onClick={onSun}
        ariaLabel="Rapportér sol-status"
      />
      <BadgeButton
        emoji={crowdMeta?.emoji ?? "👥"}
        label={crowdMeta?.label ?? "Ingen rapport"}
        sub={crowd ? timeAgo(crowd.created_at) : "Hvor fullt?"}
        active={!!crowd}
        onClick={onCrowd}
        ariaLabel="Rapportér stemning"
      />
      <BadgeButton
        emoji="🍺"
        label={cheapest ? `kr ${cheapest.price}` : "Ingen pris"}
        sub={cheapest ? "Oppdatert " + timeAgo(cheapest.at) : "Del prisen"}
        active={!!cheapest}
        onClick={onBeer}
        ariaLabel="Legg til ølpris"
      />
      <BadgeButton
        emoji="📸"
        label={photos.length > 0 ? `${photos.length} bilde${photos.length > 1 ? "r" : ""}` : "Ingen bilder"}
        sub={photos[0] ? timeAgo(photos[0].created_at) : "Del et bilde"}
        active={photos.length > 0}
        onClick={onPhoto}
        ariaLabel="Last opp bilde"
      />
    </div>
  );
}

function BadgeButton({
  emoji,
  label,
  sub,
  active,
  onClick,
  ariaLabel,
}: {
  emoji: string;
  label: string;
  sub: string;
  active: boolean;
  onClick?: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        "tap-scale rounded-2xl p-3 text-center transition-all",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        "hover:shadow-card active:scale-[0.97]",
        active ? "bg-card shadow-soft" : "bg-secondary/40 hover:bg-secondary/60",
      )}
    >
      <div className="text-xl leading-none">{emoji}</div>
      <div className={cn("mt-1 text-sm font-semibold leading-tight", !active && "text-muted-foreground")}>{label}</div>
      <div className="mt-0.5 text-[10px] text-muted-foreground">{sub}</div>
    </button>
  );
}
