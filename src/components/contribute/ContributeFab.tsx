import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Loader2, MapPin, Search, Star } from "lucide-react";
import { MobileSheet } from "@/components/ui/mobile-sheet";
import { LocationPickerMap } from "@/components/maps/LocationPickerMap";
import { useAuthProfile } from "@/hooks/useAuthProfile";
import { useVenue } from "@/hooks/useVenue";
import { useAddContribution } from "@/hooks/useAddContribution";
import { useUploadImage } from "@/hooks/useUploadImage";
import { useVenueContributions } from "@/hooks/useVenueContributions";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showRewardFeedback } from "@/lib/reward-feedback";
import { toUserErrorMessage } from "@/lib/error-messages";
import { FLAGS } from "@/lib/flags";
import { subscribeContributeFab } from "@/lib/contribute-bus";
import { useCity } from "@/context/CityContext";
import { inferLegacyCity } from "@/lib/domain";
import { useVenues } from "@/hooks/useVenues";
import { findPossibleDuplicate } from "@/lib/dedupe-venues";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import type { VenueAddPayload } from "@/lib/contribution-types";

const CITY_CENTERS: Record<string, { lat: number; lng: number }> = {
  Bergen: { lat: 60.3913, lng: 5.3221 },
  Oslo: { lat: 59.9139, lng: 10.7522 },
};

type Mode = "menu" | "sun" | "beer" | "photo" | "venue";
type SuccessState = { venueId: string; venueSlug?: string } | null;

export function ContributeFab() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("menu");
  const [success, setSuccess] = useState<SuccessState>(null);
  const { isAuthed, user, profile, loading } = useAuthProfile();
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isOnVenue = location.pathname.startsWith("/venue/");
  const slug = isOnVenue ? params.id : undefined;
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

  const reset = () => {
    setMode("menu");
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

  // Bus subscription: BottomNav + plus opens this sheet
  useEffect(() => {
    return subscribeContributeFab((m) => {
      setOpen(true);
      setMode(m);
    });
  }, []);

  // Deep-link: ?contribute=sun|beer|photo opens sheet in mode (only when on a venue)
  useEffect(() => {
    const c = searchParams.get("contribute");
    if (!c) return;
    if (!["sun", "beer", "photo", "venue"].includes(c)) return;
    setOpen(true);
    setMode(c as Mode);
  }, [searchParams]);

  const beforePoints = profile?.points ?? 0;

  if (loading) return null;

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
                if (success.venueSlug) navigate(`/venue/${success.venueSlug}`);
              }}
              onAddPhoto={() => {
                close();
                if (success.venueSlug) navigate(`/venue/${success.venueSlug}?contribute=photo`);
              }}
              onAddBeer={() => {
                close();
                if (success.venueSlug) navigate(`/venue/${success.venueSlug}?contribute=beer`);
              }}
            />
          ) : mode === "menu" ? (
            <Menu onPick={(m) => setMode(m)} isOnVenue={isOnVenue} />
          ) : mode === "sun" ? (
            <SunForm
              venueId={venueDbId}
              onDone={async (status) => {
                if (!venueDbId) return toast.error("Velg et sted først.");
                try {
                  const r = await addContribution.mutateAsync({
                    type: "sun_report",
                    venueId: venueDbId,
                    data: { status },
                  });
                  showRewardFeedback({
                    type: "sun_report",
                    awardedPoints: r.awardedPoints,
                    beforePoints,
                    afterPoints: r.newPoints,
                  });
                  close();
                } catch (e) {
                  toast.error(toUserErrorMessage(e));
                }
              }}
            />
          ) : mode === "beer" ? (
            <BeerForm
              venueId={venueDbId}
              lastPrice={FLAGS.beerConfirmFlowEnabled ? lastBeer : null}
              onDone={async (price, isConfirm) => {
                if (!venueDbId) return toast.error("Velg et sted først.");
                try {
                  const r = await addContribution.mutateAsync({
                    type: "beer_price",
                    venueId: venueDbId,
                    data: { price, label: "cheapest" },
                    isConfirm,
                  });
                  showRewardFeedback({
                    type: "beer_price",
                    awardedPoints: r.awardedPoints,
                    beforePoints,
                    afterPoints: r.newPoints,
                    isBeerConfirm: isConfirm,
                  });
                  close();
                } catch (e) {
                  toast.error(toUserErrorMessage(e));
                }
              }}
            />
          ) : mode === "photo" ? (
            <PhotoForm
              venueId={venueDbId}
              onDone={async (file) => {
                if (!venueDbId) return toast.error("Velg et sted først.");
                if (!user?.id) return;
                try {
                  const url = await upload(file, user.id);
                  const r = await addContribution.mutateAsync({
                    type: "photo",
                    venueId: venueDbId,
                    data: { image_url: url },
                  });
                  showRewardFeedback({
                    type: "photo",
                    awardedPoints: r.awardedPoints,
                    beforePoints,
                    afterPoints: r.newPoints,
                  });
                  close();
                } catch (e) {
                  toast.error(toUserErrorMessage(e));
                }
              }}
            />
          ) : (
            <VenueForm
              onDone={async (data) => {
                try {
                  const r = await addContribution.mutateAsync({ type: "venue_add", data });
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
                } catch (e) {
                  const raw = e instanceof Error ? e.message : String(e);
                  const dupMatch = raw.match(/duplicate_google_place:([\w-]+)/);
                  if (dupMatch) {
                    const slug = dupMatch[1];
                    toast.error("Stedet finnes allerede", {
                      action: {
                        label: "Åpne",
                        onClick: () => {
                          close();
                          navigate(`/venue/${slug}`);
                        },
                      },
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
  // Global menu = primary action is "add new venue".
  // On a venue page the local module handles sun/beer/photo, so this menu
  // is only used as a fallback (deep-link cleared) — keep simple.
  if (!isOnVenue) {
    return (
      <div className="pb-4">
        <div className="text-center">
          <h2 className="font-display text-lg font-semibold">Legg til nytt sted</h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Mangler et sted? Legg det til så andre kan finne det.
        </p>
        <div className="mt-5 grid">
          <ActionCard emoji="📍" label="Nytt sted" onClick={() => onPick("venue")} />
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          For å rapportere sol, ølpris eller bilde — åpne et sted først.
        </p>
      </div>
    );
  }
  return (
    <div className="pb-4">
      <div className="text-center">
        <h2 className="font-display text-lg font-semibold">Hva vil du dele?</h2>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <ActionCard emoji="☀️" label="Er det sol?" onClick={() => onPick("sun")} />
        <ActionCard emoji="🍺" label="Ølpris" onClick={() => onPick("beer")} />
        <ActionCard emoji="📸" label="Bilde" onClick={() => onPick("photo")} />
        <ActionCard emoji="📍" label="Nytt sted" onClick={() => onPick("venue")} />
      </div>
    </div>
  );
}

function ActionCard({
  emoji,
  label,
  onClick,
  disabled,
}: {
  emoji: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="tap-scale flex h-28 flex-col items-center justify-center gap-2 rounded-2xl bg-card shadow-soft disabled:opacity-50"
    >
      <span className="text-3xl">{emoji}</span>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

function SunForm({ venueId, onDone }: { venueId?: string; onDone: (s: "sun" | "shade") => void }) {
  return (
    <div className="pb-4">
      <div className="text-center">
        <h2 className="font-display text-lg font-semibold">Hvordan er det akkurat nå?</h2>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <ActionCard emoji="☀️" label="Sol" disabled={!venueId} onClick={() => onDone("sun")} />
        <ActionCard emoji="🌥️" label="Skygge" disabled={!venueId} onClick={() => onDone("shade")} />
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
}: {
  onDone: (d: VenueAddPayload) => void;
}) {
  const { currentCity } = useCity();
  const { data: allVenues = [] } = useVenues();
  const cityCenter = CITY_CENTERS[currentCity] ?? CITY_CENTERS.Bergen;
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<"bar" | "cafe" | "restaurant">("bar");
  const [lat, setLat] = useState<string>("");
  const [lng, setLng] = useState<string>("");
  const [showManual, setShowManual] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [geoState, setGeoState] = useState<"idle" | "loading" | "ok" | "error">("idle");
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
    requestLocation();
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
              <div className="text-sm font-medium">Fant vi riktig sted?</div>
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
                            onClick: () => navigate(`/venue/${existing.slug}`),
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
          if (!name.trim()) return toast.error("Navn er påkrevd.");
          if (!Number.isFinite(la) || la < -90 || la > 90) return toast.error("Ugyldig lat.");
          if (!Number.isFinite(ln) || ln < -180 || ln > 180) return toast.error("Ugyldig lng.");
          // Derive city from actual coordinates, not the selected city filter.
          const inferredCity = inferLegacyCity(la, ln);
          if (!inferredCity) {
            return toast.error("Posisjonen er utenfor Bergen og Oslo. Juster plassering på kartet.");
          }
          onDone({ name: name.trim(), lat: la, lng: ln, category, city: inferredCity });
        }}
      >
        Legg til 📍
      </Button>
    </div>
  );
}
