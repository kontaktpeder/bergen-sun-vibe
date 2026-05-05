import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, LocateFixed, Search, Star } from "lucide-react";
import { toast } from "sonner";
import { useVenues } from "@/hooks/useVenues";
import { useUserLocation } from "@/hooks/useUserLocation";
import { FilterChips } from "@/components/FilterChips";
import { SunBadge } from "@/components/SunBadge";
import { VenueMap } from "@/components/VenueMap";
import { VenueImage } from "@/components/VenueImage";
import { useCity, type City } from "@/context/CityContext";
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

const CITY_CENTERS: Record<string, [number, number]> = {
  Bergen: [60.3913, 5.3221],
  Oslo: [59.9139, 10.7522],
};

const Explore = () => {
  const [filter, setFilter] = useState("all");
  const { currentCity: city, setCurrentCity } = useCity();
  const { data: venues = [], isLoading, error } = useVenues();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const { location: userLoc, loading: locLoading, error: locError, locate } = useUserLocation();

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

  const selected = cityVenues.find(v => v.id === selectedId) ?? null;

  useEffect(() => {
    if (locError) toast.error(locError);
  }, [locError]);

  useEffect(() => {
    if (!userLoc || !cityVenues.length) return;
    let best: { id: string; d: number } | null = null;
    for (const v of cityVenues) {
      const dLat = v.lat - userLoc.lat;
      const dLng = v.lng - userLoc.lng;
      const d = dLat * dLat + dLng * dLng;
      if (!best || d < best.d) best = { id: v.id, d };
    }
    if (best) setSelectedId(best.id);
  }, [userLoc, cityVenues]);

  return (
    <div className="relative min-h-screen">
      {/* Map — fyller mer av skjermen for app-feel */}
      <div className="relative h-[82vh] overflow-hidden bg-secondary">
        <div className="absolute inset-0">
          <VenueMap
            venues={filtered}
            selectedId={selectedId}
            onSelect={setSelectedId}
            fallbackCenter={CITY_CENTERS[city]}
          />
        </div>

        {filtered.length === 0 && !isLoading && (
          <div className="pointer-events-none absolute inset-0 z-[400] grid place-items-center">
            <div className="rounded-2xl bg-card/95 px-4 py-3 text-center text-sm shadow-card backdrop-blur">
              Ingen steder å vise på kartet
            </div>
          </div>
        )}

        {/* Bottom fade slik at flytende kort hviler mykt over kartet */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[450] h-32 bg-gradient-to-b from-transparent via-background/30 to-background/80" />

        {/* Kompakt topbar: tilbake + søk + by-toggle på én linje */}
        <div className="absolute inset-x-0 top-0 z-[500] px-3 pt-[max(env(safe-area-inset-top),0.75rem)]">
          <div className="flex items-center gap-2">
            <Link to="/" className="grid h-9 w-9 shrink-0 place-items-center rounded-full glass shadow-soft tap-scale">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex flex-1 items-center gap-2 rounded-full glass px-3 py-2 shadow-soft">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Søk i ${city}...`}
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex shrink-0 items-center rounded-full glass p-0.5 shadow-soft">
              {cityOptions.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setCurrentCity(opt.id as City)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                    city === opt.id ? "bg-foreground text-background" : "text-muted-foreground"
                  )}
                  aria-label={opt.label}
                >
                  {opt.emoji}
                </button>
              ))}
            </div>
          </div>
          {/* Filter-chips horisontalt scrollbar — tar ikke ekstra rad-plass */}
          <div className="mt-2 -mx-3 overflow-x-auto px-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <FilterChips options={filters} active={filter} onChange={setFilter} />
          </div>
        </div>

        {/* Floating "Du er her" knapp */}
        <button
          type="button"
          onClick={locate}
          disabled={locLoading}
          className={cn(
            "tap-scale absolute right-3 z-[550] inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-2 text-xs font-medium shadow-float backdrop-blur transition-all disabled:opacity-60",
            selected ? "bottom-[140px]" : "bottom-3"
          )}
          aria-label="Finn min posisjon"
        >
          <LocateFixed className="h-3.5 w-3.5 text-primary" />
          {locLoading ? "Finner posisjon..." : "Du er her"}
        </button>

        {/* Valgt sted som flytende kort nederst i kart-arealet */}
        {selected && (
          <div className="absolute inset-x-3 bottom-3 z-[600]">
            <Link to={`/venue/${selected.id}`} key={selected.id} className="block animate-scale-in">
              <div className="overflow-hidden rounded-2xl bg-card/95 shadow-float backdrop-blur">
                <div className="flex gap-3 p-2.5">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                    <VenueImage venue={selected} size={{ w: 200, h: 200 }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span>{selected.category}</span>
                      <span>·</span>
                      <span className="truncate">{selected.area}</span>
                    </div>
                    <h3 className="mt-0.5 truncate font-display text-base font-semibold">{selected.name}</h3>
                    <div className="mt-0.5 flex items-center gap-2 text-xs">
                      <span className="inline-flex items-center gap-1"><Star className="h-3 w-3 fill-sun text-sun" />{selected.rating}</span>
                      <span className="text-muted-foreground">· {"kr".repeat(selected.priceLevel)}</span>
                    </div>
                    <div className="mt-1.5"><SunBadge status={selected.sunStatus} until={selected.sunUntil} /></div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}
      </div>

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
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                <VenueImage venue={v} size={{ w: 160, h: 160 }} />
              </div>
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
