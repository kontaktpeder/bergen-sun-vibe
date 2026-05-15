import { VenueSection } from "./VenueSection";
import type { VenueFact } from "@/lib/venueContent";

interface Props {
  facts: VenueFact[];
  minFacts?: number;
}

export function VenueWorthKnowing({ facts, minFacts = 2 }: Props) {
  if (facts.length < minFacts) return null;

  return (
    <VenueSection id="verdt-a-vite" title="Verdt å vite">
      <dl className="grid grid-cols-2 gap-3">
        {facts.map(({ label, value }) => (
          <div key={label} className="rounded-2xl bg-card p-3 shadow-soft">
            <dt className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              {label}
            </dt>
            <dd className="mt-1 text-sm font-medium text-foreground">{value}</dd>
          </div>
        ))}
      </dl>
    </VenueSection>
  );
}
