import { useMemo } from "react";
import { MapPin, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VenueImage } from "@/components/VenueImage";
import type { Venue } from "@/lib/domain";
import { distanceMeters } from "@/lib/dedupe-venues";
import { formatDistance } from "@/lib/resolveVenueGuess";

interface Props {
  venues: Venue[];
  favorites: string[];
  userLoc: { lat: number; lng: number } | null;
  query: string;
  onQueryChange: (q: string) => void;
  onPick: (venue: Venue) => void;
  onAddVenue: () => void;
  onBack: () => void;
}

export function SearchVenueStep({
  venues,
  favorites,
  userLoc,
  query,
  onQueryChange,
  onPick,
  onAddVenue,
  onBack,
}: Props) {
  const favSet = useMemo(() => new Set(favorites), [favorites]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q) {
      return venues
        .filter((v) =>
          (v.name + " " + (v.area ?? "") + " " + v.tags.join(" ")).toLowerCase().includes(q),
        )
        .slice(0, 8)
        .map((v) => ({
          venue: v,
          distanceM: userLoc ? distanceMeters(userLoc.lat, userLoc.lng, v.lat, v.lng) : null,
        }));
    }
    if (userLoc) {
      return venues
        .map((v) => ({
          venue: v,
          distanceM: distanceMeters(userLoc.lat, userLoc.lng, v.lat, v.lng),
          fav: favSet.has(v.id),
        }))
        .sort((a, b) => {
          // favorites within 200m first, then by distance
          const aNear = a.fav && a.distanceM <= 200 ? 0 : 1;
          const bNear = b.fav && b.distanceM <= 200 ? 0 : 1;
          if (aNear !== bNear) return aNear - bNear;
          return a.distanceM - b.distanceM;
        })
        .slice(0, 8);
    }
    return venues
      .filter((v) => favSet.has(v.id))
      .slice(0, 8)
      .map((v) => ({ venue: v, distanceM: null as number | null }));
  }, [venues, query, userLoc, favSet]);

  return (
    <div className="pb-4">
      <div className="text-center">
        <h2 className="font-display text-lg font-semibold">Hvilket sted?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Søk eller velg et sted i nærheten
        </p>
      </div>

      <div className="relative mt-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Søk etter sted…"
          className="pl-9"
        />
      </div>

      {list.length === 0 ? (
        <div className="mt-5 rounded-2xl bg-secondary/60 p-5 text-center text-sm text-muted-foreground">
          Ingen treff. Legg til stedet under.
        </div>
      ) : (
        <ul className="mt-3 max-h-[50vh] space-y-2 overflow-y-auto">
          {list.map(({ venue, distanceM }) => (
            <li key={venue.id}>
              <button
                onClick={() => onPick(venue)}
                className="tap-scale flex w-full items-center gap-3 overflow-hidden rounded-2xl bg-card p-2.5 text-left shadow-soft"
              >
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-secondary">
                  <VenueImage venue={venue} size={{ w: 96, h: 96 }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{venue.name}</div>
                  <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {distanceM != null ? formatDistance(distanceM) : (venue.area || venue.city)}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={onAddVenue}
        className="tap-scale mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-card/50 p-4 text-sm font-medium"
      >
        <Plus className="h-4 w-4" />
        Fant du ikke stedet? Legg det til
      </button>

      <Button variant="ghost" className="mt-2 w-full" onClick={onBack}>
        Tilbake
      </Button>
    </div>
  );
}
