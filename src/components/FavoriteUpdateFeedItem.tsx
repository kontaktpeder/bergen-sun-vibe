import { Link } from "react-router-dom";
import { getContributionFeedLabel } from "@/lib/contributionLabels";
import { timeAgo } from "@/lib/time";
import type { FavoriteContribution } from "@/hooks/useFavoriteContributionsFeed";
import type { Venue } from "@/lib/domain";
import { VenueImage } from "@/components/VenueImage";

interface Props {
  contribution: FavoriteContribution;
  venue: Venue;
  userPhotoUrl?: string | null;
}

export function FavoriteUpdateFeedItem({ contribution, venue, userPhotoUrl }: Props) {
  const { emoji, label } = getContributionFeedLabel(contribution);

  return (
    <Link
      to={`/steder/${venue.id}`}
      className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-soft tap-scale"
    >
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl">
        <VenueImage venue={venue} userPhotoUrl={userPhotoUrl} size={{ w: 200, h: 200 }} loading="lazy" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-sm font-medium">
          <span className="text-base leading-none">{emoji}</span>
          <span className="truncate">
            {label} · <span className="text-muted-foreground">{venue.name}</span>
          </span>
        </div>
        <div className="mt-0.5 text-xs text-muted-foreground">
          {timeAgo(contribution.created_at)}
        </div>
      </div>
    </Link>
  );
}
