import { MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Venue } from "@/lib/domain";
import { formatDistance, type VenueGuess, type VenueGuessResult } from "@/lib/resolveVenueGuess";
import { VenueImage } from "@/components/VenueImage";

interface Props {
  result: VenueGuessResult | null;
  loading?: boolean;
  title?: string;
  onConfirm: (venue: Venue) => void;
  onChangeVenue: () => void;
  onExplore: () => void;
}

export function ConfirmVenueStep({
  result,
  loading,
  title,
  onConfirm,
  onChangeVenue,
  onExplore,
}: Props) {
  if (loading || !result) {
    return (
      <div className="py-10 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
        <p className="mt-3 text-sm text-muted-foreground">Finner stedet ditt…</p>
      </div>
    );
  }

  const showSingle = result.confidence !== "low" && result.primary != null;
  const list: VenueGuess[] = showSingle ? [result.primary!] : result.candidates;

  if (!list.length) {
    return (
      <div className="pb-4 text-center">
        <h2 className="font-display text-lg font-semibold">Vi fant ikke et sted i nærheten</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Prøv å flytte deg nærmere, eller velg sted manuelt.
        </p>
        <div className="mt-5 grid gap-2">
          <Button className="w-full" onClick={onChangeVenue}>
            Velg sted
          </Button>
          <Button variant="secondary" className="w-full" onClick={onExplore}>
            Åpne kart
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-4">
      <div className="text-center">
        <h2 className="font-display text-lg font-semibold">
          {showSingle ? "Er du her?" : "Hvilket sted er du på?"}
        </h2>
        {showSingle && (
          <p className="mt-1 text-sm text-muted-foreground">
            Vi tror du er på {result.primary!.venue.name}
          </p>
        )}
      </div>

      <ul className="mt-5 space-y-2">
        {list.map(({ venue, distanceM }) => (
          <li key={venue.id}>
            <button
              onClick={() => onConfirm(venue)}
              className="tap-scale flex w-full items-center gap-3 overflow-hidden rounded-2xl bg-card p-3 text-left shadow-soft"
            >
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-secondary">
                <VenueImage venue={venue} size={{ w: 112, h: 112 }} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{venue.name}</div>
                <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {formatDistance(distanceM)}
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>

      {showSingle && (
        <Button
          className="mt-5 w-full"
          onClick={() => onConfirm(result.primary!.venue)}
        >
          Ja, det stemmer
        </Button>
      )}

      <Button variant="ghost" className="mt-2 w-full" onClick={onChangeVenue}>
        Bytt sted
      </Button>
    </div>
  );
}
