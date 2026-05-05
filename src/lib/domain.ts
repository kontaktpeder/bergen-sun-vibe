// App-typer som UI bruker. DB-rader mappes via `mapDbVenue` for å isolere
// kolonneforskjeller (slug, image_url, sun_status osv).
import bryggen from "@/assets/venue-bryggen.jpg";
import rooftop from "@/assets/venue-rooftop.jpg";
import fisketorget from "@/assets/venue-fisketorget.jpg";
import student from "@/assets/venue-student.jpg";
import nordnes from "@/assets/venue-nordnes.jpg";
import family from "@/assets/venue-family.jpg";
import wine from "@/assets/venue-wine.jpg";
import brewery from "@/assets/venue-brewery.jpg";
import coffee from "@/assets/venue-coffee.jpg";
import floyen from "@/assets/venue-floyen.jpg";
import cocktail from "@/assets/venue-cocktail.jpg";
import pizza from "@/assets/venue-pizza.jpg";

export type SunStatus = "sun-now" | "sun-until" | "evening-sun" | "shade-soon" | "shade";

export interface Venue {
  id: string; // = slug, brukes som rute-param
  dbId: string; // venue uuid (for contributions/relasjoner)
  name: string;
  image: string;
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
  lat: number;
  lng: number;
  lastActivityAt: string;
}

// Fallback-bilder per slug (DB-en har image_url=null inntil videre).
const imageMap: Record<string, string> = {
  "bryggen-bar": bryggen,
  "bergen-rooftop": rooftop,
  "fisketorget": fisketorget,
  "studentbaren": student,
  "nordnes-utebar": nordnes,
  "torgallmenningen-pub": pizza,
  "marg-bein": wine,
  "7-fjell": brewery,
  "kaffemisjonen": coffee,
  "floyen-cafe": floyen,
  "no-stress": cocktail,
  "villa-blanca": family,
};

const fallbackImage = rooftop;

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
}

export function mapDbVenue(row: DbVenue): Venue {
  const priceLevel = Math.min(4, Math.max(1, Number(row.price_level) || 2)) as 1 | 2 | 3 | 4;
  return {
    id: row.slug,
    dbId: row.id,
    name: row.name,
    image: row.image_url || imageMap[row.slug] || fallbackImage,
    category: row.category,
    rating: Number(row.rating) || 0,
    reviews: row.reviews ?? 0,
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
    area: row.area || "",
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
