import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Loader2, MapPin } from "lucide-react";
import { MobileSheet } from "@/components/ui/mobile-sheet";
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
        Stedet er lagt til. Gjør det nyttig ved å legge inn bilde, sol eller ølpris.
      </p>
      <div className="mt-5 grid gap-2">
        {success.venueSlug && (
          <Button className="w-full" onClick={onSeeVenue}>
            Se stedet
          </Button>
        )}
        <Button variant="secondary" className="w-full" onClick={onAddPhoto}>
          📸 Legg til bilde
        </Button>
        <Button variant="secondary" className="w-full" onClick={onAddBeer}>
          🍺 Legg til ølpris
        </Button>
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
          Mangler et sted i Bergen? Legg det til så andre kan finne det.
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
  onDone: (d: { name: string; lat: number; lng: number; category: "bar" | "cafe" | "restaurant" }) => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<"bar" | "cafe" | "restaurant">("bar");
  const [lat, setLat] = useState<string>("");
  const [lng, setLng] = useState<string>("");
  const [showManual, setShowManual] = useState(false);
  const [geoState, setGeoState] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [geoErr, setGeoErr] = useState<string | null>(null);

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

  return (
    <div className="pb-4">
      <div className="text-center">
        <h2 className="font-display text-lg font-semibold">Legg til nytt sted</h2>
      </div>
      <div className="mt-4 space-y-3">
        <div>
          <Label>Navn</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="F.eks. Pelikanen" />
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
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={requestLocation}
              className="text-xs font-medium text-primary underline-offset-2 hover:underline"
            >
              Bruk min posisjon
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
      <Button
        className="mt-5 w-full"
        disabled={!name.trim() || !hasCoords}
        onClick={() => {
          const la = Number(lat);
          const ln = Number(lng);
          if (!name.trim()) return toast.error("Navn er påkrevd.");
          if (!Number.isFinite(la) || la < -90 || la > 90) return toast.error("Ugyldig lat.");
          if (!Number.isFinite(ln) || ln < -180 || ln > 180) return toast.error("Ugyldig lng.");
          onDone({ name: name.trim(), lat: la, lng: ln, category });
        }}
      >
        Legg til 📍
      </Button>
    </div>
  );
}
