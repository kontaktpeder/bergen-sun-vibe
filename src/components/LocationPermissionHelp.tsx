import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { LocateFixed } from "lucide-react";

type Platform = "ios" | "android-chrome" | "desktop-chrome" | "desktop-safari" | "desktop-firefox" | "other";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && (navigator as any).maxTouchPoints > 1);
  if (isIOS) return "ios";
  const isAndroid = /Android/.test(ua);
  if (isAndroid) return "android-chrome";
  const isFirefox = /Firefox\//.test(ua);
  if (isFirefox) return "desktop-firefox";
  const isSafari = /Safari\//.test(ua) && !/Chrome|Chromium|Edg|OPR/.test(ua);
  if (isSafari) return "desktop-safari";
  const isChrome = /Chrome\//.test(ua);
  if (isChrome) return "desktop-chrome";
  return "other";
}

function stepsFor(p: Platform): string[] {
  switch (p) {
    case "ios":
      return [
        "Åpne Innstillinger på iPhone",
        "Bla ned og trykk på Safari (eller nettleseren du bruker)",
        "Trykk på Posisjon",
        "Velg «Spør» eller «Tillat»",
        "Kom tilbake hit og trykk «Prøv igjen»",
      ];
    case "android-chrome":
      return [
        "Trykk på låsikonet ved siden av adressen øverst",
        "Velg Tillatelser",
        "Slå på Posisjon",
        "Last siden på nytt og trykk «Prøv igjen»",
      ];
    case "desktop-chrome":
      return [
        "Klikk på låsikonet til venstre for adressen øverst i nettleseren",
        "Velg «Innstillinger for nettsted» (Site settings)",
        "Sett Posisjon til «Tillat»",
        "Kom tilbake hit og trykk «Prøv igjen»",
      ];
    case "desktop-safari":
      return [
        "Åpne Safari-menyen øverst → Innstillinger",
        "Gå til Nettsteder → Posisjon",
        "Finn utefolket.no i listen og velg «Tillat»",
        "Kom tilbake hit og trykk «Prøv igjen»",
      ];
    case "desktop-firefox":
      return [
        "Klikk på låsikonet til venstre for adressen øverst",
        "Trykk på «X» ved siden av Blokkert posisjon for å fjerne blokkeringen",
        "Last siden på nytt og trykk «Prøv igjen»",
      ];
    default:
      return [
        "Åpne innstillinger for nettstedet i nettleseren din",
        "Tillat tilgang til posisjon for denne siden",
        "Kom tilbake hit og trykk «Prøv igjen»",
      ];
  }
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRetry: () => void;
};

export function LocationPermissionHelp({ open, onOpenChange, onRetry }: Props) {
  const platform = detectPlatform();
  const steps = stepsFor(platform);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Slå på posisjon</DialogTitle>
          <DialogDescription>
            Du har sagt nei tidligere. Nettleseren tillater dessverre ikke at vi spør på nytt automatisk — du må slå det på manuelt:
          </DialogDescription>
        </DialogHeader>
        <ol className="mt-1 space-y-2 text-sm">
          {steps.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-semibold text-primary">{i + 1}</span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
        <button
          type="button"
          onClick={() => { onOpenChange(false); onRetry(); }}
          className="tap-scale mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-4 py-3 text-sm font-medium text-background"
        >
          <LocateFixed className="h-4 w-4" />
          Prøv igjen
        </button>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="text-center text-xs text-muted-foreground underline-offset-2 hover:underline"
        >
          Lukk
        </button>
      </DialogContent>
    </Dialog>
  );
}
