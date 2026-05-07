export type ContributionType = "sun_report" | "beer_price" | "photo" | "venue_add" | "crowd_report";

export const POINTS = {
  sun_report: 5,
  beer_price: 10,
  beer_price_confirm: 3,
  photo: 15,
  venue_add: 25,
  crowd_report: 5,
} as const;

export type SunStatus = "sun" | "partial" | "shade" | "going_down";
export type CrowdLevel = "quiet" | "some" | "full" | "queue";

export type SunPayload = { status: SunStatus };
export type CrowdPayload = { level: CrowdLevel };
export type BeerPayload = { price: number; label: "cheapest" };
export type PhotoPayload = { image_url: string };
export type VenueAddPayload = {
  name: string;
  lat: number;
  lng: number;
  category: "bar" | "cafe" | "restaurant";
  city: "Bergen" | "Oslo";
  image_url?: string;

  // Optional Google Places enrichment
  google_place_id?: string;
  google_maps_url?: string;
  address?: string;
  google_rating?: number;
  google_user_rating_count?: number;
  source?: "manual" | "google";

  // Set true after the user confirms a similar-named venue elsewhere in the city is a different place
  confirm_distinct?: boolean;
};

export type ContributionPayload =
  | { type: "sun_report"; data: SunPayload; venueId: string }
  | { type: "crowd_report"; data: CrowdPayload; venueId: string }
  | { type: "beer_price"; data: BeerPayload; venueId: string; isConfirm?: boolean }
  | { type: "photo"; data: PhotoPayload; venueId: string }
  | { type: "venue_add"; data: VenueAddPayload };
