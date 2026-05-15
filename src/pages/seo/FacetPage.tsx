import { useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useVenues } from "@/hooks/useVenues";
import { useVenueBadges } from "@/hooks/useVenueBadges";
import { useVenuePhotos } from "@/hooks/useVenuePhotos";
import { VenueCard } from "@/components/VenueCard";
import { SeoHead } from "@/components/seo/SeoHead";
import {
  CITY_SLUGS,
  buildCanonical,
  buildDescription,
  buildItemListSchema,
  buildTitle,
  resolveFacet,
  shouldNoIndex,
  venuesInArea,
} from "@/lib/seo";
import { belongsToCity } from "@/lib/domain";
import { useCity } from "@/context/CityContext";
import { useUserLocation } from "@/hooks/useUserLocation";

export default function FacetPage() {
  const { citySlug, facetSlug } = useParams<{ citySlug: string; facetSlug: string }>();
  const { setCurrentCity } = useCity();
  const cityName = citySlug && (CITY_SLUGS as Record<string, string>)[citySlug];

  useEffect(() => {
    if (cityName) setCurrentCity(cityName as "Bergen" | "Oslo");
  }, [cityName, setCurrentCity]);

  const { data: allVenues = [], isLoading } = useVenues();

  const cityVenues = useMemo(() => {
    if (!cityName) return [];
    return allVenues.filter((v) => belongsToCity(v, cityName as "Bergen" | "Oslo"));
  }, [allVenues, cityName]);

  const facet = facetSlug ? resolveFacet(facetSlug) : null;

  const items = useMemo(() => {
    if (!facetSlug) return [];
    if (facet) return cityVenues.filter(facet.match);
    return venuesInArea(cityVenues, facetSlug);
  }, [facet, facetSlug, cityVenues]);

  const ids = useMemo(() => items.map((v) => v.dbId), [items]);
  const { data: badgeMap = {} } = useVenueBadges(ids);
  const { data: photoMap = {} } = useVenuePhotos(ids);

  if (!cityName || !facetSlug) {
    return (
      <SeoHead
        title="Side ikke funnet | Utefolket"
        description="Vi fant ikke denne siden."
        canonical={buildCanonical(`/${citySlug ?? ""}/${facetSlug ?? ""}`)}
        robots="noindex,follow"
      />
    );
  }

  const facetLabel = facet?.label ?? facetSlug.replace(/-/g, " ");
  const intro = facet ? facet.intro(cityName) : "";
  const canonical = buildCanonical(`/${citySlug}/${facetSlug}`);
  const noindex = shouldNoIndex({
    pageType: "facet",
    resultCount: items.length,
    hasIntro: !!intro,
  });

  return (
    <>
      <SeoHead
        title={buildTitle("facet", { facet: facetLabel, city: cityName })}
        description={
          intro
            ? intro.slice(0, 155)
            : buildDescription("facet", { facet: facetLabel, city: cityName })
        }
        canonical={canonical}
        robots={noindex ? "noindex,follow" : "index,follow"}
        jsonLd={items.length ? buildItemListSchema(items, canonical) : undefined}
      />

      <div className="mx-auto max-w-3xl px-5 pb-16 pt-[max(env(safe-area-inset-top),1rem)]">
        <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-primary">
          <Link to={`/${citySlug}`} className="hover:underline">{cityName}</Link>
          <span className="mx-1.5 opacity-50">/</span>
          <span>{facetLabel}</span>
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold leading-tight">
          {facetLabel} i {cityName}
        </h1>
        {intro && <p className="mt-3 text-sm text-muted-foreground">{intro}</p>}

        {isLoading && <p className="mt-8 text-sm text-muted-foreground">Laster steder…</p>}

        {!isLoading && items.length === 0 && (
          <p className="mt-8 text-sm text-muted-foreground">
            Ingen steder matcher ennå. Sjekk{" "}
            <Link to={`/${citySlug}`} className="text-primary underline">
              alle steder i {cityName}
            </Link>
            .
          </p>
        )}

        {items.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
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
        )}
      </div>
    </>
  );
}
