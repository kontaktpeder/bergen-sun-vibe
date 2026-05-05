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

const FALLBACK = "/placeholder.svg";

/**
 * Resolve image source for a venue.
 * Priority:
 *  1. user-uploaded photo (passed in)
 *  2. venue.image (custom DB image_url)
 *  3. Google Place Photo via edge function
 *  4. placeholder
 */
export function resolveVenueImage(
  venue: Pick<Venue, "image" | "googlePhotoName">,
  userPhotoUrl?: string | null,
  size?: { w?: number; h?: number },
): { src: string; isGoogle: boolean } {
  if (userPhotoUrl) return { src: userPhotoUrl, isGoogle: false };
  if (venue.image) return { src: venue.image, isGoogle: false };
  const g = googlePlacePhotoUrl(venue.googlePhotoName, size);
  if (g) return { src: g, isGoogle: true };
  return { src: FALLBACK, isGoogle: false };
}
