import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Sparkles, Sun } from "lucide-react";
import heroImg from "@/assets/hero-bergen.jpg";
import { sectionConfig } from "@/lib/domain";
import { useVenues } from "@/hooks/useVenues";
import { VenueCard } from "@/components/VenueCard";
import { FilterChips } from "@/components/FilterChips";

const filterOptions = [
  { id: "all", label: "Alt", emoji: "✨" },
  { id: "sun", label: "Sol nå", emoji: "☀️" },
  { id: "deals", label: "Tilbud", emoji: "🍻" },
  { id: "trending", label: "Trending", emoji: "🔥" },
  { id: "family", label: "Familie", emoji: "👨‍👩‍👧" },
  { id: "cheap", label: "Billig", emoji: "💸" },
  { id: "date", label: "Date", emoji: "💛" },
];

const Home = () => {
  const [filter, setFilter] = useState("all");
  const { data: venues = [], isLoading, error } = useVenues();
  const sunCount = venues.filter(v => v.sunStatus === "sun-now").length;

  const filteredSections = useMemo(() => {
    if (filter === "all") return sectionConfig;
    const map: Record<string, typeof sectionConfig[number]["id"][]> = {
      sun: ["sun-now", "evening-sun"],
      deals: ["cheap-beer"],
      trending: ["trending"],
      family: ["family"],
      cheap: ["cheap-beer"],
      date: ["best-now", "trending"],
    };
    const ids = map[filter] || [];
    return sectionConfig.filter(s => ids.includes(s.id));
  }, [filter]);

  const featured = venues.find(v => v.id === "bergen-rooftop") ?? venues[0];

  return (
    <div className="pb-8">
      {/* Hero */}
      <header className="relative z-0 h-[580px] overflow-hidden">
        <img src={heroImg} alt="Bergen ved solnedgang" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-night/40 via-night/55 to-night/85" />
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/25 via-transparent to-transparent mix-blend-overlay" />

        <div className="relative z-10 flex h-full flex-col px-5 pt-[max(env(safe-area-inset-top),1rem)]">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-sun shadow-glow">
                <Sun className="h-5 w-5 text-night" strokeWidth={2.5} />
              </div>
              <div className="leading-tight">
                <div className="font-display text-lg font-semibold">Uteliv</div>
                <div className="text-[10px] uppercase tracking-widest opacity-80">Bergen</div>
              </div>
            </div>
            <Link to="/profile" className="grid h-9 w-9 place-items-center rounded-full glass-dark text-white tap-scale">
              <span className="text-xs font-semibold">JS</span>
            </Link>
          </div>

          <div className="mt-auto pb-24 text-white animate-float-up [text-shadow:0_2px_20px_rgba(0,0,0,0.35)]">
            <div className="inline-flex items-center gap-2 rounded-full glass-dark px-3 py-1.5 text-xs font-medium">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sun opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-sun" />
              </span>
              {sunCount} steder med sol akkurat nå
            </div>
            <h1 className="mt-3 font-display text-[2.4rem] font-semibold leading-[1.1] tracking-tight text-balance">
              Hvor skal du se
              <span className="mt-1 block bg-gradient-to-r from-sun via-primary-glow to-sunset-pink bg-clip-text pb-2 text-transparent">solen senke seg?</span>
            </h1>
            <p className="mt-4 max-w-xs text-sm/relaxed opacity-90">
              Oppdag Bergens beste steder akkurat nå — basert på sol, tilbud og stemning.
            </p>
          </div>
        </div>
      </header>

      {/* Search */}
      <div className="relative z-20 -mt-8 px-5">
        <Link to="/explore" className="flex items-center gap-3 rounded-full border border-border/70 bg-card/95 px-5 py-3.5 shadow-card backdrop-blur-xl tap-scale">
          <Search className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Søk barer, områder, stemning...</span>
          <Sparkles className="ml-auto h-4 w-4 text-primary" />
        </Link>
      </div>

      {/* Filters */}
      <div className="mt-6 px-5">
        <FilterChips options={filterOptions} active={filter} onChange={setFilter} />
      </div>

      {isLoading && (
        <div className="mt-10 px-5 text-sm text-muted-foreground">Laster steder…</div>
      )}

      {error && !isLoading && (
        <div className="mt-10 mx-5 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Kunne ikke hente steder. Sjekk tilkoblingen og prøv igjen.
        </div>
      )}

      {!isLoading && !error && venues.length === 0 && (
        <div className="mt-10 mx-5 rounded-2xl bg-card p-6 text-center shadow-soft">
          <div className="font-display text-lg font-semibold">Ingen steder ennå</div>
          <p className="mt-1 text-sm text-muted-foreground">Det kommer snart flere — kom tilbake litt senere.</p>
        </div>
      )}

      {/* Featured spotlight */}
      {featured && (
        <section className="mt-7 px-5">
          <div className="mb-3 flex items-baseline justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-primary">★ Spotlight</div>
              <h2 className="mt-1 font-display text-2xl font-semibold">Kveldens utvalgte</h2>
            </div>
          </div>
          <VenueCard venue={featured} variant="feature" />
        </section>
      )}

      {/* Sections */}
      {filteredSections.map((section) => {
        const items = venues.filter(section.filter);
        if (!items.length) return null;
        const variant = section.id === "sun-now" || section.id === "trending" ? "default" : "compact";
        return (
          <section key={section.id} className="mt-9">
            <div className="mb-3 flex items-baseline justify-between px-5">
              <div>
                <h2 className="font-display text-xl font-semibold">{section.title}</h2>
                <p className="text-xs text-muted-foreground">{section.subtitle}</p>
              </div>
              <button className="text-xs font-medium text-primary">Se alle</button>
            </div>
            <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-2 scrollbar-hide">
              {items.map((v, i) => (
                <VenueCard key={v.id} venue={v} variant={variant} index={i} />
              ))}
            </div>
          </section>
        );
      })}

      <div className="mt-12 px-5 text-center">
        <p className="font-display text-sm italic text-muted-foreground">Laget med ☀️ i Bergen</p>
      </div>
    </div>
  );
};

export default Home;
