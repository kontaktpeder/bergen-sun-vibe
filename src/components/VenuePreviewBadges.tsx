import { cn } from "@/lib/utils";
import type { PreviewBadge, PreviewBadgeTone } from "@/lib/venuePreviewBadges";

const toneClass: Record<PreviewBadgeTone, string> = {
  sun: "bg-gradient-to-r from-sun to-primary text-white",
  crowd: "bg-white/90 text-night",
  beer: "bg-white/90 text-night",
  cta: "bg-secondary/95 text-foreground border border-primary/20",
};

interface Props {
  badges: PreviewBadge[];
  className?: string;
  size?: "sm" | "md";
}

export function VenuePreviewBadges({ badges, className, size = "sm" }: Props) {
  if (!badges.length) return null;
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {badges.map((b) => (
        <span
          key={b.key}
          className={cn(
            "inline-flex items-center gap-1 rounded-full font-semibold shadow-soft backdrop-blur-md whitespace-nowrap",
            size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
            toneClass[b.tone],
          )}
        >
          <span aria-hidden>{b.icon}</span>
          <span>{b.label}</span>
        </span>
      ))}
    </div>
  );
}
