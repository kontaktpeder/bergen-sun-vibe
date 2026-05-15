import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useFavorites } from "@/lib/favorites";
import { useAuthProfile } from "@/hooks/useAuthProfile";
import { useVenues } from "@/hooks/useVenues";
import { useCity } from "@/context/CityContext";
import { belongsToCity } from "@/lib/domain";
import { useVenueBadges } from "@/hooks/useVenueBadges";
import { useVenuePhotos } from "@/hooks/useVenuePhotos";
import { useFavoriteContributionsFeed } from "@/hooks/useFavoriteContributionsFeed";
import { useUserLocation } from "@/hooks/useUserLocation";
import { distanceMeters } from "@/lib/geo";
import { SavedVenueStripCard } from "@/components/SavedVenueStripCard";
import { FavoriteUpdateFeedItem } from "@/components/FavoriteUpdateFeedItem";
import { SeoHead } from "@/components/seo/SeoHead";
import { buildCanonical } from "@/lib/seo";
import { citySlugFor } from "@/lib/city-copy";

const NEAR_RADIUS_M = 1000;
const NEW_UPDATE_WINDOW_MS = 24 * 60 * 60 * 1000;

const Favorites = () => {
  const { favorites: favs, isLoading: favsLoading } = useFavorites();
  const { isAuthed, loading: authLoading } = useAuthProfile();
  const { currentCity } = useCity();
  const { data: allVenues = [], isLoading: venuesLoading } = useVenues();
  const { location, locate } = useUserLocation();
  const isLoading = venuesLoading || authLoading || (isAuthed && favsLoading);

  const savedVenues = useMemo(
    () =>
      allVenues.filter(
        (v) => favs.includes(v.id) && belongsToCity(v, currentCity as "Bergen" | "Oslo"),
      ),
    [allVenues, favs, currentCity],
  );

  const venueIds = useMemo(() => savedVenues.map((v) => v.dbId), [savedVenues]);
  const venueByDbId = useMemo(
    () => Object.fromEntries(savedVenues.map((v) => [v.dbId, v])),
    [savedVenues],
  );

  const { data: badgeMap = {} } = useVenueBadges(venueIds);
  const { data: photoMap = {} } = useVenuePhotos(venueIds);
  const { data: feed = [], isLoading: feedLoading } = useFavoriteContributionsFeed(venueIds);

  const hasSaved = savedVenues.length > 0;

  useEffect(() => {
    if (isAuthed && hasSaved && !location) locate();
  }, [isAuthed, hasSaved, location, locate]);

  // Distinct venue_ids in feed within the last 24h → "ny oppdatering"
  const venuesWithNewUpdate = useMemo(() => {
    const cutoff = Date.now() - NEW_UPDATE_WINDOW_MS;
    const set = new Set<string>();
    for (const c of feed) {
      if (new Date(c.created_at).getTime() >= cutoff) set.add(c.venue_id);
    }
    return set;
  }, [feed]);

  const nearCount = useMemo(() => {
    if (!location) return null;
    return savedVenues.filter(
      (v) => distanceMeters(location.lat, location.lng, v.lat, v.lng) <= NEAR_RADIUS_M,
    ).length;
  }, [savedVenues, location]);

  return (
    <div className="px-5 pt-[max(env(safe-area-inset-top),1.5rem)] pb-10">
      <SeoHead
        title={`Steder du følger i ${currentCity} | Utefolket`}
        description={`Følg sol, stemning og ølpriser på stedene du følger i ${currentCity}.`}
        canonical={buildCanonical(`/${citySlugFor(currentCity)}`)}
      />
      <header className="pt-2">
        <div className="text-xs font-semibold uppercase tracking-widest text-primary">
          Dine steder
        </div>
        <h1 className="mt-1 font-display text-3xl font-semibold">Dine steder</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Stedene du følger og vil holde øye med.
        </p>

        {isAuthed && hasSaved && (
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <span className="font-medium">
              <span className="text-foreground">{savedVenues.length}</span>
              <span className="text-muted-foreground"> du følger</span>
            </span>
            <span className="font-medium">
              <span className="text-foreground">{venuesWithNewUpdate.size}</span>
              <span className="text-muted-foreground"> med nye oppdateringer</span>
            </span>
            {nearCount != null ? (
              <span className="font-medium">
                <span className="text-foreground">{nearCount}</span>
                <span className="text-muted-foreground"> nær deg nå</span>
              </span>
            ) : (
              <button
                onClick={locate}
                className="text-muted-foreground underline underline-offset-2 hover:text-foreground"
              >
                Aktiver posisjon for «nær deg»
              </button>
            )}
          </div>
        )}
      </header>

      {isLoading && (
        <div className="mt-10 text-sm text-muted-foreground">Laster…</div>
      )}

      {!isLoading && !isAuthed && (
        <div className="mt-10 overflow-hidden rounded-3xl bg-gradient-to-br from-night via-sunset-purple to-primary p-7 text-white shadow-card">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-sun shadow-glow">
            <Heart className="h-6 w-6 text-night" strokeWidth={2.5} />
          </div>
          <h2 className="mt-5 font-display text-2xl font-semibold">Bli medlem av Utefolket</h2>
          <p className="mt-2 text-sm opacity-85">
            Følg favorittstedene dine og få nye bilder, ølpriser og solrapporter samlet ett sted.
          </p>
          <Link
            to="/auth"
            className="tap-scale mt-6 inline-flex w-full items-center justify-center rounded-full bg-sun py-3.5 font-semibold text-night"
          >
            Opprett konto eller logg inn
          </Link>
        </div>
      )}

      {!isLoading && isAuthed && !hasSaved && (
        <div className="mt-16 grid place-items-center text-center">
          <div className="grid h-20 w-20 place-items-center rounded-full bg-secondary">
            <Heart className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="mt-5 font-display text-xl font-semibold">Ingen steder ennå</h2>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            Følg steder du liker for å få nye bilder, priser og solrapporter samlet her.
          </p>
          <Link
            to="/explore"
            className="tap-scale mt-6 rounded-full bg-night px-6 py-3 text-sm font-medium text-white shadow-card"
          >
            Utforsk steder
          </Link>
        </div>
      )}

      {hasSaved && (
        <>
          <section className="mt-8">
            <h2 className="px-1 font-display text-lg font-semibold">Nytt fra dine steder</h2>
            <p className="mt-0.5 px-1 text-xs text-muted-foreground">
              Siste aktivitet på stedene du følger
            </p>

            {feedLoading && (
              <div className="mt-4 text-sm text-muted-foreground">Henter oppdateringer…</div>
            )}

            {!feedLoading && feed.length === 0 && (
              <div className="mt-4 rounded-2xl bg-card p-5 text-center shadow-soft">
                <p className="text-sm text-muted-foreground">
                  Ingen nye oppdateringer ennå. Kom tilbake om litt — eller bidra selv.
                </p>
              </div>
            )}

            <div className="mt-3 grid gap-2">
              {feed.map((c) => {
                const venue = venueByDbId[c.venue_id];
                if (!venue) return null;
                return (
                  <FavoriteUpdateFeedItem
                    key={c.id}
                    contribution={c}
                    venue={venue}
                    userPhotoUrl={photoMap[venue.dbId] ?? null}
                  />
                );
              })}
            </div>
          </section>

          <section className="mt-8">
            <h2 className="px-1 font-display text-lg font-semibold">Alle steder du følger</h2>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {savedVenues.map((v, i) => (
                <SavedVenueStripCard
                  key={v.id}
                  venue={v}
                  badge={badgeMap[v.dbId] ?? null}
                  userPhotoUrl={photoMap[v.dbId] ?? null}
                  index={i}
                  hasNewUpdate={venuesWithNewUpdate.has(v.dbId)}
                />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default Favorites;
