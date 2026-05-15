import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { VenueImage } from "@/components/VenueImage";
import { timeAgo } from "@/lib/time";
import type { FollowedVenueDigest } from "@/lib/followedVenueDigest";

interface Props {
  digest: FollowedVenueDigest;
  userPhotoUrl?: string | null;
}

export function FollowedVenueDigestCard({ digest, userPhotoUrl }: Props) {
  const { venue, updatedAt, lines, hasNewSince } = digest;

  return (
    <Link
      to={`/steder/${venue.id}`}
      className="tap-scale group flex items-center gap-3 rounded-2xl bg-card p-3 shadow-soft"
    >
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
        <VenueImage venue={venue} userPhotoUrl={userPhotoUrl} size={{ w: 240, h: 240 }} loading="lazy" />
        {hasNewSince && (
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary shadow-glow" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="truncate font-display text-base font-semibold">{venue.name}</h3>
          <span className="shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground">
            {timeAgo(updatedAt)}
          </span>
        </div>

        <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
          {lines.map((l, i) => (
            <li key={i} className="flex items-center gap-1 text-xs text-foreground/85">
              <span className="text-sm leading-none">{l.emoji}</span>
              <span className="truncate">{l.text}</span>
            </li>
          ))}
        </ul>
      </div>

      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
