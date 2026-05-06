import { Sun, CloudSun, HelpCircle, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VenueBadgeState } from "@/hooks/useVenueBadges";

interface Props {
  badge: VenueBadgeState | null | undefined;
  className?: string;
  size?: "sm" | "md";
}

const map = {
  sunny: { label: "Sol nå", Icon: Sun, bg: "bg-gradient-to-r from-sun to-primary text-white", pulse: true },
  partial: { label: "Delvis sol", Icon: CloudSun, bg: "bg-gradient-to-r from-sun/80 to-sunset-pink text-white", pulse: false },
  shade: { label: "Skygge", Icon: Moon, bg: "bg-night/90 text-white", pulse: false },
  unknown: { label: "Trenger rapport", Icon: HelpCircle, bg: "bg-secondary text-foreground", pulse: false },
} as const;

export function DataSunBadge({ badge, className, size = "sm" }: Props) {
  if (!badge?.sun) return null;
  const c = map[badge.sun];
  const Icon = c.Icon;
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium shadow-soft backdrop-blur-md",
        size === "sm" ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-sm",
        c.bg,
        className,
      )}
    >
      <Icon className={cn(size === "sm" ? "h-3 w-3" : "h-4 w-4", c.pulse && "animate-sun-pulse")} strokeWidth={2.5} />
      <span className="whitespace-nowrap">{c.label}</span>
    </div>
  );
}
