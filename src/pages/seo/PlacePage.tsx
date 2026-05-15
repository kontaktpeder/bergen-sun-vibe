import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useVenue } from "@/hooks/useVenue";
import { useVenues } from "@/hooks/useVenues";
import { useVenueBadges } from "@/hooks/useVenueBadges";
import { useVenuePhotos } from "@/hooks/useVenuePhotos";
import { VenueCard } from "@/components/VenueCard";
import { SeoHead } from "@/components/seo/SeoHead";
import {
  buildCanonical,
  buildDescription,
  buildPlaceSchema,
  buildTitle,
  shouldNoIndex,
  slugifyNorwegian,
} from "@/lib/seo";
import { buildVenueContentBlocks } from "@/lib/venueContent";
import VenueDetail from "@/pages/VenueDetail";

export default function PlacePage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: venue, isLoading } = useVenue(slug);
  const { data: allVenues = [] } = useVenues();

  const related = useMemo(() => {
    if (!venue) return [];
    return allVenues
      .filter((v) => v.dbId !== venue.dbId && v.city === venue.city)
      .filter((v) => v.area === venue.area || v.tags.some((t) => venue.tags.includes(t)))
      .slice(0, 6);
  }, [venue, allVenues]);

  const ids = useMemo(() => related.map((v) => v.dbId), [related]);
  const { data: badgeMap = {} } = useVenueBadges(ids);
  const { data: photoMap = {} } = useVenuePhotos(ids);

  const venueBadgeIds = useMemo(() => (venue?.dbId ? [venue.dbId] : []), [venue?.dbId]);
  const { data: venueBadgeMap = {} } = useVenueBadges(venueBadgeIds);
  const venueBadge = venue?.dbId ? venueBadgeMap[venue.dbId] : undefined;
  const contentBlocks = venue ? buildVenueContentBlocks(venue, venueBadge) : null;

  if (!isLoading && !venue) {
    return (
      <>
        <SeoHead
          title="Sted ikke funnet | Utefolket"
          description="Vi fant ikke dette stedet."
          canonical={buildCanonical(`/steder/${slug ?? ""}`)}
          robots="noindex,follow"
        />
        <div className="px-5 py-12 text-center text-sm text-muted-foreground">
          Fant ikke stedet. <Link to="/" className="text-primary underline">Gå til forsiden</Link>
        </div>
      </>
    );
  }

  const hasIntro = !!contentBlocks?.introShort && contentBlocks.introShort.length >= 20;
  const hasImage = !!venue?.image;
  const hasTags = !!venue?.tags && venue.tags.length > 0;
  const hasName = !!venue?.name;
  const hasCity = !!venue?.city;
  const hasRating = !!venue && venue.rating >= 0;
  const hasReviews = !!venue && venue.reviews > 0;
  const noindex = !venue
    ? true
    : shouldNoIndex({
        pageType: "place",
        hasIntro,
        hasImage,
        hasTags,
        hasName,
        hasCity,
        hasRating,
        hasReviews,
      });

  return (
    <>
      {venue && (
        <SeoHead
          title={buildTitle("place", { name: venue.name, area: venue.area, city: venue.city ?? "" })}
          description={buildDescription("place", {
            name: venue.name,
            city: venue.city ?? "",
            description: contentBlocks?.introShort ?? venue.description,
          })}
          canonical={buildCanonical(`/steder/${venue.id}`)}
          robots={noindex ? "noindex,follow" : "index,follow"}
          image={venue.image ?? undefined}
          jsonLd={buildPlaceSchema(venue)}
        />
      )}

      {/* Gjenbruk eksisterende stedside-UI uten endringer */}
      <VenueDetail />

      {related.length > 0 && (
        <section className="mx-auto max-w-3xl px-5 pb-12">
          <h2 className="mb-3 font-display text-xl font-semibold">Lignende steder</h2>
          <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-2 scrollbar-hide">
            {related.map((v, i) => (
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
          {venue?.city && (
            <p className="mt-4 text-sm text-muted-foreground">
              Se flere{" "}
              <Link to={`/${slugifyNorwegian(venue.city)}`} className="text-primary underline">
                steder i {venue.city}
              </Link>
            </p>
          )}
        </section>
      )}
    </>
  );
}
