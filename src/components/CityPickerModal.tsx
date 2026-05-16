import { useState } from "react";
import { useCity, type City } from "@/context/CityContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { LocateFixed, MapPin } from "lucide-react";
import { toast } from "sonner";
import { LocationPermissionHelp } from "@/components/LocationPermissionHelp";
import { cn } from "@/lib/utils";

const CITIES: { id: City; label: string; emoji: string }[] = [
  { id: "Oslo", label: "Oslo", emoji: "🏙️" },
  { id: "Bergen", label: "Bergen", emoji: "🏔️" },
];

export function CityPickerModal() {
  const { hasChosenCity, setCurrentCity, chooseCityByLocation, pickerOpen, closePicker } = useCity();
  const [busy, setBusy] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const open = !hasChosenCity || pickerOpen;
  const dismissable = hasChosenCity;

  const handleLocate = async () => {
    setBusy(true);
    const city = await chooseCityByLocation();
    setBusy(false);
    if (!city) {
      let denied = false;
      try {
        // @ts-ignore
        const status = await navigator.permissions?.query?.({ name: "geolocation" as PermissionName });
        denied = status?.state === "denied";
      } catch { /* ignore */ }
      if (denied) {
        setHelpOpen(true);
      } else {
        toast.error("Fant ikke posisjonen din. Prøv igjen eller velg by manuelt.");
      }
    } else {
      toast.success(`Viser steder i ${city}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && dismissable) closePicker(); }}>
      <DialogContent
        className="max-w-sm rounded-3xl"
        onInteractOutside={(e) => { if (!dismissable) e.preventDefault(); }}
        onEscapeKeyDown={(e) => { if (!dismissable) e.preventDefault(); }}
        onPointerDownOutside={(e) => { if (!dismissable) e.preventDefault(); }}
      >
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Velg din by</DialogTitle>
          <DialogDescription>
            Solguiden viser steder lokalt. Hvilken by er du i?
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2 grid grid-cols-2 gap-3">
          {CITIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCurrentCity(c.id)}
              className={cn(
                "tap-scale flex flex-col items-center gap-2 rounded-2xl border bg-card px-4 py-5 shadow-soft",
                "hover:border-primary/40",
              )}
            >
              <span className="text-3xl" aria-hidden>{c.emoji}</span>
              <span className="font-display text-base font-semibold">{c.label}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={handleLocate}
          disabled={busy}
          className="tap-scale mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-4 py-3 text-sm font-medium text-background disabled:opacity-60"
        >
          <LocateFixed className="h-4 w-4" />
          {busy ? "Finner posisjon…" : "Bruk min posisjon"}
        </button>
        <p className="mt-1 inline-flex items-center justify-center gap-1 text-center text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" /> Du kan bytte by når som helst
        </p>
      </DialogContent>
      <LocationPermissionHelp open={helpOpen} onOpenChange={setHelpOpen} onRetry={handleLocate} />
    </Dialog>
  );
}
