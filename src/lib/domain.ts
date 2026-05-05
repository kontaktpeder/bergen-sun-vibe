// App-typer som UI bruker. DB-rader mappes via `mapDbVenue` for å isolere
// kolonneforskjeller (slug, image_url, sun_status osv).

export type SunStatus = "sun-now" | "sun-until" | "evening-sun" | "shade-soon" | "shade";

export interface Venue {
  id: string; // = slug, brukes som rute-param
  dbId: string; // venue uuid (for contributions/relasjoner)
  name: string;
  image: string | null;
  googlePhotoName?: string | null;
  category: string;
  rating: number;
  reviews: number;
  priceLevel: 1 | 2 | 3 | 4;
  sunScore: number;
  sunStatus: SunStatus;
  sunUntil?: string;
  dealText?: string;
  familyFriendly: boolean;
  trending?: boolean;
  tags: string[];
  description: string;
  hours: string;
  area: string;
  city?: string;
  address?: string;
  googleMapsUrl?: string;
  websiteUrl?: string;
  lat: number;
  lng: number;
  lastActivityAt: string;
}

// Bilder hentes fra DB (image_url) eller Google Place Photo via edge function.
// Ingen AI-placeholder-bilder lenger.


export interface DbVenue {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  image_url: string | null;
  area: string | null;
  hours: string | null;
  lat: number | string;
  lng: number | string;
  price_level: number;
  rating: number | string;
  reviews: number;
  sun_score: number;
  sun_status: string;
  sun_until: string | null;
  deal_text: string | null;
  family_friendly: boolean;
  trending: boolean;
  tags: string[];
  last_activity_at: string;
  city?: string | null;
  address?: string | null;
  google_maps_url?: string | null;
  website_url?: string | null;
  google_rating?: number | string | null;
  google_user_rating_count?: number | null;
}

export function mapDbVenue(row: DbVenue): Venue {
  const priceLevel = Math.min(4, Math.max(1, Number(row.price_level) || 2)) as 1 | 2 | 3 | 4;
  // Prefer Google rating/reviews when seeded data hasn't been overridden by users
  const rating = Number(row.rating) || (row.google_rating != null ? Number(row.google_rating) : 0);
  const reviews = (row.reviews ?? 0) || (row.google_user_rating_count ?? 0);
  return {
    id: row.slug,
    dbId: row.id,
    name: row.name,
    image: row.image_url || imageMap[row.slug] || fallbackImage,
    category: row.category,
    rating,
    reviews,
    priceLevel,
    sunScore: row.sun_score ?? 0,
    sunStatus: (row.sun_status as SunStatus) || "shade",
    sunUntil: row.sun_until ?? undefined,
    dealText: row.deal_text ?? undefined,
    familyFriendly: row.family_friendly,
    trending: row.trending,
    tags: row.tags || [],
    description: row.description || "",
    hours: row.hours || "",
    area: row.area || row.city || "",
    city: row.city ?? undefined,
    address: row.address ?? undefined,
    googleMapsUrl: row.google_maps_url ?? undefined,
    websiteUrl: row.website_url ?? undefined,
    lat: Number(row.lat),
    lng: Number(row.lng),
    lastActivityAt: row.last_activity_at,
  };
}

// Seksjons-konfig (samme som tidligere mock).
export const sectionConfig = [
  { id: "best-now", title: "Best akkurat nå", subtitle: "Topp picks i Bergen i kveld", filter: (v: Venue) => v.rating >= 4.6 },
  { id: "sun-now", title: "Sol nå ☀️", subtitle: "Sitt ute mens sola er fremme", filter: (v: Venue) => v.sunStatus === "sun-now" },
  { id: "cheap-beer", title: "Billig øl 🍺", subtitle: "Under 80,- pils", filter: (v: Venue) => v.priceLevel === 1 || /billig|øl|pils/i.test(v.dealText || "") },
  { id: "trending", title: "Populært i Bergen", subtitle: "Det alle snakker om", filter: (v: Venue) => v.trending === true },
  { id: "family", title: "Familievennlig", subtitle: "Alle aldre velkommen", filter: (v: Venue) => v.familyFriendly },
  { id: "evening-sun", title: "Kveldssol senere", subtitle: "Sol etter 19:00", filter: (v: Venue) => v.sunStatus === "evening-sun" || (!!v.sunUntil && parseInt(v.sunUntil) >= 19) },
] as const;
