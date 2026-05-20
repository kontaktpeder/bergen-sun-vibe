// Tracks the venue the user is currently "checked in" to during a session.
// Stored in sessionStorage so it resets when the tab closes.
// Auto-expires after 2 hours of inactivity.

const KEY = "uf:active-venue";
const MAX_AGE_MS = 2 * 60 * 60 * 1000; // 2h

export interface ActiveVenue {
  venueId: string;
  slug?: string;
  name: string;
  startedAt: number;
  lastUsedAt: number;
}

export function getActiveVenue(): ActiveVenue | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as ActiveVenue;
    if (Date.now() - v.lastUsedAt > MAX_AGE_MS) {
      sessionStorage.removeItem(KEY);
      return null;
    }
    return v;
  } catch {
    return null;
  }
}

export function setActiveVenue(input: { venueId: string; slug?: string; name: string }) {
  const now = Date.now();
  const prev = getActiveVenue();
  const next: ActiveVenue = {
    venueId: input.venueId,
    slug: input.slug,
    name: input.name,
    startedAt: prev?.venueId === input.venueId ? prev.startedAt : now,
    lastUsedAt: now,
  };
  try {
    sessionStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function touchActiveVenue() {
  const v = getActiveVenue();
  if (!v) return;
  setActiveVenue({ venueId: v.venueId, slug: v.slug, name: v.name });
}

export function clearActiveVenue() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
