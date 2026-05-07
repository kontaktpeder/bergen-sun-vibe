import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Heart, Share2, MapPin, Clock, Star, Navigation } from "lucide-react";
import { toast } from "sonner";
import { useVenue } from "@/hooks/useVenue";
import { useVenueContributions } from "@/hooks/useVenueContributions";
import { SunBadge } from "@/components/SunBadge";
import { DataSunBadge } from "@/components/DataSunBadge";
import { useVenueBadges } from "@/hooks/useVenueBadges";
import { ReportButton } from "@/components/ReportButton";
import { VenueStatusBadges } from "@/components/VenueStatusBadges";
import { VenuePhotoGallery } from "@/components/VenuePhotoGallery";
import { VenueImage } from "@/components/VenueImage";
import { isFavorite, toggleFavorite, useFavorites } from "@/lib/favorites";
import { timeAgo } from "@/lib/time";
import { cn } from "@/lib/utils";

const VenueDetail = () => {
  const params = useParams<{ id?: string; slug?: string }>();
  const slug = params.slug ?? params.id;
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();
  useFavorites();
  const { data: venue, isLoading, error } = useVenue(slug);
  const { data: contributions = [] } = useVenueContributions(venue?.dbId);
  const venueIds = venue?.dbId ? [venue.dbId] : [];
  const { data: badgeMap = {} } = useVenueBadges(venueIds);
  const badge = venue?.dbId ? badgeMap[venue.dbId] : undefined;

  const openContribute = (mode: "sun" | "beer" | "photo" | "crowd") => {
    setSearchParams({ contribute: mode }, { replace: false });
  };

  if (isLoading) {
    return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Laster…</div>;
  }

  if (error) {
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center">
        <div>
          <p className="text-destructive">Noe gikk galt under lasting.</p>
          <Link to="/" className="mt-4 inline-block text-primary">Tilbake</Link>
        </div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center">
        <div>
          <p className="text-muted-foreground">Stedet ble ikke funnet.</p>
          <Link to="/" className="mt-4 inline-block text-primary">Tilbake</Link>
        </div>
      </div>
    );
  }

  const fav = isFavorite(venue.id);

  const handleShare = async () => {
    const data = { title: `${venue.name} – Uteliv Bergen`, text: venue.description, url: window.location.href };
    try {
      if (navigator.share) await navigator.share(data);
      else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Lenke kopiert");
      }
    } catch { /* cancelled */ }
  };

  const handleFav = () => {
    toggleFavorite(venue.id);
    toast(fav ? "Fjernet fra lagret" : "Lagret ❤️");
  };

  const openMap = () => {
    if (venue.googleMapsUrl) {
      window.open(venue.googleMapsUrl, "_blank");
      return;
    }
    const q = encodeURIComponent(
      venue.name ? `${venue.name}, ${venue.city ?? "Bergen"}` : `${venue.lat},${venue.lng}`,
    );
    const url = `https://www.google.com/maps/search/?api=1&query=${q}&center=${venue.lat},${venue.lng}`;
    window.open(url, "_blank");
  };

  return (
    <div className="pb-10">
      {/* Hero */}
      <div className="relative h-[55vh] overflow-hidden">
        {(() => {
          const userPhoto = contributions.find(c => c.type === "photo")?.data as Record<string, unknown> | undefined;
          const userPhotoUrl = typeof userPhoto?.image_url === "string" ? userPhoto.image_url : undefined;
          return <VenueImage venue={venue} userPhotoUrl={userPhotoUrl} size={{ w: 1200, h: 900 }} loading="eager" />;
        })()}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-night/30" />

        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-5 pt-[max(env(safe-area-inset-top),1rem)]">
          <button onClick={() => navigate(-1)} className="grid h-10 w-10 place-items-center rounded-full glass shadow-soft tap-scale">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex gap-2">
            <button onClick={handleShare} className="grid h-10 w-10 place-items-center rounded-full glass shadow-soft tap-scale">
              <Share2 className="h-4 w-4" />
            </button>
            <button onClick={handleFav} className="grid h-10 w-10 place-items-center rounded-full glass shadow-soft tap-scale">
              <Heart className={cn("h-4 w-4 transition-colors", fav && "fill-primary text-primary")} />
            </button>
          </div>
        </div>

        <div className="absolute bottom-16 left-5 right-5">
          {badge && badge.sun
            ? <DataSunBadge badge={badge} size="md" />
            : <SunBadge status={venue.sunStatus} until={venue.sunUntil} size="md" />}
        </div>
      </div>

      {/* Header info */}
      <div className="-mt-8 rounded-t-3xl bg-background px-5 pt-6 animate-float-up">
        <div className="text-xs font-medium uppercase tracking-widest text-primary">{venue.category}</div>
        <h1 className="mt-1 font-display text-3xl font-semibold leading-tight">{venue.name}</h1>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="inline-flex items-center gap-1.5">
            <Star className="h-4 w-4 fill-sun text-sun" />
            <span className="font-semibold">{venue.rating}</span>
            <span className="text-muted-foreground">({venue.reviews})</span>
          </span>
          <span className="inline-flex items-center gap-1 text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{venue.area}</span>
        </div>

        {/* Live status + contribute (combined) */}
        <VenueStatusBadges
          contributions={contributions}
          onSun={() => openContribute("sun")}
          onCrowd={() => openContribute("crowd")}
          onBeer={() => openContribute("beer")}
          onPhoto={() => openContribute("photo")}
        />

        {venue.dealText && (
          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-primary to-sunset-pink p-4 text-white shadow-card">
            <span className="text-2xl">🍻</span>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-widest opacity-80">Tilbud i dag</div>
              <div className="font-display text-lg font-semibold">{venue.dealText}</div>
            </div>
          </div>
        )}

        {/* Photo gallery */}
        <VenuePhotoGallery contributions={contributions} onAdd={() => openContribute("photo")} />

        {/* Tags */}
        <div className="mt-5 flex flex-wrap gap-2">
          {venue.tags.map((t) => (
            <span key={t} className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-foreground">#{t}</span>
          ))}
        </div>

        {/* Description */}
        <p className="mt-5 text-[15px] leading-relaxed text-foreground/85">{venue.description}</p>

        {/* Hours */}
        <div className="mt-5 flex items-center gap-3 rounded-2xl bg-card p-4 shadow-soft">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-secondary">
            <Clock className="h-4 w-4" />
          </div>
          {venue.hours ? (
            <div>
              <div className="text-xs text-muted-foreground">Åpningstider</div>
              <div className="font-medium">{venue.hours}</div>
            </div>
          ) : (
            <div>
              <div className="text-xs text-muted-foreground">Åpningstider</div>
              <div className="text-sm text-muted-foreground">Ikke lagt inn ennå</div>
            </div>
          )}
        </div>

        {/* Last updated */}
        <div className="mt-4 text-xs text-muted-foreground">
          Sist oppdatert {timeAgo(venue.lastActivityAt)}
        </div>

        {/* Mini-feed */}
        {contributions.length > 0 && (
          <div className="mt-4 rounded-2xl bg-card p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-widest text-primary">Aktivitet</div>
              <span className="text-[10px] text-muted-foreground">Rapporter feil med 🚩 på bidraget</span>
            </div>
            <ul className="mt-3 space-y-3">
              {contributions.map((c) => {
                const d = c.data as Record<string, unknown>;
                let label = "Bidrag";
                let emoji = "✨";
                if (c.type === "sun_report") {
                  const s = String(d?.status ?? "");
                  const meta: Record<string, { e: string; l: string }> = {
                    sun: { e: "☀️", l: "Rapporterte sol" },
                    partial: { e: "⛅", l: "Rapporterte delvis sol" },
                    going_down: { e: "🌇", l: "Sol på vei ned" },
                    shade: { e: "🌥️", l: "Rapporterte skygge" },
                  };
                  emoji = meta[s]?.e ?? "☀️";
                  label = meta[s]?.l ?? "Solrapport";
                } else if (c.type === "crowd_report") {
                  const lvl = String(d?.level ?? "");
                  const meta: Record<string, { e: string; l: string }> = {
                    quiet: { e: "🌿", l: "Rolig nå" },
                    some: { e: "👥", l: "Litt folk" },
                    full: { e: "🔥", l: "Fullt" },
                    queue: { e: "🚷", l: "Kø ute" },
                  };
                  emoji = meta[lvl]?.e ?? "👥";
                  label = meta[lvl]?.l ?? "Stemning";
                } else if (c.type === "beer_price") {
                  emoji = "🍺";
                  label = `Oppdaterte ølpris til kr ${d?.price}`;
                } else if (c.type === "photo") {
                  emoji = "📸";
                  label = "La til bilde";
                }
                return (
                  <li key={c.id} className="flex items-center gap-3 text-sm">
                    <span className="text-lg">{emoji}</span>
                    <div className="flex-1">
                      <div className="font-medium">{label}</div>
                      <div className="text-xs text-muted-foreground">{timeAgo(c.created_at)}</div>
                    </div>
                    <ReportButton contributionId={c.id} />
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button onClick={openMap} className="tap-scale flex items-center justify-center gap-2 rounded-full bg-night py-3.5 font-medium text-white shadow-card">
            <Navigation className="h-4 w-4" /> Åpne i kart
          </button>
          <button onClick={handleShare} className="tap-scale flex items-center justify-center gap-2 rounded-full bg-card py-3.5 font-medium shadow-soft">
            <Share2 className="h-4 w-4" /> Del
          </button>
        </div>
      </div>
    </div>
  );
};

export default VenueDetail;
