import { Link } from "react-router-dom";
import { Beer } from "lucide-react";
import type { Venue } from "@/lib/domain";
import type { VenueBadgeState } from "@/hooks/useVenueBadges";
import { VenueImage } from "@/components/VenueImage";
import { DataSunBadge } from "@/components/DataSunBadge";
import { CrowdTag } from "@/components/VenueCard";
import { timeAgo } from "@/lib/time";

const CARD_SIZE = { w: 600, h: 600 };

function latestUpdateAt(venue: Venue, badge?: VenueBadgeState | null): string | null {
  const times = [badge?.sunAt, badge?.crowdAt, venue.lastActivityAt].filter(Boolean) as string[];
  if (!times.length) return null;
  return times.reduce((a, b) => (new Date(a) > new Date(b) ? a : b));
}

interface Props {
  venue: Venue;
  badge?: VenueBadgeState | null;
  userPhotoUrl?: string | null;
  index?: number;
}

export function SavedVenueStripCard({ venue, badge, userPhotoUrl, index = 0 }: Props) {
  const updatedAt = latestUpdateAt(venue, badge);

  return (
    <Link
      to={`/steder/${venue.id}`}
      className="group block w-[200px] shrink-0 tap-scale animate-stagger"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl shadow-card">
        <VenueImage
          venue={venue}
          userPhotoUrl={userPhotoUrl}
          size={CARD_SIZE}
          loading="lazy"
          imgClassName="transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-night/80 via-night/10 to-transparent" />

        <div className="absolute top-2 left-2 right-2 flex items-start justify-between gap-1">
          {badge?.sun && <DataSunBadge badge={badge} size="sm" />}
          {badge?.beerPrice != null && (
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-foreground shadow-soft">
              <Beer className="h-3 w-3" />
              {badge.beerPrice} kr
            </span>
          )}
        </div>

        <div className="absolute bottom-2 right-2">
          <CrowdTag level={badge?.crowd} />
        </div>

        <div className="absolute inset-x-0 bottom-0 p-3 text-white">
          <h4 className="truncate font-display text-base font-semibold">{venue.name}</h4>
          {updatedAt && (
            <p className="mt-0.5 text-[10px] uppercase tracking-wider opacity-85">
              Oppdatert {timeAgo(updatedAt)}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
