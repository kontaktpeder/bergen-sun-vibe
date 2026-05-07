import { useEffect, useState } from "react";

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

  useEffect(() => {
    if (!current) return;
    // Light haptic on supported devices
    try { (navigator as Navigator & { vibrate?: (p: number | number[]) => boolean }).vibrate?.(12); } catch { /* noop */ }
    const dwell = current.variant === "levelup" ? 4000 : 2800;
    const t = setTimeout(() => setQueue((q) => q.slice(1)), dwell);
    return () => clearTimeout(t);
  }, [current]);

  if (!current) return null;

  const dismiss = () => setQueue((q) => q.slice(1));
  const isLevel = current.variant === "levelup";

  return (
    <div
      role="status"
      aria-live="polite"
      onClick={dismiss}
      className="fixed inset-x-0 top-0 z-[80] flex justify-center px-4 pt-[max(env(safe-area-inset-top),0.75rem)] pointer-events-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="pointer-events-auto w-full max-w-sm animate-float-up"
      >
        <div
          className="relative overflow-hidden rounded-3xl border border-white/40 bg-card/95 px-4 py-3 shadow-float backdrop-blur-xl"
        >
          {/* Subtle brand glow */}
          <div className="pointer-events-none absolute -left-10 -top-12 h-32 w-32 rounded-full bg-primary/20 blur-3xl" />
          <div className="pointer-events-none absolute -right-12 -bottom-14 h-32 w-32 rounded-full bg-sunset-pink/20 blur-3xl" />

          <div className="relative flex items-center gap-3">
            <div
              className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-2xl shadow-soft ${
                isLevel
                  ? "bg-gradient-to-br from-accent to-primary text-white"
                  : "bg-gradient-to-br from-primary/15 via-sunset-pink/15 to-accent/15"
              }`}
            >
              <span className="drop-shadow-sm">{current.emoji}</span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="font-display text-[15px] font-semibold leading-tight text-foreground">
                {current.title}
              </div>
              {current.subtitle && (
                <div className="mt-0.5 truncate text-xs text-muted-foreground">
                  {current.subtitle}
                </div>
              )}
            </div>

            {current.points != null && !isLevel && (
              <div className="shrink-0 rounded-full bg-gradient-to-r from-primary to-sunset-pink px-3 py-1.5 font-display text-sm font-semibold text-white shadow-soft">
                +{current.points}
              </div>
            )}
          </div>

          {/* Progress bar that drains during dwell */}
          <div className="relative mt-3 h-0.5 overflow-hidden rounded-full bg-foreground/5">
            <div
              key={current.title + current.emoji}
              className="absolute inset-y-0 left-0 w-full origin-left bg-gradient-to-r from-primary to-sunset-pink"
              style={{
                animation: `reward-drain ${isLevel ? 4000 : 2800}ms linear forwards`,
              }}
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes reward-drain {
          from { transform: scaleX(1); }
          to { transform: scaleX(0); }
        }
      `}</style>
    </div>
  );
}
