import { useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuthProfile } from "@/hooks/useAuthProfile";
import { useVenue } from "@/hooks/useVenue";
import { useVenues } from "@/hooks/useVenues";
import { useAddContribution } from "@/hooks/useAddContribution";
import { useUploadImage } from "@/hooks/useUploadImage";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Mode = "menu" | "sun" | "beer" | "photo" | "venue";

export function ContributeFab() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("menu");
  const { isAuthed, user, profile, loading } = useAuthProfile();
  const params = useParams();
  const location = useLocation();
  const isOnVenue = location.pathname.startsWith("/venue/");
  const slug = isOnVenue ? params.id : undefined;
  const { data: currentVenue } = useVenue(slug);
  const { data: venues = [] } = useVenues();

  const [selectedVenueDbId, setSelectedVenueDbId] = useState<string | undefined>(undefined);
  const venueDbId = currentVenue?.dbId ?? selectedVenueDbId;

  const addContribution = useAddContribution(user?.id, profile?.points ?? 0);
  const { upload } = useUploadImage();

  const reset = () => {
    setMode("menu");
    setSelectedVenueDbId(undefined);
  };

  const close = () => {
    setOpen(false);
    setTimeout(reset, 300);
  };

  if (loading) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Bidra"
        className="fixed bottom-24 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-primary to-sunset-pink text-white shadow-float tap-scale"
      >
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </button>

      <Sheet open={open} onOpenChange={(o) => (o ? setOpen(true) : close())}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          {!isAuthed ? (
            <div className="py-6 text-center">
              <SheetHeader>
                <SheetTitle className="text-center">Logg inn for å bidra</SheetTitle>
              </SheetHeader>
              <p className="mt-2 text-sm text-muted-foreground">
                Tjen poeng ved å dele sol, ølpriser og bilder.
              </p>
              <Link to="/auth" onClick={close}>
                <Button className="mt-6 w-full">Logg inn</Button>
              </Link>
            </div>
          ) : mode === "menu" ? (
            <Menu
              onPick={(m) => setMode(m)}
              showVenuePicker={!isOnVenue}
              venues={venues.map((v) => ({ id: v.dbId, name: v.name }))}
              selectedVenueDbId={selectedVenueDbId}
              onPickVenue={setSelectedVenueDbId}
            />
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
                  toast.success(`+${r.awardedPoints} poeng ☀️`);
                  close();
                } catch (e: any) {
                  toast.error(e.message ?? "Noe gikk galt");
                }
              }}
            />
          ) : mode === "beer" ? (
            <BeerForm
              venueId={venueDbId}
              onDone={async (price) => {
                if (!venueDbId) return toast.error("Velg et sted først.");
                try {
                  const r = await addContribution.mutateAsync({
                    type: "beer_price",
                    venueId: venueDbId,
                    data: { price, label: "cheapest" },
                  });
                  toast.success(`+${r.awardedPoints} poeng 🍺`);
                  close();
                } catch (e: any) {
                  toast.error(e.message ?? "Noe gikk galt");
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
                  toast.success(`+${r.awardedPoints} poeng 📸`);
                  close();
                } catch (e: any) {
                  toast.error(e.message ?? "Opplasting feilet");
                }
              }}
            />
          ) : (
            <VenueForm
              onDone={async (data) => {
                try {
                  const r = await addContribution.mutateAsync({ type: "venue_add", data });
                  toast.success(`+${r.awardedPoints} poeng 📍`);
                  close();
                } catch (e: any) {
                  toast.error(e.message ?? "Noe gikk galt");
                }
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

function Menu({
  onPick,
  showVenuePicker,
  venues,
  selectedVenueDbId,
  onPickVenue,
}: {
  onPick: (m: Mode) => void;
  showVenuePicker: boolean;
  venues: { id: string; name: string }[];
  selectedVenueDbId?: string;
  onPickVenue: (id: string) => void;
}) {
  const needsVenue = showVenuePicker && !selectedVenueDbId;
  return (
    <div className="pb-4">
      <SheetHeader>
        <SheetTitle>Hva vil du dele?</SheetTitle>
      </SheetHeader>

      {showVenuePicker && (
        <div className="mt-4">
          <Label className="text-xs uppercase tracking-widest text-muted-foreground">Sted</Label>
          <select
            value={selectedVenueDbId ?? ""}
            onChange={(e) => onPickVenue(e.target.value)}
            className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Velg sted…</option>
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3">
        <ActionCard emoji="☀️" label="Er det sol?" disabled={needsVenue} onClick={() => onPick("sun")} />
        <ActionCard emoji="🍺" label="Ølpris" disabled={needsVenue} onClick={() => onPick("beer")} />
        <ActionCard emoji="📸" label="Bilde" disabled={needsVenue} onClick={() => onPick("photo")} />
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
      <SheetHeader>
        <SheetTitle>Hvordan er det akkurat nå?</SheetTitle>
      </SheetHeader>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <ActionCard emoji="☀️" label="Sol" disabled={!venueId} onClick={() => onDone("sun")} />
        <ActionCard emoji="🌥️" label="Skygge" disabled={!venueId} onClick={() => onDone("shade")} />
      </div>
    </div>
  );
}

function BeerForm({ venueId, onDone }: { venueId?: string; onDone: (price: number) => void }) {
  const [price, setPrice] = useState("");
  return (
    <div className="pb-4">
      <SheetHeader>
        <SheetTitle>Billigste pils</SheetTitle>
      </SheetHeader>
      <div className="mt-4 space-y-2">
        <Label>Pris (kr)</Label>
        <Input type="number" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="79" />
      </div>
      <Button
        className="mt-5 w-full"
        disabled={!venueId || !price}
        onClick={() => onDone(Number(price))}
      >
        Lagre 🍺
      </Button>
    </div>
  );
}

function PhotoForm({ venueId, onDone }: { venueId?: string; onDone: (f: File) => void }) {
  const [file, setFile] = useState<File | null>(null);
  return (
    <div className="pb-4">
      <SheetHeader>
        <SheetTitle>Last opp bilde</SheetTitle>
      </SheetHeader>
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
  const [lat, setLat] = useState("60.39");
  const [lng, setLng] = useState("5.32");

  return (
    <div className="pb-4">
      <SheetHeader>
        <SheetTitle>Legg til nytt sted</SheetTitle>
      </SheetHeader>
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
            className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="bar">Bar</option>
            <option value="cafe">Café</option>
            <option value="restaurant">Restaurant</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Lat</Label>
            <Input value={lat} onChange={(e) => setLat(e.target.value)} />
          </div>
          <div>
            <Label>Lng</Label>
            <Input value={lng} onChange={(e) => setLng(e.target.value)} />
          </div>
        </div>
      </div>
      <Button
        className="mt-5 w-full"
        disabled={!name}
        onClick={() => onDone({ name, lat: Number(lat), lng: Number(lng), category })}
      >
        Legg til 📍
      </Button>
    </div>
  );
}
