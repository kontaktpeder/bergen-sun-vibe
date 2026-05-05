import { useNavigate } from "react-router-dom";
import { Beer, Coffee, ImagePlus, MapPin, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Venue } from "@/lib/domain";

type Props = {
  venue: Pick<Venue, "name" | "category"> & { id?: string };
  className?: string;
  compact?: boolean;
  showCta?: boolean;
};

function pickIcon(category: string | undefined) {
  const c = (category ?? "").toLowerCase();
  if (c.includes("cafe") || c.includes("kaffe")) return Coffee;
  if (c.includes("rest")) return UtensilsCrossed;
  if (c.includes("bar") || c.includes("pub")) return Beer;
  return MapPin;
}

function angleFromName(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return Math.abs(h) % 360;
}

export function VenueFallback({ venue, className, compact, showCta = true }: Props) {
  const Icon = pickIcon(venue.category);
  const angle = angleFromName(venue.name || "Solguiden");
  const navigate = useNavigate();
  const initial = (venue.name || "·").trim().charAt(0).toUpperCase();

  const handleCta = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!venue.id) return;
    navigate(`/venue/${venue.id}?contribute=photo`);
  };

  return (
    <div
      className={cn("relative h-full w-full overflow-hidden", className)}
      style={{
        backgroundImage: `linear-gradient(${angle}deg, hsl(var(--sun) / 0.92), hsl(var(--primary) / 0.88) 55%, hsl(var(--accent) / 0.9))`,
      }}
      aria-label={`${venue.name} – mangler bilde`}
    >
      {/* soft glows */}
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-40 blur-2xl"
        style={{ background: "hsl(var(--sun))" }}
      />
      <div
        className="pointer-events-none absolute -left-8 bottom-0 h-24 w-24 rounded-full opacity-25 blur-2xl"
        style={{ background: "hsl(var(--primary))" }}
      />

      {/* large faded category icon as decorative backdrop */}
      <Icon
        className={cn(
          "pointer-events-none absolute -bottom-3 -right-3 text-white/20",
          compact ? "h-16 w-16" : "h-24 w-24",
        )}
        strokeWidth={1.5}
      />

      {/* venue initial — clean, no boxy tile */}
      <div className="absolute inset-0 grid place-items-center">
        <span
          className={cn(
            "font-display font-semibold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)]",
            compact ? "text-3xl" : "text-5xl",
          )}
        >
          {initial}
        </span>
      </div>

      {/* tiny "+ bilde" pill in corner — only when there's room */}
      {showCta && !compact && venue.id && (
        <button
          type="button"
          onClick={handleCta}
          aria-label="Bidra med bilde"
          className="absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/20 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-md transition-colors hover:bg-white/30"
        >
          <ImagePlus className="h-3 w-3" />
          Bilde
        </button>
      )}
    </div>
  );
}

