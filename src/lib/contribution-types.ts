export type ContributionType = "sun_report" | "beer_price" | "photo" | "venue_add";

export const POINTS = {
  sun_report: 5,
  beer_price: 10,
  beer_price_confirm: 3,
  photo: 15,
  venue_add: 25,
} as const;

export type SunPayload = { status: "sun" | "shade" };
export type BeerPayload = { price: number; label: "cheapest" };
export type PhotoPayload = { image_url: string };
export type VenueAddPayload = {
  name: string;
  lat: number;
  lng: number;
  category: "bar" | "cafe" | "restaurant";
  city: "Bergen" | "Oslo";
  image_url?: string;
};

export type ContributionPayload =
  | { type: "sun_report"; data: SunPayload; venueId: string }
  | { type: "beer_price"; data: BeerPayload; venueId: string; isConfirm?: boolean }
  | { type: "photo"; data: PhotoPayload; venueId: string }
  | { type: "venue_add"; data: VenueAddPayload };
