import { VenueSection } from "./VenueSection";
import type { VenueTip } from "@/lib/venueContent";

interface Props {
  tips: VenueTip[];
  maxTips?: number;
}

export function VenueLocalTips({ tips, maxTips = 3 }: Props) {
  const items = tips.slice(0, maxTips);
  if (!items.length) return null;

  return (
    <VenueSection id="lokaltips" title="Lokaltips">
      <ul className="space-y-3">
        {items.map((tip) => (
          <li key={tip.title} className="rounded-2xl bg-card p-4 shadow-soft">
            <h3 className="text-sm font-semibold text-foreground">{tip.title}</h3>
            <p className="mt-1 text-sm text-foreground/80">{tip.body}</p>
          </li>
        ))}
      </ul>
    </VenueSection>
  );
}
