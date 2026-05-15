import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { isFavorite, toggleFavorite, useFavorites } from "@/lib/favorites";

interface Props {
  venueId: string;
  className?: string;
  size?: "sm" | "md";
}

export function VenueCardFavoriteButton({ venueId, className, size = "sm" }: Props) {
  useFavorites();
  const fav = isFavorite(venueId);
  const dim = size === "sm" ? "h-8 w-8" : "h-9 w-9";
  const ic = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(venueId);
      }}
      className={cn("grid place-items-center rounded-full glass shadow-soft tap-scale", dim, className)}
      aria-label={fav ? "Fjern fra Dine steder" : "Lagre"}
    >
      <Heart className={cn(ic, "transition-colors", fav ? "fill-primary text-primary" : "text-foreground")} />
    </button>
  );
}
