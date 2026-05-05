import { Button } from "@/components/ui/button";

type Props = {
  onSun: () => void;
  onBeer: () => void;
  onPhoto: () => void;
};

export function VenueContributeModule({ onSun, onBeer, onPhoto }: Props) {
  return (
    <div className="mt-4 rounded-2xl bg-card p-4 shadow-soft">
      <div className="text-xs font-semibold uppercase tracking-widest text-primary">
        Bidra til dette stedet
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Button variant="secondary" className="h-14 flex-col gap-1" onClick={onSun}>
          <span className="text-xl leading-none">☀️</span>
          <span className="text-xs">Sol nå</span>
        </Button>
        <Button variant="secondary" className="h-14 flex-col gap-1" onClick={onBeer}>
          <span className="text-xl leading-none">🍺</span>
          <span className="text-xs">Ølpris</span>
        </Button>
        <Button variant="secondary" className="h-14 flex-col gap-1" onClick={onPhoto}>
          <span className="text-xl leading-none">📸</span>
          <span className="text-xs">Bilde</span>
        </Button>
      </div>
    </div>
  );
}
