import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Loader2, MapPin, Search, Star } from "lucide-react";
import { MobileSheet } from "@/components/ui/mobile-sheet";
import { LocationPickerMap } from "@/components/maps/LocationPickerMap";
import { useAuthProfile } from "@/hooks/useAuthProfile";
import { useVenue } from "@/hooks/useVenue";
import { useAddContribution } from "@/hooks/useAddContribution";
import { useUploadImage } from "@/hooks/useUploadImage";
import { useVenueContributions } from "@/hooks/useVenueContributions";
import { useUserLocation } from "@/hooks/useUserLocation";
import { useVenueBadges } from "@/hooks/useVenueBadges";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showRewardFeedback } from "@/lib/reward-feedback";
import { showReward } from "@/components/RewardOverlay";
import { toUserErrorMessage } from "@/lib/error-messages";
import { FLAGS } from "@/lib/flags";
import { subscribeContributeFab } from "@/lib/contribute-bus";
import { useCity } from "@/context/CityContext";
import { inferLegacyCity, belongsToCity, type Venue } from "@/lib/domain";
import { useVenues } from "@/hooks/useVenues";
import { useFavorites } from "@/lib/favorites";
import { findPossibleDuplicate } from "@/lib/dedupe-venues";
import { resolveVenueGuess, type VenueGuessResult } from "@/lib/resolveVenueGuess";
import { ConfirmVenueStep } from "@/components/contribute/ConfirmVenueStep";
import { SearchVenueStep } from "@/components/contribute/SearchVenueStep";
import { showCombinedRewardFeedback } from "@/lib/reward-feedback";
import type { PendingPayload } from "@/lib/contribute-pending";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import type { VenueAddPayload, SunStatus, CrowdLevel } from "@/lib/contribution-types";

const CITY_CENTERS: Record<string, { lat: number; lng: number }> = {
  Bergen: { lat: 60.3913, lng: 5.3221 },
  Oslo: { lat: 59.9139, lng: 10.7522 },
};

type Mode =
  | "menu"
  | "search-venue"
  | "confirm-venue"
  | "capture-photo"
  | "sun"
  | "beer"
  | "photo"
  | "venue"
  | "crowd";
type ContribMode = "sun" | "beer" | "photo" | "crowd";

type SuccessState = { venueId: string; venueSlug?: string } | null;

export function ContributeFab() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("menu");
  const [pendingContrib, setPendingContrib] = useState<ContribMode | null>(null);
  const [pendingPayload, setPendingPayload] = useState<PendingPayload | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<SuccessState>(null);
  const { isAuthed, user, profile, loading } = useAuthProfile();
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isOnVenue =
    location.pathname.startsWith("/venue/") || location.pathname.startsWith("/steder/");
  const slug = isOnVenue ? (params.slug ?? params.id) : undefined;
  const { data: currentVenue } = useVenue(slug);

  const venueDbId = currentVenue?.dbId;
  const { data: venueContribs = [] } = useVenueContributions(venueDbId);
  const lastBeer = useMemo(() => {
    const c = venueContribs.find((x) => x.type === "beer_price");
    const p = c?.data?.price as number | string | undefined;
    const n = typeof p === "number" ? p : typeof p === "string" ? Number(p) : NaN;
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [venueContribs]);

  void profile;
  const addContribution = useAddContribution(user?.id);
  const { upload } = useUploadImage();

  // Venue guess data
  const { currentCity } = useCity();
  const { data: allVenues = [] } = useVenues();
  const favs = useFavorites();
  const cityVenues = useMemo(
    () => allVenues.filter((v) => belongsToCity(v, currentCity as "Bergen" | "Oslo")),
    [allVenues, currentCity],
  );
  const cityVenueIds = useMemo(() => cityVenues.map((v) => v.dbId), [cityVenues]);
  const { data: badgeMap = {} } = useVenueBadges(cityVenueIds);
  const { location: userLoc, loading: geoLoading, locate } = useUserLocation();

  const guessResult: VenueGuessResult | null = useMemo(() => {
    if (!userLoc) return null;
    return resolveVenueGuess(
      userLoc.lat,
      userLoc.lng,
      cityVenues,
      favs,
      badgeMap,
    );
  }, [userLoc, cityVenues, favs, badgeMap]);

  // Warm up GPS as soon as menu opens (not on a venue page) — so confirm step is instant
  useEffect(() => {
    if (open && !isOnVenue && !userLoc && !geoLoading) {
      locate();
    }
  }, [open, isOnVenue, userLoc, geoLoading, locate]);

  // Fallback: trigger geolocation when entering confirm step
  useEffect(() => {
    if (mode === "confirm-venue" && !userLoc && !geoLoading) {
      locate();
    }
  }, [mode, userLoc, geoLoading, locate]);

  const reset = () => {
    setMode("menu");
    setPendingContrib(null);
    setPendingPayload(null);
    setSubmitting(false);
    setSuccess(null);
  };

  const close = () => {
    setOpen(false);
    if (searchParams.get("contribute")) {
      searchParams.delete("contribute");
      setSearchParams(searchParams, { replace: true });
    }
    setTimeout(reset, 300);
  };

  const beforePoints = profile?.points ?? 0;
  const [searchQuery, setSearchQuery] = useState("");

  const executePending = useCallback(
    async (
      venueId: string,
      payload: PendingPayload,
    ): Promise<{ awardedPoints: number; newPoints: number }> => {
      if (payload.type === "sun") {
        const r = await addContribution.mutateAsync({
          type: "sun_report",
          venueId,
          data: { status: payload.status },
        });
        return { awardedPoints: r.awardedPoints, newPoints: r.newPoints };
      }
      if (payload.type === "crowd") {
        const r = await addContribution.mutateAsync({
          type: "crowd_report",
          venueId,
          data: { level: payload.level },
        });
        return { awardedPoints: r.awardedPoints, newPoints: r.newPoints };
      }
      if (payload.type === "beer") {
        const r = await addContribution.mutateAsync({
          type: "beer_price",
          venueId,
          data: { price: payload.price, label: "cheapest" },
          isConfirm: payload.isConfirm,
        });
        return { awardedPoints: r.awardedPoints, newPoints: r.newPoints };
      }
      // photo
      if (!user?.id) throw new Error("Du må være innlogget.");
      const url = await upload(payload.file, user.id);
      const r = await addContribution.mutateAsync({
        type: "photo",
        venueId,
        data: { image_url: url },
      });
      return { awardedPoints: r.awardedPoints, newPoints: r.newPoints };
    },
    [addContribution, upload, user?.id],
  );

  const handleSubmitError = useCallback((e: unknown): boolean => {
    const raw = e instanceof Error ? e.message : String(e);
    if (raw.toLowerCase().includes("cooldown")) {
      showReward({
        emoji: "👌",
        title: "Allerede oppdatert",
        subtitle: "Du kan rapportere igjen om noen minutter.",
        variant: "points",
      });
      return true;
    }
    toast.error(toUserErrorMessage(e));
    return true;
  }, []);

  const submitForVenue = useCallback(
    async (venueId: string, payload: PendingPayload) => {
      setSubmitting(true);
      try {
        const r = await executePending(venueId, payload);
        const rewardType =
          payload.type === "sun"
            ? "sun_report"
            : payload.type === "crowd"
              ? "crowd_report"
              : payload.type === "beer"
                ? "beer_price"
                : "photo";
        showRewardFeedback({
          type: rewardType,
          awardedPoints: r.awardedPoints,
          beforePoints,
          afterPoints: r.newPoints,
          isBeerConfirm: payload.type === "beer" ? payload.isConfirm : undefined,
        });
        close();
      } catch (e) {
        handleSubmitError(e);
        close();
      } finally {
        setSubmitting(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [executePending, beforePoints, handleSubmitError],
  );

  const submitNewVenueWithPending = useCallback(
    async (
      data: VenueAddPayload,
      payload: PendingPayload,
    ): Promise<{ ok: true } | { ok: false; handled: boolean }> => {
      setSubmitting(true);
      const startPoints = beforePoints;
      try {
        const venueR = await addContribution.mutateAsync({ type: "venue_add", data });
        if (!venueR.venueId) throw new Error("Kunne ikke opprette stedet.");
        try {
          const reportR = await executePending(venueR.venueId, payload);
          showCombinedRewardFeedback({
            venueName: data.name,
            pending: payload,
            totalPoints: venueR.awardedPoints + reportR.awardedPoints,
            beforePoints: startPoints,
            afterPoints: reportR.newPoints,
          });
        } catch {
          // venue created but pending failed → still acknowledge venue
          showRewardFeedback({
            type: "venue_add",
            awardedPoints: venueR.awardedPoints,
            beforePoints: startPoints,
            afterPoints: venueR.newPoints,
          });
        }
        close();
        return { ok: true };
      } catch (e) {
        return { ok: false, handled: false };
      } finally {
        setSubmitting(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [addContribution, beforePoints, executePending],
  );

  // Bus subscription: BottomNav + plus opens this sheet
  useEffect(() => {
    return subscribeContributeFab((m) => {
      setOpen(true);
      setMode(m);
    });
  }, []);

  // Deep-link: ?contribute=sun|beer|photo|crowd opens sheet in mode (only when on a venue)
  useEffect(() => {
    const c = searchParams.get("contribute");
    if (!c) return;
    if (!["sun", "beer", "photo", "venue", "crowd"].includes(c)) return;
    setOpen(true);
    setMode(c as Mode);
  }, [searchParams]);

  if (loading) return null;

  const stashAndConfirm = (p: PendingPayload) => {
    setPendingPayload(p);
    setMode("confirm-venue");
  };

  return (
    <>
      <MobileSheet open={open} onOpenChange={(o) => (o ? setOpen(true) : close())}>
          {!isAuthed ? (
            <div className="py-6 text-center">
              <div className="text-center">
                <h2 className="font-display text-lg font-semibold">Logg inn for å bidra</h2>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Tjen poeng ved å dele sol, ølpriser og bilder.
              </p>
              <Link to="/auth" onClick={close}>
                <Button className="mt-6 w-full">Logg inn</Button>
              </Link>
            </div>
          ) : success ? (
            <VenueAddSuccess
              success={success}
              onSeeVenue={() => {
                close();
                if (success.venueSlug) navigate(`/steder/${success.venueSlug}`);
              }}
              onAddPhoto={() => {
                close();
                if (success.venueSlug) navigate(`/steder/${success.venueSlug}?contribute=photo`);
              }}
              onAddBeer={() => {
                close();
                if (success.venueSlug) navigate(`/steder/${success.venueSlug}?contribute=beer`);
              }}
            />
          ) : mode === "menu" ? (
            <Menu
              isOnVenue={isOnVenue}
              onPick={(m) => {
                if (isOnVenue) {
                  setMode(m);
                  return;
                }
                setPendingContrib(m as ContribMode);
                if (m === "photo") {
                  setMode("capture-photo");
                } else {
                  setMode(m);
                }
              }}
            />
          ) : mode === "capture-photo" ? (
            <CapturePhotoStep
              onPicked={(file) => stashAndConfirm({ type: "photo", file })}
              onBack={() => setMode("menu")}
            />
          ) : mode === "confirm-venue" ? (
            <ConfirmVenueStep
              result={guessResult}
              loading={geoLoading || (!userLoc && !guessResult)}
              title={confirmTitleFor(pendingPayload)}
              onConfirm={(venue) => {
                if (!pendingPayload || submitting) return;
                void submitForVenue(venue.dbId, pendingPayload);
              }}
              onChangeVenue={() => setMode("search-venue")}
              onExplore={() => {
                close();
                navigate("/explore");
              }}
            />
          ) : mode === "search-venue" ? (
            <SearchVenueStep
              venues={cityVenues}
              favorites={favs}
              userLoc={userLoc}
              query={searchQuery}
              onQueryChange={setSearchQuery}
              onPick={(venue) => {
                if (pendingPayload) {
                  void submitForVenue(venue.dbId, pendingPayload);
                } else {
                  close();
                  navigate(`/steder/${venue.id}?contribute=${pendingContrib}`);
                }
              }}
              onAddVenue={() => setMode("venue")}
              onBack={() => setMode(pendingPayload ? "confirm-venue" : "menu")}
            />
          ) : mode === "sun" ? (
            <SunForm
              venueId={venueDbId ?? "global"}
              onDone={async (status) => {
                if (isOnVenue && venueDbId) {
                  await submitForVenue(venueDbId, { type: "sun", status });
                } else {
                  stashAndConfirm({ type: "sun", status });
                }
              }}
            />
          ) : mode === "crowd" ? (
            <CrowdForm
              venueId={venueDbId ?? "global"}
              onDone={async (level) => {
                if (isOnVenue && venueDbId) {
                  await submitForVenue(venueDbId, { type: "crowd", level });
                } else {
                  stashAndConfirm({ type: "crowd", level });
                }
              }}
            />
          ) : mode === "beer" ? (
            <BeerForm
              venueId={venueDbId ?? "global"}
              lastPrice={isOnVenue && FLAGS.beerConfirmFlowEnabled ? lastBeer : null}
              onDone={async (price, isConfirm) => {
                if (isOnVenue && venueDbId) {
                  await submitForVenue(venueDbId, { type: "beer", price, isConfirm });
                } else {
                  stashAndConfirm({ type: "beer", price, isConfirm });
                }
              }}
            />
          ) : mode === "photo" ? (
            <PhotoForm
              venueId={venueDbId}
              onDone={async (file) => {
                if (!venueDbId) return toast.error("Velg et sted først.");
                await submitForVenue(venueDbId, { type: "photo", file });
              }}
            />
          ) : (
            <VenueForm
              initialCoords={userLoc ? { lat: userLoc.lat, lng: userLoc.lng } : undefined}
              onDone={async (data) => {
                const submitWithPending = async (payload: VenueAddPayload) => {
                  if (pendingPayload) {
                    await submitNewVenueWithPending(payload, pendingPayload);
                    return;
                  }
                  const r = await addContribution.mutateAsync({ type: "venue_add", data: payload });
                  showRewardFeedback({
                    type: "venue_add",
                    awardedPoints: r.awardedPoints,
                    beforePoints,
                    afterPoints: r.newPoints,
                  });
                  if (FLAGS.venueAddSuccessStateEnabled && r.venueId) {
                    setSuccess({ venueId: r.venueId, venueSlug: r.venueSlug });
                  } else {
                    close();
                  }
                };

                const handleDupSlug = async (dupSlug: string) => {
                  if (!pendingPayload) return false;
                  const existing = cityVenues.find((v) => v.id === dupSlug);
                  if (!existing) return false;
                  try {
                    const r = await executePending(existing.dbId, pendingPayload);
                    showCombinedRewardFeedback({
                      venueName: existing.name,
                      pending: pendingPayload,
                      totalPoints: r.awardedPoints,
                      beforePoints,
                      afterPoints: r.newPoints,
                    });
                    close();
                    return true;
                  } catch {
                    return false;
                  }
                };

                try {
                  await submitWithPending(data);
                } catch (e) {
                  const raw = e instanceof Error ? e.message : String(e);

                  const dupGoogle = raw.match(/duplicate_google_place:([\w-]+)/);
                  if (dupGoogle) {
                    const dupSlug = dupGoogle[1];
                    if (await handleDupSlug(dupSlug)) return;
                    toast.error("Stedet finnes allerede", {
                      action: {
                        label: "Åpne",
                        onClick: () => {
                          close();
                          navigate(`/steder/${dupSlug}`);
                        },
                      },
                    });
                    return;
                  }

                  const dupClose = raw.match(/duplicate_venue_close:([\w-]+):(.+)$/);
                  if (dupClose) {
                    const dupSlug = dupClose[1];
                    const name = dupClose[2];
                    if (await handleDupSlug(dupSlug)) return;
                    toast.error(`"${name}" finnes allerede her i nærheten`, {
                      action: {
                        label: "Åpne",
                        onClick: () => {
                          close();
                          navigate(`/steder/${dupSlug}`);
                        },
                      },
                    });
                    return;
                  }

                  const confirmDistinct = raw.match(/confirm_distinct_required:([\w-]+):(.+)$/);
                  if (confirmDistinct) {
                    const name = confirmDistinct[2];
                    toast("Et sted med lignende navn finnes i byen", {
                      description: `"${name}" finnes allerede et annet sted. Er dette et annet sted?`,
                      action: {
                        label: "Ja, legg til",
                        onClick: async () => {
                          try {
                            await submitWithPending({ ...data, confirm_distinct: true });
                          } catch (err) {
                            toast.error(toUserErrorMessage(err));
                          }
                        },
                      },
                      duration: 10000,
                    });
                    return;
                  }

                  toast.error(toUserErrorMessage(e));
                }
              }}
            />
          )}
      </MobileSheet>
    </>
  );
}

function CapturePhotoStep({
  onPicked,
  onBack,
}: {
  onPicked: (file: File) => void;
  onBack: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.click(), 100);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="pb-4 text-center">
      <h2 className="font-display text-lg font-semibold">Ta et bilde</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Vis hvordan det er der du er nå.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPicked(f);
        }}
      />
      <div className="mt-5 grid gap-2">
        <Button className="w-full" onClick={() => inputRef.current?.click()}>
          📸 Åpne kamera
        </Button>
        <Button variant="ghost" className="w-full" onClick={onBack}>
          Tilbake
        </Button>
      </div>
    </div>
  );
}

function VenueAddSuccess({
  success,
  onSeeVenue,
  onAddPhoto,
  onAddBeer,
}: {
  success: { venueId: string; venueSlug?: string };
  onSeeVenue: () => void;
  onAddPhoto: () => void;
  onAddBeer: () => void;
}) {
  return (
    <div className="pb-4 text-center">
      <div className="text-center">
        <h2 className="font-display text-lg font-semibold">Stedet er lagt til 🎉</h2>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Steder med bilde får langt flere besøk. Legg til ett nå – det tar 10 sekunder.
      </p>
      <div className="mt-5 grid gap-2">
        <Button className="w-full" onClick={onAddPhoto}>
          📸 Legg til bilde nå
        </Button>
        <Button variant="secondary" className="w-full" onClick={onAddBeer}>
          🍺 Legg til ølpris
        </Button>
        {success.venueSlug && (
          <button
            onClick={onSeeVenue}
            className="mt-1 text-xs font-medium text-muted-foreground underline-offset-2 hover:underline"
          >
            Hopp over – se stedet
          </button>
        )}
      </div>
    </div>
  );
}

function Menu({ onPick, isOnVenue }: { onPick: (m: Mode) => void; isOnVenue: boolean }) {
  return (
    <div className="pb-4">
      <div className="text-center">
        <h2 className="font-display text-lg font-semibold">Del nå</h2>
        <p className="mt-1 text-sm text-muted-foreground">Hva vil du dele?</p>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <ActionCard emoji="📸" label="Del bilde" onClick={() => onPick("photo")} />
        <ActionCard emoji="☀️" label="Solrapport" onClick={() => onPick("sun")} />
        <ActionCard emoji="🙂" label="Stemning" onClick={() => onPick("crowd")} />
        <ActionCard emoji="🍺" label="Ølpris" onClick={() => onPick("beer")} />
      </div>
      {!isOnVenue && (
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Velg deretter hvilket sted oppdateringen gjelder.
        </p>
      )}
    </div>
  );
}

function PickVenueStep({
  contrib,
  onPick,
  onExplore,
  onBack,
}: {
  contrib: ContribMode | null;
  onPick: (venue: Venue) => void;
  onExplore: () => void;
  onBack: () => void;
}) {
  const favs = useFavorites();
  const { currentCity } = useCity();
  const { data: allVenues = [] } = useVenues();
  const saved = allVenues.filter(
    (v) => favs.includes(v.id) && belongsToCity(v, currentCity as "Bergen" | "Oslo"),
  );

  const title: Record<ContribMode, string> = {
    sun: "Hvor vil du rapportere sol?",
    crowd: "Hvor vil du rapportere folk?",
    beer: "Hvor vil du legge inn ølpris?",
    photo: "Hvor vil du legge til bilde?",
  };

  return (
    <div className="pb-4">
      <div className="text-center">
        <h2 className="font-display text-lg font-semibold">
          {contrib ? title[contrib] : "Velg sted"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Velg fra dine lagrede steder, eller finn et sted i kartet.
        </p>
      </div>

      {saved.length === 0 ? (
        <div className="mt-5 rounded-2xl bg-secondary/60 p-5 text-center">
          <p className="text-sm text-muted-foreground">
            Du har ingen lagrede steder ennå. Finn et sted i kartet og lagre det først.
          </p>
          <Button className="mt-4 w-full" onClick={onExplore}>
            Åpne kart
          </Button>
        </div>
      ) : (
        <>
          <ul className="mt-4 max-h-[55vh] space-y-2 overflow-y-auto">
            {saved.map((v) => (
              <li key={v.id}>
                <button
                  onClick={() => onPick(v)}
                  className="tap-scale flex w-full items-center gap-3 rounded-2xl bg-card p-3 text-left shadow-soft"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-secondary">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{v.name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {v.area || v.city}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
          <Button variant="secondary" className="mt-4 w-full" onClick={onExplore}>
            Finn et annet sted i kartet
          </Button>
        </>
      )}

      <button
        onClick={onBack}
        className="mt-3 w-full text-center text-xs text-muted-foreground underline-offset-2 hover:underline"
      >
        Tilbake
      </button>
    </div>
  );
}

function ActionCard({
  emoji,
  label,
  onClick,
  disabled,
  selected,
}: {
  emoji: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  selected?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "tap-scale flex h-28 flex-col items-center justify-center gap-2 rounded-2xl shadow-soft transition-all duration-200 disabled:opacity-50",
        selected
          ? "scale-95 border-2 border-primary bg-gradient-to-br from-primary/15 to-sunset-pink/15"
          : "bg-card"
      )}
    >
      <span className="text-3xl">{emoji}</span>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

function SunForm({ venueId, onDone }: { venueId?: string; onDone: (s: SunStatus) => void }) {
  const [selected, setSelected] = useState<SunStatus | null>(null);
  const handle = (s: SunStatus) => {
    if (!venueId) return;
    setSelected(s);
    setTimeout(() => onDone(s), 350);
  };
  return (
    <div className="pb-4">
      <div className="text-center">
        <h2 className="font-display text-lg font-semibold">Hvordan er sola akkurat nå?</h2>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <ActionCard emoji="☀️" label="Sol nå" disabled={!venueId} selected={selected === "sun"} onClick={() => handle("sun")} />
        <ActionCard emoji="⛅" label="Delvis sol" disabled={!venueId} selected={selected === "partial"} onClick={() => handle("partial")} />
        <ActionCard emoji="🌇" label="Sol på vei ned" disabled={!venueId} selected={selected === "going_down"} onClick={() => handle("going_down")} />
        <ActionCard emoji="🌥️" label="Skygge" disabled={!venueId} selected={selected === "shade"} onClick={() => handle("shade")} />
      </div>
    </div>
  );
}

function CrowdForm({ venueId, onDone }: { venueId?: string; onDone: (l: CrowdLevel) => void }) {
  const [selected, setSelected] = useState<CrowdLevel | null>(null);
  const handle = (l: CrowdLevel) => {
    if (!venueId) return;
    setSelected(l);
    setTimeout(() => onDone(l), 350);
  };
  return (
    <div className="pb-4">
      <div className="text-center">
        <h2 className="font-display text-lg font-semibold">Hvordan er stemningen?</h2>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-3">
        <ActionCard emoji="😌" label="Rolig" disabled={!venueId} selected={selected === "quiet"} onClick={() => handle("quiet")} />
        <ActionCard emoji="🙂" label="Litt liv" disabled={!venueId} selected={selected === "some"} onClick={() => handle("some")} />
        <ActionCard emoji="🔥" label="Fullt / livlig" disabled={!venueId} selected={selected === "full"} onClick={() => handle("full")} />
      </div>
    </div>
  );
}

function BeerForm({
  venueId,
  lastPrice,
  onDone,
}: {
  venueId?: string;
  lastPrice: number | null;
  onDone: (price: number, isConfirm: boolean) => void;
}) {
  // overview shown only if there's an existing price
  const [editing, setEditing] = useState<boolean>(lastPrice == null);
  const [price, setPrice] = useState("");

  const submitNew = () => {
    const n = Number(price);
    if (!Number.isFinite(n) || n <= 0 || n > 1000) {
      toast.error("Ugyldig pris (1–1000 kr).");
      return;
    }
    onDone(n, false);
  };

  if (!editing && lastPrice != null) {
    return (
      <div className="pb-4">
        <div className="text-center">
          <h2 className="font-display text-lg font-semibold">Billigste pils</h2>
        </div>
        <div className="mt-4 rounded-2xl bg-secondary/60 p-4 text-center">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            Sist registrerte pris
          </div>
          <div className="mt-1 font-display text-3xl font-semibold">kr {lastPrice}</div>
        </div>
        <div className="mt-5 grid gap-2">
          <Button className="w-full" disabled={!venueId} onClick={() => onDone(lastPrice, true)}>
            Bekreft at {lastPrice} kr stemmer ✓ +3p
          </Button>
          <Button variant="secondary" className="w-full" onClick={() => setEditing(true)}>
            Endre pris
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-4">
      <div className="text-center">
        <h2 className="font-display text-lg font-semibold">Ny ølpris</h2>
      </div>
      <div className="mt-4 space-y-2">
        <Label>Pris (kr)</Label>
        <Input
          type="number"
          inputMode="numeric"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="79"
        />
      </div>
      <div className="mt-5 grid gap-2">
        <Button className="w-full" disabled={!venueId} onClick={submitNew}>
          Send ny pris 🍺 +10p
        </Button>
        {lastPrice != null && (
          <Button variant="ghost" className="w-full" onClick={() => setEditing(false)}>
            Tilbake
          </Button>
        )}
      </div>
    </div>
  );
}

function PhotoForm({ venueId, onDone }: { venueId?: string; onDone: (f: File) => void }) {
  const [file, setFile] = useState<File | null>(null);
  return (
    <div className="pb-4">
      <div className="text-center">
        <h2 className="font-display text-lg font-semibold">Last opp bilde</h2>
      </div>
      <Input
        type="file"
        accept="image/*"
        className="mt-4"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />
      <Button className="mt-5 w-full" disabled={!venueId || !file} onClick={() => file && onDone(file)}>
        Last opp 📸
      </Button>
    </div>
  );
}

function VenueForm({
  onDone,
  initialCoords,
}: {
  onDone: (d: VenueAddPayload) => void;
  initialCoords?: { lat: number; lng: number };
}) {
  const { currentCity } = useCity();
  const { data: allVenues = [] } = useVenues();
  const cityCenter = CITY_CENTERS[currentCity] ?? CITY_CENTERS.Bergen;
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<"bar" | "cafe" | "restaurant">("bar");
  const [lat, setLat] = useState<string>(initialCoords ? initialCoords.lat.toFixed(6) : "");
  const [lng, setLng] = useState<string>(initialCoords ? initialCoords.lng.toFixed(6) : "");
  const [showManual, setShowManual] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [geoState, setGeoState] = useState<"idle" | "loading" | "ok" | "error">(
    initialCoords ? "ok" : "idle",
  );
  const [geoErr, setGeoErr] = useState<string | null>(null);

  type PlaceCandidate = {
    name: string;
    formatted_address: string | null;
    google_place_id: string;
    google_maps_uri: string | null;
    rating: number | null;
    user_rating_count: number | null;
    lat: number | null;
    lng: number | null;
  };
  type ExistingPlace = { google_place_id: string; venue_id: string; slug: string; name: string };
  const [searchingPlaces, setSearchingPlaces] = useState(false);
  const [placeCandidates, setPlaceCandidates] = useState<PlaceCandidate[]>([]);
  const [existingByPlaceId, setExistingByPlaceId] = useState<ExistingPlace[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceCandidate | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [searchedOnce, setSearchedOnce] = useState(false);

  const searchGooglePlace = async () => {
    if (!name.trim()) {
      toast.error("Skriv inn navn først.");
      return;
    }
    setSearchingPlaces(true);
    try {
      const la = Number(lat);
      const ln = Number(lng);
      const { data, error } = await supabase.functions.invoke("search-google-place", {
        body: {
          name: name.trim(),
          city: currentCity,
          lat: Number.isFinite(la) ? la : undefined,
          lng: Number.isFinite(ln) ? ln : undefined,
        },
      });
      if (error) throw error;
      const candidates = (data?.matches ?? []) as PlaceCandidate[];
      const existing = (data?.existingByPlaceId ?? []) as ExistingPlace[];
      setPlaceCandidates(candidates);
      setExistingByPlaceId(existing);
      setSearchedOnce(true);
      if (selectedPlace) {
        const stillExists = candidates.find(
          (c) => c.google_place_id === selectedPlace.google_place_id,
        );
        if (!stillExists) setSelectedPlace(null);
      }
    } catch {
      toast.error("Kunne ikke søke i Google akkurat nå.");
    } finally {
      setSearchingPlaces(false);
    }
  };


  const possibleDup = useMemo(() => {
    const la = Number(lat);
    const ln = Number(lng);
    if (!name.trim() || !Number.isFinite(la) || !Number.isFinite(ln)) return null;
    return findPossibleDuplicate(allVenues, name, la, ln, 50);
  }, [allVenues, name, lat, lng]);

  const requestLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoState("error");
      setGeoErr("Posisjon ikke tilgjengelig. Skriv inn manuelt.");
      setShowManual(true);
      return;
    }
    setGeoState("loading");
    setGeoErr(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setGeoState("ok");
      },
      (err) => {
        setGeoState("error");
        setGeoErr(err.message || "Kunne ikke hente posisjon");
        setShowManual(true);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30_000 },
    );
  };

  useEffect(() => {
    if (!initialCoords) requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasCoords = lat !== "" && lng !== "";
  const selectedLocation = hasCoords
    ? { lat: Number(lat), lng: Number(lng) }
    : null;

  if (showMapPicker) {
    // Default center: existing pick, or current city center.
    const initial = selectedLocation ?? cityCenter;
    return (
      <div className="pb-4">
        <div className="text-center">
          <h2 className="font-display text-lg font-semibold">Velg posisjon på kart</h2>
        </div>
        <div className="mt-4">
          <LocationPickerMap
            mode="pick"
            initialLat={initial.lat}
            initialLng={initial.lng}
            city={currentCity}
            selectedLocation={selectedLocation}
            onCancel={() => setShowMapPicker(false)}
            onSelectLocation={(la, ln) => {
              setLat(la.toFixed(6));
              setLng(ln.toFixed(6));
              setGeoState("ok");
              setShowMapPicker(false);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="pb-4">
      <div className="text-center">
        <h2 className="font-display text-lg font-semibold">Legg til nytt sted</h2>
      </div>
      <div className="mt-4 space-y-3">
        <div>
          <Label>Navn</Label>
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (selectedPlace && e.target.value.trim() !== selectedPlace.name) {
                setSelectedPlace(null);
              }
            }}
            placeholder="F.eks. Pelikanen"
          />
        </div>

        {/* Google Places lookup */}
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-medium">Er dette riktig sted?</div>
              <div className="text-xs text-muted-foreground">
                Søk i Google for bedre kvalitet og færre duplikater.
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={searchGooglePlace}
              disabled={searchingPlaces || !name.trim()}
              className="shrink-0"
            >
              {searchingPlaces ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span className="ml-1.5">{searchingPlaces ? "Søker…" : "Søk"}</span>
            </Button>
          </div>

          {searchedOnce && placeCandidates.length === 0 && !searchingPlaces && (
            <div className="mt-3 text-xs text-muted-foreground">
              Ingen treff i Google. Du kan legge inn manuelt under.
            </div>
          )}

          {placeCandidates.length > 0 && (
            <div className="mt-3 space-y-2">
              {placeCandidates.map((p) => {
                const existing = existingByPlaceId.find(
                  (e) => e.google_place_id === p.google_place_id,
                );
                const isSelected = selectedPlace?.google_place_id === p.google_place_id;
                return (
                  <button
                    key={p.google_place_id}
                    type="button"
                    onClick={() => {
                      if (existing) {
                        toast.error("Stedet finnes allerede", {
                          action: {
                            label: "Åpne",
                            onClick: () => navigate(`/steder/${existing.slug}`),
                          },
                        });
                        return;
                      }
                      setSelectedPlace(p);
                      setManualMode(false);
                      if (typeof p.lat === "number" && typeof p.lng === "number") {
                        setLat(p.lat.toFixed(6));
                        setLng(p.lng.toFixed(6));
                        setGeoState("ok");
                      }
                    }}
                    className={cn(
                      "w-full rounded-lg border p-3 text-left transition-colors",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : existing
                        ? "border-amber-300/60 bg-amber-50/60 dark:bg-amber-950/30"
                        : "border-border hover:bg-secondary/50",
                    )}
                  >
                    <div className="text-sm font-medium">{p.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.formatted_address ?? "Ingen adresse"}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      {p.rating != null ? (
                        <span className="inline-flex items-center gap-1">
                          <Star className="h-3 w-3 fill-current text-amber-500" />
                          {p.rating} ({p.user_rating_count ?? 0})
                        </span>
                      ) : (
                        <span>Ingen rating</span>
                      )}
                      {existing && (
                        <span className="ml-auto text-amber-700 dark:text-amber-300">
                          Finnes allerede – trykk for å åpne
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => {
                  setSelectedPlace(null);
                  setManualMode(true);
                }}
                className="text-xs font-medium text-muted-foreground underline-offset-2 hover:underline"
              >
                Legg inn manuelt i stedet
              </button>
            </div>
          )}
        </div>

        <div>
          <Label>Kategori</Label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as never)}
            className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3"
          >
            <option value="bar">Bar</option>
            <option value="cafe">Café</option>
            <option value="restaurant">Restaurant</option>
          </select>
        </div>

        <div className="rounded-xl bg-secondary/60 p-3 text-sm">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            {geoState === "loading" && (
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Henter posisjon…
              </span>
            )}
            {geoState === "ok" && hasCoords && (
              <span>
                Posisjon: <span className="font-medium">{lat}, {lng}</span>
              </span>
            )}
            {geoState === "error" && (
              <span className="text-destructive">{geoErr ?? "Posisjon mislyktes"}</span>
            )}
            {geoState === "idle" && <span className="text-muted-foreground">Ingen posisjon enda</span>}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-2">
            <button
              type="button"
              onClick={requestLocation}
              className="text-xs font-medium text-primary underline-offset-2 hover:underline"
            >
              Bruk min posisjon
            </button>
            <button
              type="button"
              onClick={() => setShowMapPicker(true)}
              className="text-xs font-medium text-primary underline-offset-2 hover:underline"
            >
              🗺️ Velg på kart
            </button>
            <button
              type="button"
              onClick={() => setShowManual((v) => !v)}
              className="text-xs font-medium text-muted-foreground underline-offset-2 hover:underline"
            >
              {showManual ? "Skjul manuell justering" : "Juster manuelt"}
            </button>
          </div>
        </div>

        {showManual && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Lat</Label>
              <Input value={lat} onChange={(e) => setLat(e.target.value)} placeholder="60.39" />
            </div>
            <div>
              <Label>Lng</Label>
              <Input value={lng} onChange={(e) => setLng(e.target.value)} placeholder="5.32" />
            </div>
          </div>
        )}
      </div>
      {possibleDup && (
        <div className="mt-3 rounded-xl border border-amber-300/50 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          <div className="font-medium">Dette stedet finnes kanskje allerede?</div>
          <div className="mt-0.5 text-xs opacity-90">
            Vi fant <span className="font-semibold">{possibleDup.name}</span> like ved.
          </div>
        </div>
      )}
      <Button
        className="mt-5 w-full"
        disabled={!name.trim() || !hasCoords}
        onClick={() => {
          const la = Number(lat);
          const ln = Number(lng);
          const finalName = (selectedPlace?.name ?? name).trim();
          if (!finalName) return toast.error("Navn er påkrevd.");
          if (!Number.isFinite(la) || la < -90 || la > 90) return toast.error("Ugyldig lat.");
          if (!Number.isFinite(ln) || ln < -180 || ln > 180) return toast.error("Ugyldig lng.");
          const inferredCity = inferLegacyCity(la, ln);
          if (!inferredCity) {
            return toast.error("Posisjonen er utenfor Bergen og Oslo. Juster plassering på kartet.");
          }
          const payload: VenueAddPayload = selectedPlace
            ? {
                name: finalName,
                lat: la,
                lng: ln,
                category,
                city: inferredCity,
                google_place_id: selectedPlace.google_place_id,
                google_maps_url: selectedPlace.google_maps_uri ?? undefined,
                address: selectedPlace.formatted_address ?? undefined,
                google_rating: selectedPlace.rating ?? undefined,
                google_user_rating_count: selectedPlace.user_rating_count ?? undefined,
                source: "google",
              }
            : {
                name: finalName,
                lat: la,
                lng: ln,
                category,
                city: inferredCity,
                source: "manual",
              };
          // Suppress unused warning during MVP
          void manualMode;
          onDone(payload);
        }}
      >
        {selectedPlace ? "Legg til fra Google ✨" : "Legg til 📍"}
      </Button>
    </div>
  );
}
