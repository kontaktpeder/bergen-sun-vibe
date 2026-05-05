import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search, Sun, Star } from "lucide-react";
import { useVenues } from "@/hooks/useVenues";
import { FilterChips } from "@/components/FilterChips";
import { SunBadge } from "@/components/SunBadge";
import { cn } from "@/lib/utils";

const filters = [
  { id: "all", label: "Alle", emoji: "📍" },
  { id: "sun-now", label: "Sol nå", emoji: "☀️" },
  { id: "deal", label: "Tilbud", emoji: "🏷️" },
  { id: "trending", label: "Trending", emoji: "🔥" },
  { id: "family", label: "Familie", emoji: "👨‍👩‍👧" },
];

const cityOptions = [
  { id: "Bergen", label: "Bergen", emoji: "🏔️" },
  { id: "Oslo", label: "Oslo", emoji: "🏙️" },
];

// Default bounds per city — used as fallback when we have few/no points.
const CITY_BOUNDS: Record<string, { minLat: number; maxLat: number; minLng: number; maxLng: number }> = {
  Bergen: { minLat: 60.378, maxLat: 60.408, minLng: 5.305, maxLng: 5.335 },
  Oslo: { minLat: 59.905, maxLat: 59.935, minLng: 10.72, maxLng: 10.78 },
};

function computeBounds(points: { lat: number; lng: number }[], fallback: typeof CITY_BOUNDS[string]) {
  if (points.length < 2) return fallback;
  const lats = points.map(p => p.lat);
  const lngs = points.map(p => p.lng);
  const pad = 0.002;
  return {
    minLat: Math.min(...lats) - pad,
    maxLat: Math.max(...lats) + pad,
    minLng: Math.min(...lngs) - pad,
    maxLng: Math.max(...lngs) + pad,
  };
}

const Explore = () => {
  const [filter, setFilter] = useState("all");
  const [city, setCity] = useState<"Bergen" | "Oslo">("Bergen");
  const { data: venues = [], isLoading, error } = useVenues();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const cityVenues = useMemo(
    () => venues.filter(v => (v.city ?? "Bergen") === city),
    [venues, city],
  );

  useEffect(() => {
    if (cityVenues.length && !cityVenues.find(v => v.id === selectedId)) {
      setSelectedId(cityVenues[0].id);
    }
  }, [cityVenues, selectedId]);

  const filtered = useMemo(() => {
    let v = cityVenues;
    if (filter === "sun-now") v = v.filter(x => x.sunStatus === "sun-now");
    else if (filter === "deal") v = v.filter(x => x.dealText);
    else if (filter === "trending") v = v.filter(x => x.trending);
    else if (filter === "family") v = v.filter(x => x.familyFriendly);
    if (query) v = v.filter(x => (x.name + x.area + x.tags.join(" ")).toLowerCase().includes(query.toLowerCase()));
    return v;
  }, [filter, query, cityVenues]);

  const bounds = useMemo(
    () => computeBounds(filtered.length ? filtered : cityVenues, CITY_BOUNDS[city]),
    [filtered, cityVenues, city],
  );

  function project(lat: number, lng: number) {
    const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100;
    const y = (1 - (lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 100;
    return { x: Math.max(10, Math.min(90, x)), y: Math.max(40, Math.min(86, y)) };
  }

  const selected = cityVenues.find(v => v.id === selectedId) ?? null;

  return (
    <div className="relative min-h-screen">
      {/* Map */}
      <div className="relative h-[60vh] overflow-hidden bg-secondary">
        {/* Real Leaflet map */}
        <div className="absolute inset-0">
          <VenueMap
            venues={filtered}
            selectedId={selectedId}
            onSelect={setSelectedId}
            fallbackCenter={CITY_CENTERS[city]}
          />
        </div>

        {/* Empty-state overlay when no venues have coords */}
        {filtered.length === 0 && !isLoading && (
          <div className="pointer-events-none absolute inset-0 z-[400] grid place-items-center">
            <div className="rounded-2xl bg-card/95 px-4 py-3 text-center text-sm shadow-card backdrop-blur">
              Ingen steder å vise på kartet
            </div>
          </div>
        )}

        {/* Top bar — z-[500] to sit above Leaflet panes */}
        <div className="absolute inset-x-0 top-0 z-[500] px-5 pt-[max(env(safe-area-inset-top),1rem)]">
          <div className="flex items-center gap-3">
            <Link to="/" className="grid h-10 w-10 place-items-center rounded-full glass shadow-soft tap-scale">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex flex-1 items-center gap-2 rounded-full glass px-4 py-2.5 shadow-soft">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Søk i ${city}...`}
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <div className="mt-3 space-y-2">
            <FilterChips options={cityOptions} active={city} onChange={(id) => setCity(id as "Bergen" | "Oslo")} />
            <FilterChips options={filters} active={filter} onChange={setFilter} />
          </div>
        </div>
      </div>

      {/* Selected card sheet */}
      {selected && (
        <div className="-mt-10 px-5">
          <Link to={`/venue/${selected.id}`} key={selected.id} className="block animate-scale-in">
            <div className="overflow-hidden rounded-3xl bg-card shadow-float">
              <div className="flex gap-3 p-3">
                <img src={selected.image} alt={selected.name} className="h-24 w-24 shrink-0 rounded-2xl object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{selected.category}</span>
                    <span>·</span>
                    <span>{selected.area}</span>
                  </div>
                  <h3 className="mt-0.5 truncate font-display text-lg font-semibold">{selected.name}</h3>
                  <div className="mt-1 flex items-center gap-2 text-sm">
                    <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-sun text-sun" />{selected.rating}</span>
                    <span className="text-muted-foreground">· {"kr".repeat(selected.priceLevel)}</span>
                  </div>
                  <div className="mt-2"><SunBadge status={selected.sunStatus} until={selected.sunUntil} /></div>
                </div>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* List */}
      <section className="mt-6 px-5">
        {isLoading && <div className="text-sm text-muted-foreground">Laster steder…</div>}
        {error && !isLoading && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            Kunne ikke hente steder. Prøv igjen senere.
          </div>
        )}
        {!isLoading && !error && filtered.length === 0 && (
          <div className="rounded-2xl bg-card p-6 text-center shadow-soft">
            <div className="font-display text-lg font-semibold">Ingen treff</div>
            <p className="mt-1 text-sm text-muted-foreground">Prøv et annet filter eller søkeord.</p>
          </div>
        )}
        {!isLoading && !error && filtered.length > 0 && (
          <h2 className="mb-3 font-display text-xl font-semibold">{filtered.length} steder i {city}</h2>
        )}
        <div className="space-y-3">
          {filtered.map((v) => (
            <button
              key={v.id}
              onClick={() => setSelectedId(v.id)}
              className={cn(
                "tap-scale flex w-full items-center gap-3 rounded-2xl bg-card p-2.5 text-left shadow-soft transition-all",
                selectedId === v.id && "ring-2 ring-primary",
              )}
            >
              <img src={v.image} alt={v.name} className="h-16 w-16 shrink-0 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-display text-base font-semibold">{v.name}</div>
                <div className="truncate text-xs text-muted-foreground">{v.area} · {v.category}</div>
                <div className="mt-1"><SunBadge status={v.sunStatus} until={v.sunUntil} /></div>
              </div>
              <div className="shrink-0 text-right">
                <div className="inline-flex items-center gap-1 text-sm"><Star className="h-3.5 w-3.5 fill-sun text-sun" />{v.rating}</div>
                <div className="text-xs text-muted-foreground">{"kr".repeat(v.priceLevel)}</div>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Explore;
