import { Button } from "@/components/ui/button";

type Props = {
  onSun: () => void;
  onBeer: () => void;
  onPhoto: () => void;
  onReportInfo: () => void;
};

export function VenueContributeModule({ onSun, onBeer, onPhoto, onReportInfo }: Props) {
  return (
    <div className="mt-4 rounded-2xl bg-card p-4 shadow-soft">
      <div className="text-xs font-semibold uppercase tracking-widest text-primary">
        Bidra til dette stedet
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button variant="secondary" className="h-12 justify-start gap-2" onClick={onSun}>
          <span className="text-lg">☀️</span> Sol nå
        </Button>
        <Button variant="secondary" className="h-12 justify-start gap-2" onClick={onBeer}>
          <span className="text-lg">🍺</span> Ølpris
        </Button>
        <Button variant="secondary" className="h-12 justify-start gap-2" onClick={onPhoto}>
          <span className="text-lg">📸</span> Bilde
        </Button>
        <Button variant="secondary" className="h-12 justify-start gap-2" onClick={onReportInfo}>
          <span className="text-lg">🚩</span> Rapporter info
        </Button>
      </div>
    </div>
  );
}
