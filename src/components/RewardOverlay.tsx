import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export type RewardEvent = {
  emoji: string;
  points?: number;
  title: string;
  subtitle?: string;
  variant?: "points" | "levelup" | "venue";
};

type Listener = (e: RewardEvent) => void;
const listeners = new Set<Listener>();

export function showReward(e: RewardEvent) {
  listeners.forEach((l) => l(e));
}

export function RewardOverlayHost() {
  const [queue, setQueue] = useState<RewardEvent[]>([]);
  const current = queue[0];

  useEffect(() => {
    const l: Listener = (e) => setQueue((q) => [...q, e]);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);

  // Auto-advance level-up after a small dwell so it doesn't block forever
  useEffect(() => {
    if (!current) return;
    const t = setTimeout(() => setQueue((q) => q.slice(1)), current.variant === "levelup" ? 2800 : 1900);
    return () => clearTimeout(t);
  }, [current]);

  if (!current) return null;

  const dismiss = () => setQueue((q) => q.slice(1));

  return (
    <div
      role="dialog"
      aria-live="polite"
      onClick={dismiss}
      className="fixed inset-0 z-[80] grid place-items-center bg-night/40 px-6 backdrop-blur-sm animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xs rounded-3xl bg-card p-6 text-center shadow-float animate-scale-in"
      >
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-primary/15 to-sunset-pink/15 text-5xl">
          {current.emoji}
        </div>
        {current.points != null && current.variant !== "levelup" && (
          <div className="mt-4 font-display text-4xl font-semibold text-primary">
            +{current.points} poeng
          </div>
        )}
        <div className={`mt-2 font-display ${current.variant === "levelup" ? "text-2xl" : "text-base"} font-semibold leading-tight`}>
          {current.title}
        </div>
        {current.subtitle && (
          <p className="mt-1 text-sm text-muted-foreground">{current.subtitle}</p>
        )}
        <Button onClick={dismiss} className="mt-5 w-full">Ferdig</Button>
      </div>
    </div>
  );
}
