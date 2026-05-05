type Mode = "menu" | "sun" | "beer" | "photo" | "venue";
type Listener = (mode: Mode) => void;
const listeners = new Set<Listener>();

export function openContributeFab(mode: Mode = "venue") {
  listeners.forEach((l) => l(mode));
}

export function subscribeContributeFab(l: Listener): () => void {
  listeners.add(l);
  return () => { listeners.delete(l); };
}
