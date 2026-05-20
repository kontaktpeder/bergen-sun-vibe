import { useEffect, useState } from "react";

type Item = { id: number; value: number };
let nextId = 1;
const listeners = new Set<(item: Item) => void>();

export function flyPoints(value: number) {
  const item: Item = { id: nextId++, value };
  listeners.forEach((l) => l(item));
}

export function PointsFlyupHost() {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    const l = (item: Item) => {
      setItems((prev) => [...prev, item]);
      setTimeout(() => {
        setItems((prev) => prev.filter((x) => x.id !== item.id));
      }, 1100);
    };
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] flex items-end justify-center pb-40">
      {items.map((it) => (
        <span
          key={it.id}
          className="absolute animate-points-fly font-display text-3xl font-bold text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
        >
          +{it.value}
        </span>
      ))}
    </div>
  );
}
