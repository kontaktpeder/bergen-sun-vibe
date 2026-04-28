import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useFavorites } from "@/lib/favorites";
import { venues } from "@/data/venues";
import { VenueCard } from "@/components/VenueCard";

const Favorites = () => {
  const favs = useFavorites();
  const items = venues.filter(v => favs.includes(v.id));

  return (
    <div className="px-5 pt-[max(env(safe-area-inset-top),1.5rem)]">
      <header className="pt-2">
        <div className="text-xs font-semibold uppercase tracking-widest text-primary">Dine favoritter</div>
        <h1 className="mt-1 font-display text-3xl font-semibold">Lagret</h1>
        <p className="mt-1 text-sm text-muted-foreground">{items.length} {items.length === 1 ? "sted" : "steder"} klare for senere</p>
      </header>

      {items.length === 0 ? (
        <div className="mt-16 grid place-items-center text-center">
          <div className="grid h-20 w-20 place-items-center rounded-full bg-secondary">
            <Heart className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="mt-5 font-display text-xl font-semibold">Ingen lagrede steder ennå</h2>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            Trykk på hjertet på et sted for å lagre det her — perfekt for når sola kommer.
          </p>
          <Link to="/" className="tap-scale mt-6 rounded-full bg-night px-6 py-3 text-sm font-medium text-white shadow-card">
            Utforsk steder
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3">
          {items.map((v, i) => (
            <div key={v.id} className="contents">
              <VenueCard venue={v} variant="compact" index={i} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;
