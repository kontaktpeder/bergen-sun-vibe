import { MapPin } from "lucide-react";
import { ShareVenueButton } from "@/components/ShareVenueButton";
import { getLevel, getNextLevelThreshold } from "@/lib/levels";
import type { SunStatus, CrowdLevel } from "@/lib/contribution-types";

const SUN_META: Record<SunStatus, { emoji: string; label: string }> = {
  sun: { emoji: "☀️", label: "Full sol" },
  partial: { emoji: "⛅", label: "Delvis sol" },
  going_down: { emoji: "🌇", label: "Sol på vei ned" },
  shade: { emoji: "🌥️", label: "Skygge" },
};

const CROWD_META: Record<CrowdLevel, { emoji: string; label: string }> = {
  quiet: { emoji: "😌", label: "Rolig" },
  some: { emoji: "🙂", label: "Litt folk" },
  full: { emoji: "🔥", label: "Fullt" },
  queue: { emoji: "🔥", label: "Fullt" },
};

export interface ReceiptData {
  empty: boolean;
  awardedPoints: number;
  beforePoints: number;
  newPoints: number;
  errors: string[];
}

interface VenueLite {
  venueId: string;
  slug?: string;
  name: string;
  city?: string | null;
}

interface DraftLite {
  photoUrl?: string;
  sun?: SunStatus;
  crowd?: CrowdLevel;
  beer?: number;
}

interface Props {
  venue: VenueLite | undefined;
  draft: DraftLite;
  receipt: ReceiptData;
  onDone: () => void;
  onAddReport: () => void;
}

export function ShareReceiptStep({ venue, draft, receipt, onDone, onAddReport }: Props) {
  const sun = draft.sun ? SUN_META[draft.sun] : null;
  const crowd = draft.crowd ? CROWD_META[draft.crowd] : null;

  if (receipt.empty) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="pt-20 px-6 text-center">
          <div className="text-5xl">🤔</div>
          <h2 className="mt-4 font-display text-2xl font-semibold">
            Ingenting å publisere ennå
          </h2>
          <p className="mt-2 text-sm text-white/60">
            Legg til minst én rapport for å dele hvordan det er{venue ? ` på ${venue.name}` : ""}.
          </p>
        </div>
        <div className="mt-auto space-y-2 px-6 pb-[max(env(safe-area-inset-bottom),1.5rem)] pt-4">
          <button
            onClick={onAddReport}
            className="tap-scale w-full rounded-2xl bg-gradient-to-br from-primary to-sunset-pink py-5 text-base font-semibold text-white shadow-float"
          >
            Legg til rapport
          </button>
          <button
            onClick={onDone}
            className="tap-scale w-full rounded-2xl bg-white/10 py-4 text-sm font-medium text-white active:bg-white/20"
          >
            Ferdig
          </button>
        </div>
      </div>
    );
  }

  const oldLevel = getLevel(receipt.beforePoints);
  const newLevel = getLevel(receipt.newPoints);
  const levelUp = oldLevel !== newLevel;
  const nextThreshold = getNextLevelThreshold(receipt.newPoints);

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="pt-16 px-6 text-center">
        <h2 className="font-display text-3xl font-semibold">Publisert ✨</h2>
        {venue && (
          <p className="mt-1 text-sm text-white/60">Takk for at du delte fra {venue.name}</p>
        )}
      </div>

      <div className="px-6 pt-6">
        <div className="overflow-hidden rounded-3xl bg-white/5 shadow-2xl ring-1 ring-white/10">
          {draft.photoUrl && (
            <img src={draft.photoUrl} alt="" className="aspect-[4/5] w-full object-cover" />
          )}
          <div className="space-y-2 p-5">
            {venue && (
              <div className="flex items-center gap-2 text-sm font-medium text-white/90">
                <MapPin className="h-4 w-4 text-primary" />
                {venue.name}
                {venue.city && <span className="text-white/40">· {venue.city}</span>}
              </div>
            )}
            {sun && <Line emoji={sun.emoji} text={sun.label} />}
            {crowd && <Line emoji={crowd.emoji} text={crowd.label} />}
            {draft.beer && <Line emoji="🍺" text={`${draft.beer} kr`} />}
          </div>
        </div>

        <div className="mt-5 text-center">
          <div className="font-display text-4xl font-bold text-white">
            +{receipt.awardedPoints}p
          </div>
          {levelUp ? (
            <div className="mt-1 text-sm font-medium text-primary">
              Nivå opp! Du er nå {newLevel}
            </div>
          ) : nextThreshold ? (
            <div className="mt-1 text-xs text-white/50">
              {nextThreshold - receipt.newPoints} poeng til neste nivå
            </div>
          ) : null}
          {receipt.errors.length > 0 && (
            <div className="mt-2 text-xs text-white/50">
              Noen ting feilet: {receipt.errors.join(", ")}
            </div>
          )}
        </div>
      </div>

      <div className="mt-auto space-y-2 px-6 pb-[max(env(safe-area-inset-bottom),1.5rem)] pt-6">
        {venue && (
          <ShareVenueButton
            variant="primary"
            venue={{ name: venue.name, slug: venue.slug, id: venue.venueId, city: venue.city }}
            live={{ sun: draft.sun, crowd: draft.crowd, beerPrice: draft.beer }}
          >
            Del med venner
          </ShareVenueButton>
        )}
        <button
          onClick={onDone}
          className="tap-scale w-full rounded-2xl bg-white/10 py-4 text-sm font-medium text-white active:bg-white/20"
        >
          Ferdig
        </button>
      </div>
    </div>
  );
}

function Line({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-white/80">
      <span>{emoji}</span>
      <span>{text}</span>
    </div>
  );
}
