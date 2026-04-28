import { useEffect, useState } from "react";

const KEY = "uteliv:favorites";

function read(): string[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}

const listeners = new Set<() => void>();

export function useFavorites() {
  const [favs, setFavs] = useState<string[]>(read);
  useEffect(() => {
    const cb = () => setFavs(read());
    listeners.add(cb);
    return () => { listeners.delete(cb); };
  }, []);
  return favs;
}

export function toggleFavorite(id: string) {
  const cur = read();
  const next = cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id];
  localStorage.setItem(KEY, JSON.stringify(next));
  listeners.forEach(l => l());
}

export function isFavorite(id: string) {
  return read().includes(id);
}
