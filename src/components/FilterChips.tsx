import { cn } from "@/lib/utils";

interface Props {
  options: { id: string; label: string; emoji?: string }[];
  active: string;
  onChange: (id: string) => void;
}

export function FilterChips({ options, active, onChange }: Props) {
  return (
    <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 scrollbar-hide">
      {options.map((o) => {
        const isActive = active === o.id;
        return (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            className={cn(
              "tap-scale shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all",
              isActive
                ? "bg-night text-white shadow-card"
                : "bg-card text-foreground shadow-soft hover:bg-secondary",
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
