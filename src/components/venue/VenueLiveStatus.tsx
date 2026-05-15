import { timeAgo } from "@/lib/time";
import type { VenueContribution } from "@/hooks/useVenueContributions";

export type LiveContribMode = "sun" | "crowd" | "beer" | "photo" | "capture-photo";

type Props = {
  contributions: VenueContribution[];
  onContribute?: (mode: LiveContribMode) => void;
};

const SUN_LABELS: Record<string, { emoji: string; label: string }> = {
  sun: { emoji: "☀️", label: "Sol" },
  partial: { emoji: "⛅", label: "Delvis sol" },
  going_down: { emoji: "🌇", label: "Sol på vei ned" },
  shade: { emoji: "🌥️", label: "Skygge" },
};

const CROWD_LABELS: Record<string, { emoji: string; label: string }> = {
  quiet: { emoji: "😌", label: "Rolig" },
  some: { emoji: "🙂", label: "Litt liv" },
  full: { emoji: "🔥", label: "Livlig" },
  queue: { emoji: "🔥", label: "Livlig" },
};

export function VenueLiveStatus({ contributions, onContribute }: Props) {
  const sun = contributions.find((c) => c.type === "sun_report");
  const crowd = contributions.find((c) => c.type === "crowd_report");
  const beer = contributions
    .filter((c) => c.type === "beer_price")
    .map((c) => ({
      price: Number((c.data as Record<string, unknown>)?.price),
      at: c.created_at,
    }))
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
    <div className="grid grid-cols-2 gap-2">
      {sun && sunMeta ? (
        <LiveCardFilled
          emoji={sunMeta.emoji}
          label={sunMeta.label}
          meta={`Oppdatert ${timeAgo(sun.created_at)}`}
        />
      ) : (
        <LiveCardEmpty
          emoji="☀️"
          emptyLabel="Ingen rapport ennå"
          actionLabel="Rapporter sol →"
          onAction={() => onContribute?.("sun")}
        />
      )}

      {crowd && crowdMeta ? (
        <LiveCardFilled
          emoji={crowdMeta.emoji}
          label={crowdMeta.label}
          meta={`Oppdatert ${timeAgo(crowd.created_at)}`}
        />
      ) : (
        <LiveCardEmpty
          emoji="👥"
          emptyLabel="Ingen rapport ennå"
          actionLabel="Rapporter stemning →"
          onAction={() => onContribute?.("crowd")}
        />
      )}

      {cheapest ? (
        <LiveCardFilled
          emoji="🍺"
          label={`kr ${cheapest.price}`}
          meta={`Oppdatert ${timeAgo(cheapest.at)}`}
        />
      ) : (
        <LiveCardEmpty
          emoji="🍺"
          emptyLabel="Ingen pris ennå"
          actionLabel="Oppdater ølpris →"
          onAction={() => onContribute?.("beer")}
        />
      )}

      {photos.length > 0 ? (
        <LiveCardFilled
          emoji="📸"
          label={`${photos.length} bilde${photos.length > 1 ? "r" : ""}`}
          meta={`Sist ${timeAgo(photos[0].created_at)}`}
        />
      ) : (
        <LiveCardEmpty
          emoji="📸"
          emptyLabel="Ingen bilder ennå"
          actionLabel="Legg til bilde →"
          onAction={() => onContribute?.("photo")}
        />
      )}
    </div>
  );
}

function LiveCardFilled({
  emoji,
  label,
  meta,
}: {
  emoji: string;
  label: string;
  meta: string;
}) {
  return (
    <div className="rounded-2xl bg-card p-3 text-center shadow-soft">
      <div className="text-xl leading-none">{emoji}</div>
      <div className="mt-1 text-sm font-semibold leading-tight">{label}</div>
      <div className="mt-0.5 text-[10px] text-muted-foreground">{meta}</div>
    </div>
  );
}

function LiveCardEmpty({
  emoji,
  emptyLabel,
  actionLabel,
  onAction,
}: {
  emoji: string;
  emptyLabel: string;
  actionLabel: string;
  onAction?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border/70 bg-secondary/20 p-3 text-center">
      <div className="text-xl leading-none opacity-60">{emoji}</div>
      <div className="mt-1 text-xs text-muted-foreground">{emptyLabel}</div>
      {onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-1 text-[11px] font-medium text-primary underline-offset-2 hover:underline"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
