import { Sun, CloudSun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SunStatus } from "@/data/venues";

interface Props {
  status: SunStatus;
  until?: string;
  className?: string;
  size?: "sm" | "md";
}

export function SunBadge({ status, until, className, size = "sm" }: Props) {
  const config = {
    "sun-now": {
      label: until ? `Sol til ${until}` : "Sol nå",
      icon: Sun,
      bg: "bg-gradient-to-r from-sun to-primary text-white",
      pulse: true,
    },
    "sun-until": {
      label: `Sol til ${until ?? ""}`,
      icon: Sun,
      bg: "bg-gradient-to-r from-sun to-primary text-white",
      pulse: true,
    },
    "evening-sun": {
      label: until ? `Kveldssol til ${until}` : "Kveldssol",
      icon: CloudSun,
      bg: "bg-gradient-to-r from-sunset-pink to-sunset-purple text-white",
      pulse: false,
    },
    "shade-soon": {
      label: until ? `Skygge fra ${until}` : "Skygge snart",
      icon: CloudSun,
      bg: "bg-secondary text-foreground",
      pulse: false,
    },
    shade: {
      label: "Skygge",
      icon: Moon,
      bg: "bg-night/90 text-white",
      pulse: false,
    },
  }[status];

  const Icon = config.icon;
  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 rounded-full font-medium shadow-soft backdrop-blur-md",
      size === "sm" ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-sm",
      config.bg,
      className,
    )}>
      <Icon className={cn(size === "sm" ? "h-3 w-3" : "h-4 w-4", config.pulse && "animate-sun-pulse")} strokeWidth={2.5} />
      <span className="whitespace-nowrap">{config.label}</span>
    </div>
  );
}
