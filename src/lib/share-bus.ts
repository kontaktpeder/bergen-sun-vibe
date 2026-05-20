// Bus for opening the new camera-first "Del nå" overlay.
// Separate from the legacy contribute-bus so the old ContributeFab
// can stay mounted as a fallback for venue_add without conflicting.

export type ShareNowContext = {
  // Set when opened from a venue page so we can pre-confirm location.
  fromVenue?: { venueId: string; slug?: string; name: string };
  // Optional starting step (default = camera).
  startAt?: "camera" | "sun" | "crowd" | "beer";
};

type Listener = (ctx: ShareNowContext) => void;
const listeners = new Set<Listener>();

export function openShareNow(ctx: ShareNowContext = {}) {
  listeners.forEach((l) => l(ctx));
}

export function subscribeShareNow(l: Listener): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
