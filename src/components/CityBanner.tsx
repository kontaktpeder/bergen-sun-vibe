import { useState } from "react";
import { ChevronDown, MapPin } from "lucide-react";
import { useCity, type City } from "@/context/CityContext";
import { cn } from "@/lib/utils";

const CITIES: City[] = ["Oslo", "Bergen"];

type Props = {
  className?: string;
  variant?: "light" | "dark";
};

export function CityBanner({ className, variant = "light" }: Props) {
  const { currentCity, setCurrentCity, chooseCityByLocation } = useCity();
  const [open, setOpen] = useState(false);

  const chooseCity = (city: City) => {
    setCurrentCity(city);
    setOpen(false);
  };

  const chooseLocation = () => {
    setOpen(false);
    void chooseCityByLocation();
  };

  return (
    <div className={cn("relative inline-block", className)}>
        <button
          type="button"
          aria-expanded={open}
          aria-haspopup="menu"
          onClick={() => setOpen((value) => !value)}
          className={cn(
            "tap-scale inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium shadow-soft",
            variant === "dark"
              ? "glass-dark text-white"
              : "bg-card text-foreground border",
          )}
        >
          <MapPin className="h-3.5 w-3.5" />
          <span>
            Du ser steder i <span className="font-semibold">{currentCity}</span>
          </span>
          <ChevronDown className="h-3.5 w-3.5 opacity-70" />
        </button>

      {open && <button type="button" aria-label="Lukk byvalg" className="fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)} />}

      {open && (
        <div role="menu" className="absolute left-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
        {CITIES.map((c) => (
          <button
            key={c}
            type="button"
            role="menuitem"
            onClick={() => chooseCity(c)}
            className={cn("flex w-full items-center rounded-sm px-2 py-2 text-left text-sm outline-none transition-colors hover:bg-accent", c === currentCity && "font-semibold")}
          >
            {c === "Oslo" ? "🏙️" : "🏔️"} {c}
            {c === currentCity && <span className="ml-auto text-xs text-muted-foreground">Aktiv</span>}
          </button>
        ))}
        <button
          type="button"
          role="menuitem"
          onClick={chooseLocation}
          className="flex w-full items-center rounded-sm border-t px-2 py-2 text-left text-sm outline-none transition-colors hover:bg-accent"
        >
          📍 Bruk min posisjon
        </button>
        </div>
      )}
    </div>
  );
}
