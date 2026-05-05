import { Beer, Coffee, MapPin, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Venue } from "@/lib/domain";

type Props = {
  venue: Pick<Venue, "name" | "category">;
  className?: string;
  compact?: boolean;
};

function pickIcon(category: string | undefined) {
  const c = (category ?? "").toLowerCase();
  if (c.includes("cafe") || c.includes("kaffe")) return Coffee;
  if (c.includes("rest")) return UtensilsCrossed;
  if (c.includes("bar") || c.includes("pub")) return Beer;
  return MapPin;
}

// Deterministic gradient angle from name so each venue feels unique but stable.
function angleFromName(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return Math.abs(h) % 360;
}

export function VenueFallback({ venue, className, compact }: Props) {
  const Icon = pickIcon(venue.category);
  const angle = angleFromName(venue.name || "Solguiden");

  return (
    <div
      className={cn(
        "relative flex h-full w-full items-end overflow-hidden",
        className,
      )}
      style={{
        backgroundImage: `linear-gradient(${angle}deg, hsl(var(--sun) / 0.9), hsl(var(--primary) / 0.85) 55%, hsl(var(--accent) / 0.85))`,
      }}
      aria-label={`${venue.name} – mangler bilde`}
    >
      {/* sun-disc graphic */}
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-40 blur-2xl"
        style={{ background: "hsl(var(--sun))" }}
      />
      <div
        className="pointer-events-none absolute -left-10 bottom-0 h-28 w-28 rounded-full opacity-30 blur-2xl"
        style={{ background: "hsl(var(--primary))" }}
      />

      {/* glass plate with name + icon */}
      <div
        className={cn(
          "relative z-10 m-3 flex w-full items-center gap-2 rounded-2xl border border-white/30 bg-white/15 backdrop-blur-md",
          compact ? "p-2" : "p-3",
        )}
      >
        <div
          className={cn(
            "grid shrink-0 place-items-center rounded-xl bg-white/25 text-white",
            compact ? "h-7 w-7" : "h-9 w-9",
          )}
        >
          <Icon className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        </div>
        <div className="min-w-0 flex-1">
          <div
            className={cn(
              "truncate font-display font-semibold leading-tight text-white drop-shadow-sm",
              compact ? "text-xs" : "text-sm",
            )}
          >
            {venue.name}
          </div>
          {!compact && (
            <div className="truncate text-[10px] uppercase tracking-widest text-white/85">
              Mangler bilde
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
