import { Heart, Navigation, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onMap: () => void;
  onShare: () => void;
  onSave: () => void;
  saved: boolean;
}

export function VenueStickyActions({ onMap, onShare, onSave, saved }: Props) {
  return (
    <div className="mt-5 grid grid-cols-3 gap-2">
      <button
        onClick={onMap}
        className="tap-scale flex items-center justify-center gap-2 rounded-full bg-night py-3 text-sm font-medium text-white shadow-card"
      >
        <Navigation className="h-4 w-4" />
        Kart
      </button>
      <button
        onClick={onSave}
        className="tap-scale flex items-center justify-center gap-2 rounded-full bg-card py-3 text-sm font-medium shadow-soft"
      >
        <Heart className={cn("h-4 w-4 transition-colors", saved && "fill-primary text-primary")} />
        {saved ? "Lagret" : "Lagre"}
      </button>
      <button
        onClick={onShare}
        className="tap-scale flex items-center justify-center gap-2 rounded-full bg-card py-3 text-sm font-medium shadow-soft"
      >
        <Share2 className="h-4 w-4" />
        Del
      </button>
    </div>
  );
}
