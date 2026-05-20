import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { X, Camera, Loader2, MapPin, ChevronRight, ImagePlus } from "lucide-react";
import { useAuthProfile } from "@/hooks/useAuthProfile";
import { useAddContribution } from "@/hooks/useAddContribution";
import { useUploadImage } from "@/hooks/useUploadImage";
import { useUserLocation } from "@/hooks/useUserLocation";
import { useVenues } from "@/hooks/useVenues";
import { useFavorites } from "@/lib/favorites";
import { useVenueBadges } from "@/hooks/useVenueBadges";
import { useVenue } from "@/hooks/useVenue";
import { useCity } from "@/context/CityContext";
import { belongsToCity, type Venue } from "@/lib/domain";
import { resolveVenueGuess, formatDistance } from "@/lib/resolveVenueGuess";
import { distanceMeters } from "@/lib/dedupe-venues";
import { subscribeShareNow, type ShareNowContext } from "@/lib/share-bus";

import {
  getActiveVenue,
  setActiveVenue,
  clearActiveVenue,
  touchActiveVenue,
} from "@/lib/activeVenueSession";
import { flyPoints, PointsFlyupHost } from "@/components/share/PointsFlyup";
import { ShareReceiptStep, type ReceiptData } from "@/components/share/ShareReceiptStep";
import { getLevel } from "@/lib/levels";
import { showReward } from "@/components/RewardOverlay";
import { toast } from "sonner";
import { toUserErrorMessage } from "@/lib/error-messages";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LocationPickerMap } from "@/components/maps/LocationPickerMap";
import type { SunStatus, CrowdLevel } from "@/lib/contribution-types";
import { POINTS } from "@/lib/contribution-types";

type Step =
  | "camera"
  | "venue-confirm"
  | "sun"
  | "crowd"
  | "beer"
  | "venue-pick"
  | "add-venue"
  | "pick-location"
  | "publish"
  | "submitting"
  | "receipt";

type AddVenueDraft = {
  name: string;
  category: "bar" | "cafe" | "restaurant";
  address: string;
  lat?: number;
  lng?: number;
  locationSource?: "gps" | "manual";
};

interface Draft {
  photo?: File;
  photoUrl?: string;
  sun?: SunStatus;
  crowd?: CrowdLevel;
  beer?: number;
  venue?: { venueId: string; slug?: string; name: string };
}

const SUN_OPTS: { value: SunStatus; emoji: string; label: string }[] = [
  { value: "sun", emoji: "☀️", label: "Full sol" },
  { value: "partial", emoji: "⛅", label: "Delvis" },
  { value: "going_down", emoji: "🌇", label: "På vei ned" },
  { value: "shade", emoji: "🌥️", label: "Skygge" },
];

const CROWD_OPTS: { value: CrowdLevel; emoji: string; label: string }[] = [
  { value: "quiet", emoji: "😌", label: "Rolig" },
  { value: "some", emoji: "🙂", label: "Litt folk" },
  { value: "full", emoji: "🔥", label: "Fullt" },
];

const BEER_OPTS = [69, 89, 99, 119, 129, 149];

function vibrate(ms = 8) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(ms);
    } catch {
      /* noop */
    }
  }
}

export function ShareNowOverlay() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("camera");
  const [draft, setDraft] = useState<Draft>({});
  const [ctx, setCtx] = useState<ShareNowContext>({});
  const [addVenueDraft, setAddVenueDraft] = useState<AddVenueDraft>({
    name: "",
    category: "bar",
    address: "",
  });

  const { isAuthed, user, profile } = useAuthProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const isOnVenuePage =
    location.pathname.startsWith("/steder/") || location.pathname.startsWith("/venue/");
  const slugFromRoute = isOnVenuePage ? (params.slug ?? params.id) : undefined;
  const { data: routeVenue } = useVenue(slugFromRoute);

  const { currentCity } = useCity();
  const { data: allVenues = [] } = useVenues();
  const { favorites } = useFavorites();
  const cityVenues = useMemo(
    () => allVenues.filter((v) => belongsToCity(v, currentCity as "Bergen" | "Oslo")),
    [allVenues, currentCity],
  );
  const cityVenueIds = useMemo(() => cityVenues.map((v) => v.dbId), [cityVenues]);
  const { data: badgeMap = {} } = useVenueBadges(cityVenueIds);
  const { location: userLoc, locate } = useUserLocation();

  const addContribution = useAddContribution(user?.id);
  const { upload } = useUploadImage();

  // Open via bus
  useEffect(() => {
    return subscribeShareNow((newCtx) => {
      if (!isAuthed) {
        navigate("/auth");
        return;
      }

      // Determine venue context
      let fromVenue = newCtx.fromVenue;
      // If we're on a venue page and bus didn't say which, infer from route
      if (!fromVenue && isOnVenuePage && routeVenue) {
        fromVenue = {
          venueId: routeVenue.dbId,
          slug: routeVenue.id,
          name: routeVenue.name,
        };
      }

      const active = getActiveVenue();
      const startStep: Step = (() => {
        if (fromVenue) {
          // Same as active session → skip confirm
          if (active && active.venueId === fromVenue.venueId) {
            return newCtx.startAt ?? "camera";
          }
          // Different or no session → confirm
          return "venue-confirm";
        }
        return newCtx.startAt ?? "camera";
      })();

      setCtx({ ...newCtx, fromVenue });
      setDraft({
        venue: fromVenue && active?.venueId === fromVenue.venueId ? active : active ?? undefined,
      });
      setStep(startStep);
      setOpen(true);
      if (!userLoc) locate();
    });
  }, [isAuthed, navigate, isOnVenuePage, routeVenue, userLoc, locate]);

  const close = useCallback(() => {
    setOpen(false);
    setTimeout(() => {
      setDraft({});
      setStep("camera");
      setCtx({});
      setAddVenueDraft({ name: "", category: "bar", address: "" });
    }, 250);
  }, []);

  // Guess based on geo when reaching venue-pick
  const guess = useMemo(() => {
    if (!userLoc) return null;
    return resolveVenueGuess(userLoc.lat, userLoc.lng, cityVenues, favorites, badgeMap);
  }, [userLoc, cityVenues, favorites, badgeMap]);

  const setChip = (k: keyof Draft, v: unknown, points: number, next: Step) => {
    vibrate();
    setDraft((d) => ({ ...d, [k]: v }));
    flyPoints(points);
    setTimeout(() => setStep(next), 250);
  };

  const skipTo = (next: Step) => {
    vibrate(4);
    setStep(next);
  };

  // Compute estimated points
  const estPoints = useMemo(() => {
    let p = 0;
    if (draft.photo) p += POINTS.photo;
    if (draft.sun) p += POINTS.sun_report;
    if (draft.crowd) p += POINTS.crowd_report;
    if (draft.beer) p += POINTS.beer_price;
    return p;
  }, [draft]);

  const publish = useCallback(async () => {
    if (!draft.venue || !user?.id) {
      toast.error("Velg et sted først.");
      setStep("venue-pick");
      return;
    }
    if (estPoints === 0) {
      toast.error("Velg minst én ting å dele.");
      return;
    }
    setStep("submitting");
    const beforePoints = profile?.points ?? 0;
    let total = 0;
    let latestNewPoints = beforePoints;
    const errors: string[] = [];

    try {
      if (draft.photo) {
        try {
          const url = await upload(draft.photo, user.id);
          const r = await addContribution.mutateAsync({
            type: "photo",
            venueId: draft.venue.venueId,
            data: { image_url: url },
          });
          total += r.awardedPoints;
          latestNewPoints = r.newPoints;
        } catch (e) {
          if (!/cooldown/i.test(String(e))) errors.push("Bilde");
        }
      }
      if (draft.sun) {
        try {
          const r = await addContribution.mutateAsync({
            type: "sun_report",
            venueId: draft.venue.venueId,
            data: { status: draft.sun },
          });
          total += r.awardedPoints;
          latestNewPoints = r.newPoints;
        } catch (e) {
          if (!/cooldown/i.test(String(e))) errors.push("Sol");
        }
      }
      if (draft.crowd) {
        try {
          const r = await addContribution.mutateAsync({
            type: "crowd_report",
            venueId: draft.venue.venueId,
            data: { level: draft.crowd },
          });
          total += r.awardedPoints;
          latestNewPoints = r.newPoints;
        } catch (e) {
          if (!/cooldown/i.test(String(e))) errors.push("Stemning");
        }
      }
      if (draft.beer) {
        try {
          const r = await addContribution.mutateAsync({
            type: "beer_price",
            venueId: draft.venue.venueId,
            data: { price: draft.beer, label: "cheapest" },
          });
          total += r.awardedPoints;
          latestNewPoints = r.newPoints;
        } catch (e) {
          if (!/cooldown/i.test(String(e))) errors.push("Pils");
        }
      }

      setActiveVenue(draft.venue);
      touchActiveVenue();

      if (total > 0) {
        flyPoints(total);
        const oldLevel = getLevel(beforePoints);
        const newLevel = getLevel(latestNewPoints);
        const nextThreshold = getNextLevelThreshold(latestNewPoints);
        const subtitle = oldLevel !== newLevel
          ? `Nivå opp! Du er nå ${newLevel}`
          : nextThreshold
            ? `${nextThreshold - latestNewPoints} poeng til neste nivå`
            : undefined;
        showReward({
          emoji: "✨",
          title: `Delt fra ${draft.venue.name}`,
          subtitle,
          points: total,
          variant: oldLevel !== newLevel ? "levelup" : "points",
        });
      } else if (errors.length === 0) {
        toast.success("Takk for bidraget!");
      }

      if (errors.length > 0) {
        toast.error(`Noen ting feilet: ${errors.join(", ")}`);
      }
      close();
    } catch (e) {
      toast.error(toUserErrorMessage(e));
      setStep("publish");
    }
  }, [draft, user?.id, profile?.points, addContribution, upload, close, estPoints]);

  if (!open) return <PointsFlyupHost />;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl text-white animate-fade-in">
        {/* Top bar */}
        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-2 px-4 pt-[max(env(safe-area-inset-top),0.75rem)] pb-2">
          <button
            onClick={close}
            aria-label="Lukk"
            className="tap-scale grid h-10 w-10 place-items-center rounded-full bg-white/10 active:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
          {draft.venue && step !== "venue-confirm" && step !== "venue-pick" && (
            <button
              onClick={() => skipTo("venue-pick")}
              className="tap-scale flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium active:bg-white/20"
            >
              <MapPin className="h-3.5 w-3.5" />
              {draft.venue.name}
              <span className="text-white/60">· bytt</span>
            </button>
          )}
          {estPoints > 0 && step !== "submitting" && (
            <span className="rounded-full bg-gradient-to-br from-primary to-sunset-pink px-3 py-1.5 text-xs font-bold shadow-lg">
              +{estPoints}p
            </span>
          )}
        </div>

        {/* Steps */}
        <div className="flex h-full flex-col">
          {step === "venue-confirm" && ctx.fromVenue && (
            <VenueConfirmStep
              name={ctx.fromVenue.name}
              onYes={() => {
                if (!ctx.fromVenue) return;
                setActiveVenue(ctx.fromVenue);
                setDraft((d) => ({ ...d, venue: ctx.fromVenue }));
                setStep("camera");
              }}
              onOther={() => {
                clearActiveVenue();
                setDraft((d) => ({ ...d, venue: undefined }));
                setStep("venue-pick");
              }}
            />
          )}

          {step === "camera" && (
            <CameraStep
              onPicked={(file) => {
                setDraft((d) => ({ ...d, photo: file, photoUrl: URL.createObjectURL(file) }));
                flyPoints(POINTS.photo);
                setStep("sun");
              }}
              onSkip={() => skipTo("sun")}
            />
          )}


          {step === "sun" && (
            <ChipStep
              title="Hvordan er sola?"
              points={POINTS.sun_report}
              options={SUN_OPTS}
              selected={draft.sun}
              onPick={(v) => setChip("sun", v, POINTS.sun_report, "crowd")}
              onSkip={() => skipTo("crowd")}
            />
          )}

          {step === "crowd" && (
            <ChipStep
              title="Hvor mye folk?"
              points={POINTS.crowd_report}
              options={CROWD_OPTS}
              selected={draft.crowd}
              onPick={(v) => setChip("crowd", v, POINTS.crowd_report, "beer")}
              onSkip={() => skipTo("beer")}
            />
          )}

          {step === "beer" && (
            <BeerStep
              selected={draft.beer}
              onPick={(price) => setChip("beer", price, POINTS.beer_price, draft.venue ? "publish" : "venue-pick")}
              onSkip={() => skipTo(draft.venue ? "publish" : "venue-pick")}
            />
          )}

          {step === "venue-pick" && (
            <VenuePickStep
              guess={guess}
              venues={cityVenues}
              userLoc={userLoc}
              onPick={(v) => {
                const venue = { venueId: v.dbId, slug: v.id, name: v.name };
                setActiveVenue(venue);
                setDraft((d) => ({ ...d, venue }));
                setStep("publish");
              }}
              onAddNew={() => {
                setAddVenueDraft((d) => {
                  if (d.lat != null && d.lng != null) return d;
                  if (userLoc) {
                    return { ...d, lat: userLoc.lat, lng: userLoc.lng, locationSource: "gps" };
                  }
                  return d;
                });
                setStep("add-venue");
              }}
            />
          )}

          {step === "add-venue" && (
            <AddVenueStep
              value={addVenueDraft}
              onChange={setAddVenueDraft}
              city={currentCity as "Bergen" | "Oslo"}
              onBack={() => setStep("venue-pick")}
              onPickLocation={() => setStep("pick-location")}
              onSubmit={async () => {
                if (addVenueDraft.lat == null || addVenueDraft.lng == null) return;
                setStep("submitting");
                const beforePoints = profile?.points ?? 0;
                const payload = {
                  name: addVenueDraft.name.trim(),
                  lat: addVenueDraft.lat,
                  lng: addVenueDraft.lng,
                  category: addVenueDraft.category,
                  city: currentCity as "Bergen" | "Oslo",
                  address: addVenueDraft.address.trim() || undefined,
                };
                try {
                  const r = await addContribution.mutateAsync({
                    type: "venue_add",
                    data: payload,
                  });
                  const latestNewPoints = r.newPoints;
                  if (r.venueId) {
                    const venue = { venueId: r.venueId, slug: r.venueSlug, name: payload.name };
                    setActiveVenue(venue);
                    setDraft((d) => ({ ...d, venue }));
                    flyPoints(r.awardedPoints);
                    setStep("publish");
                  } else {
                    // Fallback: no venueId returned — end flow cleanly, do NOT stub.
                    console.warn("[ShareNow] venue_add returned no venueId", { payload, r });
                    const oldLevel = getLevel(beforePoints);
                    const newLevel = getLevel(latestNewPoints);
                    showReward({
                      emoji: "🎉",
                      title: "Stedet er sendt inn",
                      subtitle:
                        oldLevel !== newLevel
                          ? `Nivå opp! Du er nå ${newLevel}`
                          : "Vi gjør det klart om et øyeblikk",
                      points: r.awardedPoints,
                      variant: oldLevel !== newLevel ? "levelup" : "points",
                    });
                    close();
                  }
                } catch (e) {
                  toast.error(toUserErrorMessage(e));
                  setStep("add-venue");
                }
              }}
            />
          )}

          {step === "pick-location" && (
            <PickLocationStep
              initial={
                addVenueDraft.lat != null && addVenueDraft.lng != null
                  ? { lat: addVenueDraft.lat, lng: addVenueDraft.lng }
                  : userLoc
              }
              city={currentCity as string}
              onCancel={() => setStep("add-venue")}
              onConfirm={(lat, lng) => {
                setAddVenueDraft((d) => ({ ...d, lat, lng, locationSource: "manual" }));
                setStep("add-venue");
              }}
            />
          )}




          {step === "publish" && (
            <PublishStep
              draft={draft}
              estPoints={estPoints}
              onPublish={publish}
              onChangeVenue={() => setStep("venue-pick")}
            />
          )}

          {step === "submitting" && (
            <div className="flex flex-1 flex-col items-center justify-center gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm text-white/70">Publiserer…</p>
            </div>
          )}
        </div>
      </div>
      <PointsFlyupHost />
    </>
  );
}

// ---------- Steps ----------

function StepHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="pt-20 px-6 text-center">
      <h2 className="font-display text-2xl font-semibold">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-white/60">{subtitle}</p>}
    </div>
  );
}

function SkipFooter({ label = "Hopp over", onClick }: { label?: string; onClick: () => void }) {
  return (
    <div className="px-6 pb-[max(env(safe-area-inset-bottom),1.5rem)] pt-4">
      <button
        onClick={onClick}
        className="tap-scale w-full rounded-2xl py-4 text-sm font-medium text-white/60 active:text-white/90"
      >
        {label}
      </button>
    </div>
  );
}

function VenueConfirmStep({
  name,
  onYes,
  onOther,
}: {
  name: string;
  onYes: () => void;
  onOther: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <StepHeader title={`Er du på ${name} nå?`} />
      <div className="mt-auto space-y-3 px-6 pb-[max(env(safe-area-inset-bottom),1.5rem)]">
        <button
          onClick={onYes}
          className="tap-scale w-full rounded-2xl bg-gradient-to-br from-primary to-sunset-pink py-5 text-base font-semibold text-white shadow-float"
        >
          Ja, jeg er her
        </button>
        <button
          onClick={onOther}
          className="tap-scale w-full rounded-2xl bg-white/10 py-5 text-base font-medium text-white active:bg-white/20"
        >
          Velg annet sted
        </button>
      </div>
    </div>
  );
}

function CameraStep({
  onPicked,
  onSkip,
}: {
  onPicked: (file: File) => void;
  onSkip: () => void;
}) {
  const camRef = useRef<HTMLInputElement>(null);
  const galRef = useRef<HTMLInputElement>(null);

  // Auto-open camera on mount
  useEffect(() => {
    const t = setTimeout(() => camRef.current?.click(), 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex flex-1 flex-col">
      <StepHeader title="Vis hvordan det er" subtitle="Ta et bilde – eller hopp over" />
      <div className="flex flex-1 items-center justify-center px-6">
        <button
          onClick={() => camRef.current?.click()}
          className="tap-scale grid h-44 w-44 place-items-center rounded-full bg-gradient-to-br from-primary to-sunset-pink shadow-[0_20px_60px_-10px_rgba(255,80,120,0.6)]"
          aria-label="Åpne kamera"
        >
          <Camera className="h-16 w-16 text-white" strokeWidth={2} />
        </button>
      </div>
      <input
        ref={camRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPicked(f);
        }}
      />
      <input
        ref={galRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPicked(f);
        }}
      />
      <div className="px-6 pb-2">
        <button
          onClick={() => galRef.current?.click()}
          className="tap-scale mx-auto flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white active:bg-white/20"
        >
          <ImagePlus className="h-4 w-4" />
          Velg fra galleri
        </button>
      </div>
      <SkipFooter label="Hopp over bilde" onClick={onSkip} />
    </div>
  );
}

function AddVenueStep({
  value,
  onChange,
  city,
  onBack,
  onPickLocation,
  onSubmit,
}: {
  value: AddVenueDraft;
  onChange: (updater: (d: AddVenueDraft) => AddVenueDraft) => void;
  city: "Bergen" | "Oslo";
  onBack: () => void;
  onPickLocation: () => void;
  onSubmit: () => void;
}) {
  const hasLocation = value.lat != null && value.lng != null;
  const canSubmit = value.name.trim().length >= 2 && hasLocation;

  const CATS: { value: "bar" | "cafe" | "restaurant"; emoji: string; label: string }[] = [
    { value: "bar", emoji: "🍻", label: "Bar" },
    { value: "cafe", emoji: "☕", label: "Kafé" },
    { value: "restaurant", emoji: "🍽️", label: "Restaurant" },
  ];

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <StepHeader title="Legg til nytt sted" subtitle={`I ${city}`} />
      <div className="flex-1 space-y-5 px-6 pt-6">
        <div>
          <label className="mb-2 block text-xs uppercase tracking-wider text-white/50">
            Hva heter stedet?
          </label>
          <Input
            autoFocus
            value={value.name}
            onChange={(e) => onChange((d) => ({ ...d, name: e.target.value }))}
            placeholder="Stedets navn"
            className="border-white/20 bg-white/10 text-white placeholder:text-white/40"
          />
        </div>
        <div>
          <label className="mb-2 block text-xs uppercase tracking-wider text-white/50">Type</label>
          <div className="grid grid-cols-3 gap-2">
            {CATS.map((c) => (
              <button
                key={c.value}
                onClick={() => onChange((d) => ({ ...d, category: c.value }))}
                className={cn(
                  "tap-scale rounded-2xl py-4 text-center transition-colors",
                  value.category === c.value
                    ? "bg-gradient-to-br from-primary to-sunset-pink"
                    : "bg-white/10 active:bg-white/20",
                )}
              >
                <div className="text-2xl">{c.emoji}</div>
                <div className="mt-1 text-xs font-medium">{c.label}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs uppercase tracking-wider text-white/50">
            Plassering
          </label>
          <button
            type="button"
            onClick={onPickLocation}
            className="tap-scale flex w-full items-center gap-3 rounded-2xl bg-white/10 p-4 text-left active:bg-white/20"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10">
              <MapPin className="h-4 w-4 text-primary" />
            </span>
            <div className="min-w-0 flex-1">
              {hasLocation ? (
                <>
                  <div className="text-sm font-medium text-white">
                    {value.locationSource === "manual"
                      ? "Valgt på kart"
                      : "Bruker din posisjon"}
                  </div>
                  <div className="truncate text-xs text-white/50">
                    {value.lat!.toFixed(5)}, {value.lng!.toFixed(5)}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-sm font-medium text-white">Velg plassering på kart</div>
                  <div className="text-xs text-white/50">Vi trenger å vite hvor stedet ligger</div>
                </>
              )}
            </div>
            <span className="text-xs font-medium text-primary">
              {hasLocation ? "Endre" : "Velg"}
            </span>
          </button>
        </div>

        <div>
          <label className="mb-2 block text-xs uppercase tracking-wider text-white/50">
            Adresse (valgfritt)
          </label>
          <Input
            value={value.address}
            onChange={(e) => onChange((d) => ({ ...d, address: e.target.value }))}
            placeholder="Gateadresse"
            className="border-white/20 bg-white/10 text-white placeholder:text-white/40"
          />
        </div>

        {!hasLocation && (
          <p className="text-xs text-white/60">Velg plassering først.</p>
        )}
      </div>
      <div className="space-y-2 px-6 pb-[max(env(safe-area-inset-bottom),1.5rem)] pt-4">
        <button
          disabled={!canSubmit}
          onClick={onSubmit}
          className="tap-scale w-full rounded-2xl bg-gradient-to-br from-primary to-sunset-pink py-5 text-base font-semibold text-white shadow-float disabled:opacity-50"
        >
          Legg til og fortsett
        </button>
        <button
          onClick={onBack}
          className="tap-scale w-full rounded-2xl bg-white/10 py-4 text-sm font-medium text-white active:bg-white/20"
        >
          Tilbake
        </button>
      </div>
    </div>
  );
}

function PickLocationStep({
  initial,
  city,
  onCancel,
  onConfirm,
}: {
  initial: { lat: number; lng: number } | null;
  city: string;
  onCancel: () => void;
  onConfirm: (lat: number, lng: number) => void;
}) {
  // Fallback center: Bergen / Oslo if no initial location
  const fallback =
    city === "Oslo" ? { lat: 59.9139, lng: 10.7522 } : { lat: 60.3913, lng: 5.3221 };
  const start = initial ?? fallback;

  return (
    <div className="flex flex-1 flex-col">
      <StepHeader title="Velg plassering" subtitle="Dra kartet eller trykk for å sette pin" />
      <div className="flex-1 px-4 pt-4 pb-[max(env(safe-area-inset-bottom),1rem)]">
        <div className="rounded-3xl bg-white p-3 text-foreground shadow-2xl">
          <LocationPickerMap
            initialLat={start.lat}
            initialLng={start.lng}
            city={city}
            selectedLocation={initial ?? undefined}
            mode="pick"
            onSelectLocation={(lat, lng) => onConfirm(lat, lng)}
            onCancel={onCancel}
          />
        </div>
      </div>
    </div>
  );
}



function ChipStep<T extends string>({
  title,
  points,
  options,
  selected,
  onPick,
  onSkip,
}: {
  title: string;
  points: number;
  options: { value: T; emoji: string; label: string }[];
  selected?: T;
  onPick: (v: T) => void;
  onSkip: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <StepHeader title={title} />
      <div className="flex flex-1 flex-col justify-center gap-3 px-6">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onPick(opt.value)}
            className={cn(
              "tap-scale flex items-center gap-4 rounded-2xl px-5 py-5 text-left transition-colors",
              selected === opt.value
                ? "bg-gradient-to-r from-primary/40 to-sunset-pink/30 ring-2 ring-white"
                : "bg-white/10 active:bg-white/20",
            )}
          >
            <span className="text-3xl leading-none">{opt.emoji}</span>
            <span className="flex-1 text-lg font-medium">{opt.label}</span>
            <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-bold">
              +{points}
            </span>
          </button>
        ))}
      </div>
      <SkipFooter onClick={onSkip} />
    </div>
  );
}

function BeerStep({
  selected,
  onPick,
  onSkip,
}: {
  selected?: number;
  onPick: (price: number) => void;
  onSkip: () => void;
}) {
  const [custom, setCustom] = useState("");
  return (
    <div className="flex flex-1 flex-col">
      <StepHeader title="Billigste pils?" subtitle="Velg en pris eller skriv inn" />
      <div className="flex flex-1 flex-col px-6 pt-6">
        <div className="grid grid-cols-3 gap-3">
          {BEER_OPTS.map((p) => (
            <button
              key={p}
              onClick={() => onPick(p)}
              className={cn(
                "tap-scale rounded-2xl py-5 text-center transition-colors",
                selected === p
                  ? "bg-gradient-to-br from-primary to-sunset-pink"
                  : "bg-white/10 active:bg-white/20",
              )}
            >
              <div className="font-display text-xl font-bold">{p}</div>
              <div className="text-[10px] uppercase tracking-wider text-white/60">kr</div>
            </button>
          ))}
        </div>
        <div className="mt-6 flex items-center gap-2">
          <Input
            type="number"
            inputMode="numeric"
            placeholder="Egen pris"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            className="border-white/20 bg-white/10 text-white placeholder:text-white/40"
          />
          <Button
            disabled={!custom || Number(custom) <= 0}
            onClick={() => {
              const n = Number(custom);
              if (n > 0 && n < 1000) onPick(n);
            }}
            className="bg-white text-black hover:bg-white/90"
          >
            OK
          </Button>
        </div>
      </div>
      <SkipFooter onClick={onSkip} />
    </div>
  );
}

function VenuePickStep({
  guess,
  venues,
  userLoc,
  onPick,
  onAddNew,
}: {
  guess: ReturnType<typeof resolveVenueGuess> | null;
  venues: Venue[];
  userLoc: { lat: number; lng: number } | null;
  onPick: (v: Venue) => void;
  onAddNew: () => void;
}) {
  const [query, setQuery] = useState("");
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q) {
      return venues
        .filter((v) => (v.name + " " + (v.area ?? "")).toLowerCase().includes(q))
        .slice(0, 10)
        .map((v) => ({
          venue: v,
          distanceM: userLoc ? distanceMeters(userLoc.lat, userLoc.lng, v.lat, v.lng) : null,
        }));
    }
    if (guess && guess.candidates.length > 0) {
      return guess.candidates.map((c) => ({ venue: c.venue, distanceM: c.distanceM }));
    }
    return venues.slice(0, 8).map((v) => ({ venue: v, distanceM: null as number | null }));
  }, [query, venues, userLoc, guess]);

  return (
    <div className="flex flex-1 flex-col">
      <StepHeader title="Hvor er du?" />
      <div className="px-6 pt-5">
        <Input
          autoFocus
          placeholder="Søk etter sted…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="border-white/20 bg-white/10 text-white placeholder:text-white/40"
        />
      </div>
      <ul className="mt-4 flex-1 space-y-2 overflow-y-auto px-6">
        {list.map(({ venue, distanceM }) => (
          <li key={venue.id}>
            <button
              onClick={() => onPick(venue)}
              className="tap-scale flex w-full items-center gap-3 rounded-2xl bg-white/10 p-3 text-left active:bg-white/20"
            >
              <span className="grid h-10 w-10 place-items-center rounded-full bg-white/10">
                <MapPin className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{venue.name}</div>
                <div className="truncate text-xs text-white/50">
                  {distanceM != null ? formatDistance(distanceM) : venue.area || venue.city}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-white/40" />
            </button>
          </li>
        ))}
      </ul>
      <div className="px-6 pb-[max(env(safe-area-inset-bottom),1.5rem)] pt-3">
        <button
          onClick={onAddNew}
          className="tap-scale w-full rounded-2xl border-2 border-dashed border-white/30 py-4 text-sm font-medium text-white/80"
        >
          + Fant du ikke stedet? Legg det til
        </button>
      </div>
    </div>
  );
}

function PublishStep({
  draft,
  estPoints,
  onPublish,
  onChangeVenue,
}: {
  draft: Draft;
  estPoints: number;
  onPublish: () => void;
  onChangeVenue: () => void;
}) {
  const sun = SUN_OPTS.find((o) => o.value === draft.sun);
  const crowd = CROWD_OPTS.find((o) => o.value === draft.crowd);

  return (
    <div className="flex flex-1 flex-col">
      <StepHeader title="Klar til å dele?" />
      <div className="flex-1 px-6 pt-5">
        <div className="overflow-hidden rounded-3xl bg-white/5 shadow-2xl ring-1 ring-white/10">
          {draft.photoUrl && (
            <img src={draft.photoUrl} alt="" className="aspect-[4/5] w-full object-cover" />
          )}
          <div className="space-y-2 p-5">
            {draft.venue && (
              <button
                onClick={onChangeVenue}
                className="flex w-full items-center gap-2 text-left text-sm font-medium text-white/90"
              >
                <MapPin className="h-4 w-4 text-primary" />
                {draft.venue.name}
                <span className="text-xs text-white/40">· endre</span>
              </button>
            )}
            {sun && <Line emoji={sun.emoji} text={sun.label} />}
            {crowd && <Line emoji={crowd.emoji} text={crowd.label} />}
            {draft.beer && <Line emoji="🍺" text={`${draft.beer} kr`} />}
            {!draft.photoUrl && !sun && !crowd && !draft.beer && (
              <p className="text-sm text-white/50">Ingenting valgt. Gå tilbake for å legge til.</p>
            )}
          </div>
        </div>
      </div>
      <div className="px-6 pb-[max(env(safe-area-inset-bottom),1.5rem)] pt-4">
        <button
          onClick={onPublish}
          disabled={estPoints === 0 || !draft.venue}
          className="tap-scale w-full rounded-2xl bg-gradient-to-br from-primary to-sunset-pink py-5 text-base font-bold text-white shadow-float disabled:opacity-50"
        >
          Publiser · +{estPoints}p
        </button>
      </div>
    </div>
  );
}

function Line({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-white/90">
      <span className="text-base">{emoji}</span>
      <span>{text}</span>
    </div>
  );
}
