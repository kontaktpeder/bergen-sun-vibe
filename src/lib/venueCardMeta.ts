import type { Venue } from "@/lib/domain";
import { distanceMeters, formatDistance } from "@/lib/geo";

export type UserLatLng = { lat: number; lng: number };

export function venueLocationLabel(venue: Venue, user: UserLatLng | null): string {
  if (user) {
    const m = distanceMeters(user.lat, user.lng, venue.lat, venue.lng);
    const f = formatDistance(m);
    if (f) return f;
  }
  const area = venue.area?.trim();
  const city = venue.city?.trim();
  if (area && city && area.toLowerCase() === city.toLowerCase()) return area;
  if (area) return area;
  if (city) return city;
  return venue.category;
}
