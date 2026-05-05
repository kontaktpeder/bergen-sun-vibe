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
  google_photo_name?: string | null;
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
    image: row.image_url || null,
    googlePhotoName: row.google_photo_name ?? null,
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

// City helpers — avoid hard "?? 'Bergen'" fallback. Legacy rows without city
// are inferred from coordinates; otherwise hidden from city-scoped lists.
export function inferLegacyCity(lat: number, lng: number): "Bergen" | "Oslo" | null {
  if (lat >= 60.34 && lat <= 60.44 && lng >= 5.20 && lng <= 5.45) return "Bergen";
  if (lat >= 59.82 && lat <= 59.99 && lng >= 10.60 && lng <= 10.95) return "Oslo";
  return null;
}

export function belongsToCity(v: Venue, currentCity: "Bergen" | "Oslo"): boolean {
  if (v.city) return v.city === currentCity;
  return inferLegacyCity(v.lat, v.lng) === currentCity;
}

// Seksjons-konfig. `filter` mottar valgfritt et badgeMap så seksjoner kan
// basere seg på ferske bidrag i stedet for legacy venue-felt.
export type SectionBadgeMap = Record<string, { sun: "sunny" | "partial" | "shade" | "unknown" | null; beerPrice: number | null; photoCount: number }>;

export interface SectionDef {
  id: "best-now" | "sun-now" | "cheap-beer" | "trending" | "family" | "fresh-photos";
  title: string;
  subtitle: string;
  filter: (v: Venue, badges?: SectionBadgeMap) => boolean;
}

export function buildSectionConfig(city: string): SectionDef[] {
  return [
    { id: "best-now", title: "Best akkurat nå", subtitle: `Topp picks i ${city} i kveld`, filter: (v) => v.rating >= 4.6 },
    { id: "sun-now", title: "Sol nå ☀️", subtitle: "Bekreftet av brukere nylig", filter: (v, b) => b?.[v.dbId]?.sun === "sunny" },
    { id: "cheap-beer", title: "Billigst øl 🍺", subtitle: "Sortert etter laveste rapporterte pris", filter: (v, b) => (b?.[v.dbId]?.beerPrice ?? null) != null },
    { id: "trending", title: `Populært i ${city}`, subtitle: "Det alle snakker om", filter: (v) => v.trending === true },
    { id: "family", title: "Familievennlig", subtitle: "Alle aldre velkommen", filter: (v) => v.familyFriendly },
    { id: "fresh-photos", title: "Ferske bilder 📸", subtitle: "Nylig delt av brukere", filter: (v, b) => (b?.[v.dbId]?.photoCount ?? 0) > 0 },
  ];
}

