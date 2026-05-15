import { useEffect, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useVenues } from "@/hooks/useVenues";
import { useVenueBadges } from "@/hooks/useVenueBadges";
import { useVenuePhotos } from "@/hooks/useVenuePhotos";
import { VenueCard } from "@/components/VenueCard";
import { SeoHead } from "@/components/seo/SeoHead";
import {
  CITY_SLUGS,
  type CitySlug,
  FACET_DEFS,
  buildCanonical,
  buildDescription,
  buildItemListSchema,
  buildTitle,
  shouldNoIndex,
} from "@/lib/seo";
import { belongsToCity } from "@/lib/domain";
import { useCity } from "@/context/CityContext";
import { useUserLocation } from "@/hooks/useUserLocation";

export default function CityPage() {
  const { citySlug } = useParams<{ citySlug: string }>();
  const navigate = useNavigate();
  const { setCurrentCity } = useCity();

  const cityName = citySlug && (CITY_SLUGS as Record<string, string>)[citySlug];

  useEffect(() => {
    if (cityName) setCurrentCity(cityName as "Bergen" | "Oslo");
  }, [cityName, setCurrentCity]);

  const { data: allVenues = [], isLoading } = useVenues();

  const venues = useMemo(() => {
    if (!cityName) return [];
    return allVenues.filter((v) => belongsToCity(v, cityName as "Bergen" | "Oslo"));
  }, [allVenues, cityName]);

  const ids = useMemo(() => venues.map((v) => v.dbId), [venues]);
  const { data: badgeMap = {} } = useVenueBadges(ids);
  const { data: photoMap = {} } = useVenuePhotos(ids);

  if (!cityName) {
    // Ukjent by-slug — la NotFound håndtere via redirect
    navigate("/", { replace: true });
    return null;
  }

  const canonical = buildCanonical(`/${citySlug}`);
  const noindex = shouldNoIndex({ pageType: "city", resultCount: venues.length });

  return (
    <>
      <SeoHead
        title={buildTitle("city", { city: cityName })}
        description={buildDescription("city", { city: cityName })}
        canonical={canonical}
        robots={noindex ? "noindex,follow" : "index,follow"}
        jsonLd={buildItemListSchema(venues, canonical)}
      />

      <div className="mx-auto max-w-3xl px-5 pb-16 pt-[max(env(safe-area-inset-top),1rem)]">
        <header className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">{cityName}</p>
          <h1 className="mt-2 font-display text-3xl font-semibold leading-tight">
            Finn de beste stedene å være ute i {cityName} akkurat nå
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {buildDescription("city", { city: cityName })}
          </p>
        </header>

        <nav className="mt-6 flex flex-wrap gap-2">
          {FACET_DEFS.map((f) => (
            <Link
              key={f.slug}
              to={`/${citySlug}/${f.slug}`}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium tap-scale"
            >
              {f.label}
            </Link>
          ))}
        </nav>

        {isLoading && <p className="mt-8 text-sm text-muted-foreground">Laster steder…</p>}

        {FACET_DEFS.map((f) => {
          const items = venues.filter(f.match).slice(0, 8);
          if (!items.length) return null;
          return (
            <section key={f.slug} className="mt-10">
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="font-display text-xl font-semibold">{f.label}</h2>
                <Link to={`/${citySlug}/${f.slug}`} className="text-xs font-medium text-primary">
                  Se alle
                </Link>
              </div>
              <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-2 scrollbar-hide">
                {items.map((v, i) => (
                  <VenueCard
                    key={v.id}
                    venue={v}
                    variant="compact"
                    index={i}
                    badge={badgeMap[v.dbId] ?? null}
                    userPhotoUrl={photoMap[v.dbId] ?? null}
                  />
                ))}
              </div>
            </section>
          );
        })}

        {!isLoading && venues.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-3 font-display text-xl font-semibold">Alle steder i {cityName}</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {venues.map((v, i) => (
                <VenueCard
                  key={v.id}
                  venue={v}
                  variant="compact"
                  index={i}
                  badge={badgeMap[v.dbId] ?? null}
                  userPhotoUrl={photoMap[v.dbId] ?? null}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
