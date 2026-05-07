import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { SearchOverlay } from "@/components/SearchOverlay";
import { Search, Sparkles, Sun } from "lucide-react";
import heroImg from "@/assets/hero-oslo-sunset.jpg";
import logoPng from "@/assets/utefolket-logo.png";
import logoSvg from "@/assets/utefolket-logo.svg";
import { buildSectionConfig, belongsToCity, type SectionDef } from "@/lib/domain";
import { useVenues } from "@/hooks/useVenues";
import { VenueCard } from "@/components/VenueCard";
import { FilterChips } from "@/components/FilterChips";
import { useCity } from "@/context/CityContext";
import { useVenueBadges } from "@/hooks/useVenueBadges";
import { useVenuePhotos } from "@/hooks/useVenuePhotos";
import { useAuthProfile } from "@/hooks/useAuthProfile";
import { CityBanner } from "@/components/CityBanner";

const filterOptions = [
  { id: "all", label: "Alt", emoji: "✨" },
  { id: "sun", label: "Sol nå", emoji: "☀️" },
  { id: "cheap", label: "Billigst øl", emoji: "🍺" },
];

const Home = () => {
  const [filter, setFilter] = useState("all");
  const [searchOpen, setSearchOpen] = useState(false);
  const { currentCity } = useCity();
  const { data: allVenues = [], isLoading, error } = useVenues();
  const { user, profile } = useAuthProfile();
  const userDisplayName =
    profile?.username?.trim() || user?.email?.split("@")[0]?.trim() || "Gjest";
  const userInitials = userDisplayName.slice(0, 2).toUpperCase();
  const venues = useMemo(
    () => allVenues.filter(v => belongsToCity(v, currentCity as "Bergen" | "Oslo")),
    [allVenues, currentCity],
  );
  const venueIds = useMemo(() => venues.map(v => v.dbId), [venues]);
  const { data: badgeMap = {} } = useVenueBadges(venueIds);
  const { data: photoMap = {} } = useVenuePhotos(venueIds);
  const sunCount = Object.values(badgeMap).filter(b => b.sun === "sunny").length;

  const sectionConfig = useMemo<SectionDef[]>(() => buildSectionConfig(currentCity), [currentCity]);

  const filteredSections = useMemo(() => {
    if (filter === "all") return sectionConfig;
    const map: Record<string, SectionDef["id"][]> = {
      sun: ["sun-now"],
      cheap: ["cheap-beer"],
    };
    const ids = map[filter] || [];
    return sectionConfig.filter(s => ids.includes(s.id));
  }, [filter, sectionConfig]);

  const featured = useMemo(() => {
    if (!venues.length) return null;
    const withSun = venues.find(v => badgeMap[v.dbId]?.sun === "sunny");
    if (withSun) return withSun;
    const withImage = [...venues].sort((a, b) => (b.rating || 0) - (a.rating || 0)).find(v => v.image);
    return withImage ?? venues[0];
  }, [venues, badgeMap]);

  return (
    <div className="pb-8">
      {/* Hero */}
      <header className="relative z-0 min-h-[100svh] overflow-hidden">
        <img
          src={heroImg}
          alt={`${currentCity} ved solnedgang`}
          loading="eager"
          decoding="async"
          // @ts-expect-error fetchpriority is valid HTML
          fetchpriority="high"
          className="absolute inset-0 h-full w-full object-cover object-[center_40%] [filter:saturate(0.92)]"
        />
        {/* Soft bottom gradient for breathing room */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.18) 45%, rgba(0,0,0,0.38) 100%)",
          }}
        />
        {/* Subtle film grain */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.10] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.6 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
            backgroundSize: "160px 160px",
          }}
        />

        <div className="relative z-10 flex min-h-[100svh] flex-col px-5 pt-[max(env(safe-area-inset-top),1rem)] pb-8">
          {/* Top bar */}
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3 ml-1">
              <img
                src={logoPng}
                alt="Utefolket"
                className="object-contain"
                style={{ height: 44, width: 44, filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.25))" }}
              />
              <div
                className="leading-tight"
                style={{ color: "#F7F5F2", textShadow: "0 1px 8px rgba(0,0,0,0.4)" }}
              >
                <div className="font-display text-lg font-semibold">Utefolket</div>
                <div className="text-[10px] uppercase tracking-widest opacity-80">{currentCity}</div>
              </div>
            </div>
            {user && (
              <Link to="/profile" className="grid h-9 w-9 place-items-center rounded-full glass-dark text-white tap-scale">
                <span className="text-xs font-semibold">{userInitials}</span>
              </Link>
            )}
          </div>

          {/* Centered hero content – logo sits ~40% from top */}
          <div className="flex flex-1 flex-col items-center text-center pt-[18vh]">
            <img
              src={logoSvg}
              alt="Utefolket"
              className="w-[186px] max-w-[46vw] h-auto object-contain"
              style={{ opacity: 0.96, filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.18))" }}
            />

            <h1
              className="mt-5 font-display text-[2.75rem] font-semibold leading-[1] tracking-[0.5px]"
              style={{ color: "#F7F5F2", textShadow: "0 2px 12px rgba(0,0,0,0.35)" }}
            >
              Utefolket
            </h1>
            <p
              className="mt-2 text-sm font-medium tracking-wide"
              style={{ color: "#F7F5F2", opacity: 0.75, textShadow: "0 1px 8px rgba(0,0,0,0.45)" }}
            >
              Akkurat nå i {currentCity}
            </p>

            <div className="mt-2 inline-flex items-center gap-2 rounded-full glass-dark px-3 py-1.5 text-xs font-medium text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.4)]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sun opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-sun" />
              </span>
              {sunCount > 0
                ? `${sunCount} steder med sol akkurat nå`
                : "Sola er på vei ned 🌇"}
            </div>

            <div className="flex-1" />

            {/* Search */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="mt-12 flex w-full items-center gap-3 rounded-full border border-white/30 bg-white/95 px-5 py-3.5 shadow-[0_8px_28px_rgba(0,0,0,0.25)] backdrop-blur-xl tap-scale text-left"
            >
              <Search className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Søk barer, områder, stemning...</span>
              <Sparkles className="ml-auto h-4 w-4 text-primary" />
            </button>

            {/* Filter chips */}
            <div className="mt-4 w-full">
              <FilterChips options={filterOptions} active={filter} onChange={setFilter} />
            </div>
          </div>
        </div>
      </header>

      <div className="mt-4 px-5">
        <CityBanner />
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
          <VenueCard venue={featured} variant="feature" badge={badgeMap[featured.dbId] ?? null} userPhotoUrl={photoMap[featured.dbId] ?? null} eager />
        </section>
      )}

      {/* Sections */}
      {filteredSections.map((section) => {
        let items = venues.filter(v => section.filter(v, badgeMap));
        if (section.id === "cheap-beer") {
          items = [...items].sort(
            (a, b) => (badgeMap[a.dbId]?.beerPrice ?? Infinity) - (badgeMap[b.dbId]?.beerPrice ?? Infinity),
          );
        }
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
                <VenueCard
                  key={v.id}
                  venue={v}
                  variant={variant}
                  index={i}
                  badge={badgeMap[v.dbId] ?? null}
                  userPhotoUrl={photoMap[v.dbId] ?? null}
                  eager={i < 3}
                />
              ))}
            </div>
          </section>
        );
      })}

      <div className="mt-12 px-5 text-center">
        <p className="font-display text-sm italic text-muted-foreground">Laget med ☀️ i {currentCity}</p>
      </div>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
};

export default Home;
