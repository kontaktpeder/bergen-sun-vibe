import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Venue } from "@/lib/domain";

// Inline SVG marker — avoids missing default-icon assets and matches app style.
function makeIcon(opts: { sun: boolean; selected: boolean; trending?: boolean }) {
  const { sun, selected, trending } = opts;
  const fill = sun
    ? "url(#sun-grad)"
    : trending
      ? "url(#pink-grad)"
      : "#1f2937";
  const ring = selected ? "stroke=\"#ffffff\" stroke-width=\"3\"" : "stroke=\"#ffffff\" stroke-width=\"1.5\"";
  const size = selected ? 38 : 30;
  const html = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size + 6}" viewBox="0 0 40 46">
      <defs>
        <linearGradient id="sun-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#fbbf24"/>
          <stop offset="1" stop-color="#f97316"/>
        </linearGradient>
        <linearGradient id="pink-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#ec4899"/>
          <stop offset="1" stop-color="#8b5cf6"/>
        </linearGradient>
      </defs>
      <path d="M20 44 L11 28 A12 12 0 1 1 29 28 Z" fill="${fill}" ${ring}/>
      <circle cx="20" cy="18" r="5" fill="#ffffff" opacity="0.95"/>
      ${sun ? '<circle cx="20" cy="18" r="2.5" fill="#f59e0b"/>' : ""}
    </svg>
  `;
  return L.divIcon({
    html,
    className: "venue-leaflet-marker",
    iconSize: [size, size + 6],
    iconAnchor: [size / 2, size + 6],
  });
}

function FitBounds({ venues }: { venues: Venue[] }) {
  const map = useMap();
  useEffect(() => {
    if (!venues.length) return;
    const bounds = L.latLngBounds(venues.map((v) => [v.lat, v.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15, animate: true });
  }, [map, venues]);
  return null;
}

interface VenueMapProps {
  venues: Venue[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  fallbackCenter: [number, number];
}

export function VenueMap({ venues, selectedId, onSelect, fallbackCenter }: VenueMapProps) {
  const validVenues = useMemo(
    () => venues.filter((v) => Number.isFinite(v.lat) && Number.isFinite(v.lng)),
    [venues],
  );
  const center: [number, number] = validVenues.length
    ? [validVenues[0].lat, validVenues[0].lng]
    : fallbackCenter;
  const markersRef = useRef<Record<string, L.Marker | null>>({});

  // Pan to selected marker when selection changes externally
  function PanToSelected() {
    const map = useMap();
    useEffect(() => {
      const v = validVenues.find((x) => x.id === selectedId);
      if (v) map.panTo([v.lat, v.lng], { animate: true });
    }, [map]);
    return null;
  }

  return (
    <MapContainer
      center={center}
      zoom={13}
      scrollWheelZoom={false}
      zoomControl={false}
      attributionControl={false}
      className="h-full w-full"
      style={{ background: "hsl(var(--secondary))" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <div className="leaflet-bottom leaflet-right pointer-events-none">
        <div className="leaflet-control bg-card/80 px-2 py-0.5 text-[10px] text-muted-foreground rounded-tl-md">
          © OpenStreetMap
        </div>
      </div>
      <FitBounds venues={validVenues} />
      <PanToSelected />
      {validVenues.map((v) => (
        <Marker
          key={v.id}
          position={[v.lat, v.lng]}
          icon={makeIcon({
            sun: v.sunStatus === "sun-now",
            selected: v.id === selectedId,
            trending: v.trending,
          })}
          ref={(ref) => {
            markersRef.current[v.id] = ref;
          }}
          eventHandlers={{
            click: () => onSelect(v.id),
          }}
        />
      ))}
    </MapContainer>
  );
}
