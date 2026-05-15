import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useFavorites } from "@/lib/favorites";
import { useVenues } from "@/hooks/useVenues";
import { useCity } from "@/context/CityContext";
import { belongsToCity } from "@/lib/domain";
import { useVenueBadges } from "@/hooks/useVenueBadges";
import { useVenuePhotos } from "@/hooks/useVenuePhotos";
import { useFavoriteContributionsFeed } from "@/hooks/useFavoriteContributionsFeed";
import { SavedVenueStripCard } from "@/components/SavedVenueStripCard";
import { FavoriteUpdateFeedItem } from "@/components/FavoriteUpdateFeedItem";

const Favorites = () => {
  const favs = useFavorites();
  const { currentCity } = useCity();
  const { data: allVenues = [], isLoading } = useVenues();

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

  return (
    <div className="px-5 pt-[max(env(safe-area-inset-top),1.5rem)] pb-10">
      <header className="pt-2">
        <div className="text-xs font-semibold uppercase tracking-widest text-primary">
          Dine steder
        </div>
        <h1 className="mt-1 font-display text-3xl font-semibold">Dine steder</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Live oppdateringer fra stedene du følger
        </p>
      </header>

      {isLoading && (
        <div className="mt-10 text-sm text-muted-foreground">Laster…</div>
      )}

      {!isLoading && !hasSaved && (
        <div className="mt-16 grid place-items-center text-center">
          <div className="grid h-20 w-20 place-items-center rounded-full bg-secondary">
            <Heart className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="mt-5 font-display text-xl font-semibold">Ingen steder ennå</h2>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            Lagre steder du liker for å følge stemningen live.
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
          <section className="mt-6">
            <h2 className="px-1 font-display text-lg font-semibold">Stedene dine</h2>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {savedVenues.map((v, i) => (
                <SavedVenueStripCard
                  key={v.id}
                  venue={v}
                  badge={badgeMap[v.dbId] ?? null}
                  userPhotoUrl={photoMap[v.dbId] ?? null}
                  index={i}
                />
              ))}
            </div>
          </section>

          <section className="mt-8">
            <h2 className="px-1 font-display text-lg font-semibold">Nye oppdateringer</h2>
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
        </>
      )}
    </div>
  );
};

export default Favorites;
