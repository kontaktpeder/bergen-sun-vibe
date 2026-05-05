import type { Venue } from "@/lib/domain";

const FUNCTIONS_BASE = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1`;

export function googlePlacePhotoUrl(
  photoName: string | undefined | null,
  size: { w?: number; h?: number } = {},
): string | null {
  if (!photoName) return null;
  const w = size.w ?? 800;
  const h = size.h ?? 800;
  return `${FUNCTIONS_BASE}/get-google-place-photo?name=${encodeURIComponent(photoName)}&w=${w}&h=${h}`;
}

export type ResolvedVenueImage =
  | { kind: "user" | "custom" | "google"; src: string }
  | { kind: "fallback"; src: null };

/**
 * Resolve image source for a venue.
 * Priority: user-uploaded → DB image_url → Google Place photo → branded fallback.
 */
export function resolveVenueImage(
  venue: Pick<Venue, "image" | "googlePhotoName">,
  userPhotoUrl?: string | null,
  size?: { w?: number; h?: number },
): ResolvedVenueImage {
  if (userPhotoUrl) return { kind: "user", src: userPhotoUrl };
  if (venue.image) return { kind: "custom", src: venue.image };
  const g = googlePlacePhotoUrl(venue.googlePhotoName, size);
  if (g) return { kind: "google", src: g };
  return { kind: "fallback", src: null };
}
