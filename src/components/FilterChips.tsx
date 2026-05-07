import { cn } from "@/lib/utils";

interface Props {
  options: { id: string; label: string; emoji?: string }[];
  active: string;
  onChange: (id: string) => void;
}

export function FilterChips({ options, active, onChange }: Props) {
  return (
    <div className="-mx-5 flex gap-2.5 overflow-x-auto px-5 pb-1 scrollbar-hide">
      {options.map((o) => {
        const isActive = active === o.id;
        return (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            className={cn(
              "tap-scale shrink-0 rounded-full border px-4 py-2 text-sm font-medium backdrop-blur-xl transition-all",
              isActive
                ? "border-white/40 bg-white/85 text-night shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
                : "border-white/20 bg-white/10 text-white/90 hover:bg-white/20",
            )}
          >
            {o.emoji && <span className="mr-1.5">{o.emoji}</span>}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
