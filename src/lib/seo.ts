import type { Venue } from "@/lib/domain";

export type PageType = "place" | "city" | "facet";

export const SITE_BASE = "https://utefolket.no";

export const CITY_SLUGS = {
  oslo: "Oslo",
  bergen: "Bergen",
} as const;
export type CitySlug = keyof typeof CITY_SLUGS;

export type FacetDef = {
  slug: string;
  label: string;
  intro: (city: string) => string;
  match: (v: Venue) => boolean;
};

const norm = (s: string) => s.toLowerCase();

export const FACET_DEFS: FacetDef[] = [
  {
    slug: "kveldssol",
    label: "Kveldssol",
    intro: (city) =>
      `Disse stedene i ${city} er best når solen står lavt. Perfekt etter jobb eller før middag — uteservering med god ettermiddags- og kveldssol.`,
    match: (v) =>
      v.sunStatus === "evening-sun" ||
      v.tags.some((t) => /kveldssol|sunset|kveld/i.test(t)),
  },
  {
    slug: "afterwork",
    label: "Afterwork",
    intro: (city) =>
      `Stedene folk i ${city} faktisk samles på etter jobb — uformell stemning, kaldt øl og uteservering når været tillater det.`,
    match: (v) => v.tags.some((t) => /afterwork|after-?work|happyhour/i.test(t)),
  },
  {
    slug: "date",
    label: "Date",
    intro: (city) =>
      `Steder i ${city} som funker når du vil gjøre litt ekstra inntrykk — intim stemning, godt utvalg og hyggelig uteservering.`,
    match: (v) => v.tags.some((t) => /date|romantisk|intim/i.test(t)),
  },
  {
    slug: "takterrasse",
    label: "Takterrasse",
    intro: (city) =>
      `Takterrasser i ${city} med utsikt og sol. Disse stedene gir deg byen fra et høyere ståsted.`,
    match: (v) => v.tags.some((t) => /tak|terrasse|rooftop/i.test(t)),
  },
];

export function slugifyNorwegian(input: string): string {
  return (input || "")
    .toLowerCase()
    .replace(/æ/g, "ae")
    .replace(/ø/g, "oe")
    .replace(/å/g, "aa")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function buildCanonical(path: string): string {
  if (!path.startsWith("/")) path = "/" + path;
  return SITE_BASE + path;
}

export function buildTitle(type: PageType, data: Record<string, string>): string {
  switch (type) {
    case "place": {
      const showArea = data.area && data.area.toLowerCase() !== (data.city || "").toLowerCase();
      const cityPart = data.city ? ` — ${data.city}` : "";
      const areaPart = showArea ? `, ${data.area}` : "";
      return `${data.name}${areaPart}${cityPart} | Utefolket`;
    }
    case "city":
      return `Steder å være ute i ${data.city} akkurat nå | Utefolket`;
    case "facet":
      return `${data.facet} i ${data.city} | Utefolket`;
  }
}

export function buildDescription(type: PageType, data: Record<string, string>): string {
  switch (type) {
    case "place":
      return (
        data.description?.slice(0, 155) ||
        `${data.name} i ${data.city ?? "Norge"} — stemning, sol, åpningstider og hva folk anbefaler nå.`
      );
    case "city":
      return `Utefolket viser steder i ${data.city} basert på stemning, tidspunkt og hva folk faktisk anbefaler nå.`;
    case "facet":
      return `${data.facet} i ${data.city}: anbefalte steder akkurat nå, oppdatert av lokale.`;
  }
}

export function shouldNoIndex(input: {
  pageType: PageType;
  resultCount?: number;
  hasIntro?: boolean;
  hasImage?: boolean;
  hasName?: boolean;
  hasCity?: boolean;
  hasTags?: boolean;
  hasRating?: boolean;
  hasReviews?: boolean;
}): boolean {
  if (input.pageType === "place") {
    if (!input.hasName || !input.hasCity) return true;
    const qualityIndicators = [
      input.hasImage,
      input.hasIntro,
      input.hasTags,
      input.hasRating,
      input.hasReviews,
    ].filter(Boolean).length;
    return qualityIndicators === 0;
  }
  if (input.pageType === "city") {
    const count = input.resultCount ?? 0;
    return count < 6;
  }
  // facet
  const count = input.resultCount ?? 0;
  if (count < 6) return true;
  if (!input.hasIntro) return true;
  return false;
}

// NB: `Venue.id` (fra mapDbVenue) er allerede `slug`. `dbId` er uuid.
// Alle SEO-URL-er bruker derfor venue.id (= slug).
export function buildPlaceSchema(venue: Venue) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": venue.category === "restaurant" ? "Restaurant" : venue.category === "cafe" ? "CafeOrCoffeeShop" : "BarOrPub",
    name: venue.name,
    url: buildCanonical(`/steder/${venue.id}`),
    geo: { "@type": "GeoCoordinates", latitude: venue.lat, longitude: venue.lng },
  };
  if (venue.address || venue.city) {
    schema.address = {
      "@type": "PostalAddress",
      streetAddress: venue.address ?? undefined,
      addressLocality: venue.city ?? undefined,
      addressCountry: "NO",
    };
  }
  if (venue.image) schema.image = venue.image;
  if (venue.rating > 0 && venue.reviews > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: venue.rating,
      reviewCount: venue.reviews,
    };
  }
  return schema;
}

export function buildItemListSchema(items: Venue[], pageUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    url: pageUrl,
    numberOfItems: items.length,
    itemListElement: items.slice(0, 50).map((v, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: buildCanonical(`/steder/${v.id}`),
      name: v.name,
    })),
  };
}

export function resolveFacet(slug: string): FacetDef | null {
  const s = norm(slug);
  return FACET_DEFS.find((f) => f.slug === s) ?? null;
}

export function venuesInArea(all: Venue[], areaSlug: string): Venue[] {
  const target = norm(areaSlug);
  return all.filter((v) => v.area && slugifyNorwegian(v.area) === target);
}
