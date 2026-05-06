import { useState } from "react";
import { ChevronDown, MapPin } from "lucide-react";
import { useCity, type City } from "@/context/CityContext";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const CITIES: City[] = ["Oslo", "Bergen"];

type Props = {
  className?: string;
  variant?: "light" | "dark";
};

export function CityBanner({ className, variant = "light" }: Props) {
  const { currentCity, setCurrentCity, chooseCityByLocation } = useCity();
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "tap-scale inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium shadow-soft",
            variant === "dark"
              ? "glass-dark text-white"
              : "bg-card text-foreground border",
            className,
          )}
        >
          <MapPin className="h-3.5 w-3.5" />
          <span>
            Du ser steder i <span className="font-semibold">{currentCity}</span>
          </span>
          <ChevronDown className="h-3.5 w-3.5 opacity-70" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {CITIES.map((c) => (
          <DropdownMenuItem
            key={c}
            onClick={() => setCurrentCity(c)}
            className={cn("cursor-pointer", c === currentCity && "font-semibold")}
          >
            {c === "Oslo" ? "🏙️" : "🏔️"} {c}
            {c === currentCity && <span className="ml-auto text-xs text-muted-foreground">Aktiv</span>}
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem
          onClick={() => {
            void chooseCityByLocation();
          }}
          className="cursor-pointer border-t"
        >
          📍 Bruk min posisjon
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
