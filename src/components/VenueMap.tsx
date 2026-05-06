import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import type { Venue } from "@/lib/domain";

// Compact, branded marker — smaller than before, with subtle glow for selected.
function makeIcon(opts: { sun: boolean; selected: boolean; trending?: boolean }) {
  const { sun, selected, trending } = opts;
  const fill = sun ? "#f59e0b" : trending ? "#ec4899" : "#0f172a";
  const size = selected ? 22 : 16;
  const shadow = selected
    ? '<circle cx="12" cy="12" r="11" fill="#f59e0b" opacity="0.25"/>'
    : "";
  const html = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">
      ${shadow}
      <circle cx="12" cy="12" r="6" fill="${fill}" stroke="#ffffff" stroke-width="2"/>
    </svg>
  `;
  return L.divIcon({
    html,
    className: "venue-leaflet-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// Custom branded cluster icon
function clusterIcon(cluster: { getChildCount: () => number }) {
  const count = cluster.getChildCount();
  const size = count < 10 ? 32 : count < 50 ? 38 : 44;
  const html = `
    <div style="
      width:${size}px;height:${size}px;
      display:grid;place-items:center;
      border-radius:9999px;
      background:linear-gradient(135deg,#fbbf24,#f97316);
      color:#fff;font-weight:600;font-size:${count < 100 ? 13 : 11}px;
      box-shadow:0 2px 8px rgba(249,115,22,0.35), 0 0 0 3px rgba(255,255,255,0.9);
      font-family:-apple-system,system-ui,sans-serif;
    ">${count}</div>
  `;
  return L.divIcon({
    html,
    className: "venue-cluster-marker",
    iconSize: [size, size],
  });
}

function FitBounds({ venues }: { venues: Venue[] }) {
  const map = useMap();
  const idsKey = venues.map((v) => v.id).sort().join(",");
  useEffect(() => {
    if (!venues.length) return;
    const bounds = L.latLngBounds(venues.map((v) => [v.lat, v.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15, animate: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, idsKey]);
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

  function PanToSelected() {
    const map = useMap();
    const isFirst = useRef(true);
    useEffect(() => {
      const v = validVenues.find((x) => x.id === selectedId);
      if (!v) return;
      if (isFirst.current) {
        // Don't override initial FitBounds on first mount
        isFirst.current = false;
        return;
      }
      map.flyTo([v.lat, v.lng], 17, { animate: true, duration: 0.8 });
    }, [map, selectedId, validVenues]);
    return null;
  }

  return (
    <MapContainer
      center={center}
      zoom={13}
      scrollWheelZoom={false}
      zoomControl={false}
      className="h-full w-full venue-map"
      style={{ background: "hsl(var(--secondary))" }}
    >
      {/* Calmer, premium tile style */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={20}
      />
      <FitBounds venues={validVenues} />
      <PanToSelected />
      <MarkerClusterGroup
        chunkedLoading
        showCoverageOnHover={false}
        spiderfyOnMaxZoom
        maxClusterRadius={50}
        iconCreateFunction={clusterIcon}
      >
        {validVenues.map((v) => (
          <Marker
            key={v.id}
            position={[v.lat, v.lng]}
            icon={makeIcon({
              sun: v.sunStatus === "sun-now",
              selected: v.id === selectedId,
              trending: v.trending,
            })}
            eventHandlers={{
              click: () => onSelect(v.id),
            }}
          />
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
