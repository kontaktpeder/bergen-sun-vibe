import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents, CircleMarker } from "react-leaflet";
import L, { type LatLngLiteral } from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { LocateFixed, MapPin } from "lucide-react";
import { useUserLocation } from "@/hooks/useUserLocation";
import { toast } from "sonner";

type Mode = "pick" | "view";

type LocationPickerMapProps = {
  initialLat: number;
  initialLng: number;
  city?: string;
  selectedLocation?: { lat: number; lng: number } | null;
  mode: Mode;
  onSelectLocation: (lat: number, lng: number) => void;
  onCancel?: () => void;
};

const pinIcon = L.divIcon({
  className: "venue-picker-marker",
  html: `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
      <defs>
        <filter id="pickshadow" x="-50%" y="-20%" width="200%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/>
        </filter>
      </defs>
      <path filter="url(#pickshadow)" d="M16 2C9.4 2 4 7.4 4 14c0 8.5 12 24 12 24s12-15.5 12-24C28 7.4 22.6 2 16 2z"
        fill="#f97316" stroke="#ffffff" stroke-width="2"/>
      <circle cx="16" cy="14" r="5" fill="#ffffff"/>
    </svg>
  `,
  iconSize: [32, 40],
  iconAnchor: [16, 38],
});

function ClickHandler({
  enabled,
  onPick,
}: {
  enabled: boolean;
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click: (e) => {
      if (!enabled) return;
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function LocateControl({
  mode,
  onLocated,
}: {
  mode: Mode;
  onLocated: (lat: number, lng: number) => void;
}) {
  const map = useMap();
  const { location, loading, error, locate } = useUserLocation();

  useEffect(() => {
    if (!location) return;
    map.flyTo([location.lat, location.lng], 16, { duration: 0.8 });
    if (mode === "pick") onLocated(location.lat, location.lng);
  }, [location, map, mode, onLocated]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  return (
    <button
      type="button"
      onClick={locate}
      disabled={loading}
      className="absolute bottom-3 right-3 z-[500] inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-2 text-xs font-medium shadow-float backdrop-blur transition-colors disabled:opacity-60"
    >
      <LocateFixed className="h-3.5 w-3.5 text-primary" />
      {loading ? "Finner posisjon..." : "Du er her"}
    </button>
  );
}

export function LocationPickerMap({
  initialLat,
  initialLng,
  city,
  selectedLocation,
  mode,
  onSelectLocation,
  onCancel,
}: LocationPickerMapProps) {
  const [draft, setDraft] = useState<{ lat: number; lng: number } | null>(
    selectedLocation ?? null,
  );
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);

  const center: LatLngLiteral = useMemo(
    () =>
      selectedLocation
        ? { lat: selectedLocation.lat, lng: selectedLocation.lng }
        : { lat: initialLat, lng: initialLng },
    [initialLat, initialLng, selectedLocation],
  );

  const active = draft ?? selectedLocation ?? center;

  return (
    <div className="flex flex-col gap-3">
      {mode === "pick" && (
        <p className="text-sm text-muted-foreground">
          Trykk i kartet der stedet ligger.
        </p>
      )}

      <div className="relative h-[55vh] w-full overflow-hidden rounded-2xl border border-border">
        <MapContainer
          center={center}
          zoom={14}
          scrollWheelZoom
          className="h-full w-full"
          style={{ background: "hsl(var(--secondary))" }}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          <ClickHandler
            enabled={mode === "pick"}
            onPick={(lat, lng) => setDraft({ lat, lng })}
          />
          {active && <Marker position={[active.lat, active.lng]} icon={pinIcon} />}
          {userPos && (
            <CircleMarker
              center={[userPos.lat, userPos.lng]}
              radius={7}
              pathOptions={{ color: "#2563eb", fillColor: "#3b82f6", fillOpacity: 0.8, weight: 2 }}
            />
          )}
          <LocateControl
            mode={mode}
            onLocated={(lat, lng) => {
              setUserPos({ lat, lng });
              if (mode === "pick") setDraft({ lat, lng });
            }}
          />
        </MapContainer>
      </div>

      <div className="flex items-center gap-2 rounded-xl bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
        <MapPin className="h-3.5 w-3.5 text-primary" />
        <span>
          {city ? `${city} · ` : ""}
          {active.lat.toFixed(6)}, {active.lng.toFixed(6)}
        </span>
      </div>

      {mode === "pick" && (
        <div className="grid grid-cols-2 gap-2">
          {onCancel && (
            <Button variant="secondary" onClick={onCancel}>
              Avbryt
            </Button>
          )}
          <Button
            className={onCancel ? "" : "col-span-2"}
            disabled={!draft}
            onClick={() => onSelectLocation(active.lat, active.lng)}
          >
            Bruk denne posisjonen
          </Button>
        </div>
      )}
    </div>
  );
}
