import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Heart, Share2, MapPin, Clock, Star, Navigation } from "lucide-react";
import { toast } from "sonner";
import { useVenue } from "@/hooks/useVenue";
import { useVenueContributions } from "@/hooks/useVenueContributions";
import { SunBadge } from "@/components/SunBadge";
import { isFavorite, toggleFavorite, useFavorites } from "@/lib/favorites";
import { timeAgo } from "@/lib/time";
import { cn } from "@/lib/utils";

const VenueDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  useFavorites();
  const { data: venue, isLoading, error } = useVenue(id);
  const { data: contributions = [] } = useVenueContributions(venue?.dbId);

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
    window.open(`https://www.google.com/maps/search/?api=1&query=${venue.lat},${venue.lng}`, "_blank");
  };

  return (
    <div className="pb-10">
      {/* Hero */}
      <div className="relative h-[55vh] overflow-hidden">
        <img src={venue.image} alt={venue.name} className="h-full w-full object-cover" />
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
          <SunBadge status={venue.sunStatus} until={venue.sunUntil} size="md" />
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
          <span className="text-muted-foreground">{"kr".repeat(venue.priceLevel)}<span className="opacity-30">{"kr".repeat(4 - venue.priceLevel)}</span></span>
          <span className="inline-flex items-center gap-1 text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{venue.area}</span>
        </div>

        {venue.dealText && (
          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-primary to-sunset-pink p-4 text-white shadow-card">
            <span className="text-2xl">🍻</span>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-widest opacity-80">Tilbud i dag</div>
              <div className="font-display text-lg font-semibold">{venue.dealText}</div>
            </div>
          </div>
        )}

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
          <div>
            <div className="text-xs text-muted-foreground">Åpningstider</div>
            <div className="font-medium">{venue.hours}</div>
          </div>
          <span className="ml-auto rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-700">Åpent nå</span>
        </div>

        {/* Sun forecast strip */}
        <div className="mt-4 rounded-2xl bg-gradient-to-br from-sun/15 via-primary/10 to-sunset-pink/15 p-4">
          <div className="text-xs font-semibold uppercase tracking-widest text-primary">Solprognose i dag</div>
          <div className="mt-2 flex items-end gap-1.5">
            {Array.from({ length: 12 }).map((_, i) => {
              const hour = 10 + i;
              const score = Math.max(0, Math.min(100, venue.sunScore - Math.abs(15 - hour) * 8));
              return (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <div className="flex h-16 w-full items-end overflow-hidden rounded-md bg-white/40">
                    <div className="w-full rounded-md bg-gradient-to-t from-primary to-sun" style={{ height: `${score}%` }} />
                  </div>
                  <span className="text-[9px] text-muted-foreground">{hour}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Last updated */}
        <div className="mt-4 text-xs text-muted-foreground">
          Sist oppdatert {timeAgo(venue.lastActivityAt)}
        </div>

        {/* Mini-feed */}
        {contributions.length > 0 && (
          <div className="mt-4 rounded-2xl bg-card p-4 shadow-soft">
            <div className="text-xs font-semibold uppercase tracking-widest text-primary">Aktivitet</div>
            <ul className="mt-3 space-y-3">
              {contributions.map((c) => {
                const d = c.data as any;
                let label = "Bidrag";
                let emoji = "✨";
                if (c.type === "sun_report") {
                  emoji = d?.status === "sun" ? "☀️" : "🌥️";
                  label = d?.status === "sun" ? "Rapporterte sol" : "Rapporterte skygge";
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
                    {c.type === "photo" && d?.image_url && (
                      <img src={d.image_url} alt="" className="h-10 w-10 rounded-md object-cover" />
                    )}
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
