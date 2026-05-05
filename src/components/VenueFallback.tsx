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
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-40 blur-2xl"
        style={{ background: "hsl(var(--sun))" }}
      />
      <div
        className="pointer-events-none absolute -left-10 bottom-0 h-28 w-28 rounded-full opacity-25 blur-2xl"
        style={{ background: "hsl(var(--primary))" }}
      />

      {/* centered category icon */}
      <div className="absolute inset-0 grid place-items-center">
        <div
          className={cn(
            "grid place-items-center rounded-2xl border border-white/30 bg-white/15 text-white backdrop-blur-md",
            compact ? "h-10 w-10" : "h-14 w-14",
          )}
        >
          <Icon className={compact ? "h-5 w-5" : "h-7 w-7"} />
        </div>
      </div>

      {/* subtle "Bidra med bilde" CTA at bottom */}
      {showCta && !compact && venue.id && (
        <button
          type="button"
          onClick={handleCta}
          className="absolute inset-x-2 bottom-2 z-10 inline-flex items-center justify-center gap-1.5 rounded-full border border-white/30 bg-white/20 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur-md transition-colors hover:bg-white/30"
        >
          <ImagePlus className="h-3.5 w-3.5" />
          Bidra med bilde
        </button>
      )}
    </div>
  );
}
