import { Link } from "react-router-dom";
import { Heart, Star, Beer, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Venue } from "@/lib/domain";
import { SunBadge } from "./SunBadge";
import { DataSunBadge } from "./DataSunBadge";
import { VenueImage } from "./VenueImage";
import { useLatestVenuePhoto } from "@/hooks/useLatestVenuePhoto";
import { isFavorite, toggleFavorite, useFavorites } from "@/lib/favorites";
import type { VenueBadgeState } from "@/hooks/useVenueBadges";

interface Props {
  venue: Venue;
  variant?: "feature" | "default" | "compact";
  index?: number;
  badge?: VenueBadgeState | null;
  /** Preferred: pass user photo url from a batched lookup. If undefined, falls back to per-card query. */
  userPhotoUrl?: string | null;
  /** Eager-load image (set true for first 2-3 cards in a list). */
  eager?: boolean;
}

// Standardized thumbnail size for all card variants → one cache entry per venue
const CARD_SIZE = { w: 600, h: 600 };
const FEATURE_SIZE = { w: 800, h: 1000 };

export function VenueCard({ venue, variant = "default", index = 0, badge, userPhotoUrl: userPhotoProp, eager }: Props) {
  useFavorites();
  // Only run per-card query if no batched photo was passed (legacy callers / Favorites page)
  const { data: fetchedPhoto } = useLatestVenuePhoto(userPhotoProp === undefined ? venue.dbId : undefined);
  const userPhotoUrl = userPhotoProp !== undefined ? userPhotoProp : fetchedPhoto;
  const fav = isFavorite(venue.id);
  

  const loading = eager ? "eager" : "lazy";
  const fetchPriority = eager ? "high" : "auto";

  const renderSunBadge = (className?: string, size: "sm" | "md" = "sm") =>
    badge !== undefined
      ? badge && badge.sun
        ? <DataSunBadge badge={badge} className={className} size={size} />
        : null
      : <SunBadge status={venue.sunStatus} until={venue.sunUntil} className={className} size={size} />;

  const beerPrice = badge?.beerPrice ?? null;
  const photoCount = badge?.photoCount ?? 0;

  if (variant === "feature") {
    return (
      <Link to={`/venue/${venue.id}`} className="group block tap-scale animate-stagger" style={{ animationDelay: `${index * 60}ms` }}>
        <div className="relative aspect-[4/5] overflow-hidden rounded-3xl shadow-card">
          <VenueImage
            venue={venue}
            userPhotoUrl={userPhotoUrl}
            size={FEATURE_SIZE}
            loading="eager"
            fetchPriority="high"
            imgClassName="absolute inset-0 transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-night/90 via-night/20 to-transparent" />

          <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-2">
            {renderSunBadge()}
            <button
              onClick={(e) => { e.preventDefault(); toggleFavorite(venue.id); }}
              className="grid h-9 w-9 place-items-center rounded-full glass shadow-soft tap-scale"
              aria-label="Lagre"
            >
              <Heart className={cn("h-4 w-4 transition-colors", fav ? "fill-primary text-primary" : "text-foreground")} />
            </button>
          </div>

          <div className="absolute inset-x-0 bottom-0 p-5 text-white">
            <div className="mb-1 flex items-center gap-2 text-xs/none opacity-90">
              <span className="font-medium">{venue.category}</span>
              <span className="opacity-60">•</span>
              <span>{venue.area}</span>
            </div>
            <h3 className="font-display text-2xl font-semibold leading-tight">{venue.name}</h3>
            <div className="mt-2 flex items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-sun text-sun" />{venue.rating}</span>
              
              {venue.dealText && <span className="rounded-full bg-primary/90 px-2 py-0.5 text-xs font-medium">{venue.dealText}</span>}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === "compact") {
    return (
      <Link to={`/venue/${venue.id}`} className="group block w-[180px] shrink-0 tap-scale animate-stagger" style={{ animationDelay: `${index * 50}ms` }}>
        <div className="relative aspect-square overflow-hidden rounded-2xl shadow-soft">
          <VenueImage
            venue={venue}
            userPhotoUrl={userPhotoUrl}
            size={CARD_SIZE}
            loading={loading}
            fetchPriority={fetchPriority}
            imgClassName="transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-night/70 to-transparent" />
          {renderSunBadge("absolute top-2 left-2")}
        </div>
        <div className="mt-2.5 px-1">
          <h4 className="truncate font-display text-base font-semibold">{venue.name}</h4>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Star className="h-3 w-3 fill-sun text-sun" />{venue.rating}</span>
            
          </div>
        </div>
      </Link>
    );
  }

  // default — wide card
  return (
    <Link to={`/venue/${venue.id}`} className="group block w-[280px] shrink-0 tap-scale animate-stagger" style={{ animationDelay: `${index * 50}ms` }}>
      <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-card">
        <VenueImage
          venue={venue}
          userPhotoUrl={userPhotoUrl}
          size={CARD_SIZE}
          loading={loading}
          fetchPriority={fetchPriority}
          imgClassName="transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-night/60 via-transparent to-transparent" />
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
          {renderSunBadge()}
          <button
            onClick={(e) => { e.preventDefault(); toggleFavorite(venue.id); }}
            className="grid h-8 w-8 place-items-center rounded-full glass shadow-soft tap-scale"
            aria-label="Lagre"
          >
            <Heart className={cn("h-3.5 w-3.5", fav ? "fill-primary text-primary" : "text-foreground")} />
          </button>
        </div>
        {venue.dealText && (
          <div className="absolute bottom-3 left-3 rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground shadow-soft">
            {venue.dealText}
          </div>
        )}
      </div>
      <div className="mt-3 px-1">
        <div className="flex items-baseline justify-between gap-2">
          <h4 className="truncate font-display text-lg font-semibold">{venue.name}</h4>
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Star className="h-3 w-3 fill-sun text-sun" />{venue.rating}</span>
          <span>·</span><span>{venue.category}</span><span>·</span><span>{venue.area}</span>
          {beerPrice != null && (
            <><span>·</span><span className="inline-flex items-center gap-1"><Beer className="h-3 w-3" />{beerPrice} kr</span></>
          )}
          {photoCount > 0 && (
            <><span>·</span><span className="inline-flex items-center gap-1"><Camera className="h-3 w-3" />{photoCount}</span></>
          )}
        </div>
      </div>
    </Link>
  );
}
