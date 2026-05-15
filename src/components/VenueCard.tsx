import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Venue } from "@/lib/domain";
import { VenueImage } from "./VenueImage";
import { VenuePreviewBadges } from "./VenuePreviewBadges";
import { VenueCardFavoriteButton } from "./VenueCardFavoriteButton";
import { useLatestVenuePhoto } from "@/hooks/useLatestVenuePhoto";
import type { VenueBadgeState } from "@/hooks/useVenueBadges";
import { getVenuePreviewBadges } from "@/lib/venuePreviewBadges";
import { venueLocationLabel, type UserLatLng } from "@/lib/venueCardMeta";

// Backwards-compat: noen sider importerer fortsatt CrowdTag herfra.
const CROWD_TAG: Record<string, { emoji: string; label: string; bg: string }> = {
  quiet: { emoji: "😌", label: "Rolig", bg: "bg-emerald-500/90 text-white" },
  some: { emoji: "🙂", label: "Litt liv", bg: "bg-amber-500/90 text-white" },
  full: { emoji: "🔥", label: "Livlig", bg: "bg-rose-500/90 text-white" },
  queue: { emoji: "🔥", label: "Livlig", bg: "bg-rose-500/90 text-white" },
};

export function CrowdTag({ level, className }: { level: string | null | undefined; className?: string }) {
  if (!level) return null;
  const meta = CROWD_TAG[level];
  if (!meta) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold shadow-soft backdrop-blur-sm",
        meta.bg,
        className,
      )}
    >
      <span>{meta.emoji}</span>
      <span>{meta.label}</span>
    </span>
  );
}

interface Props {
  venue: Venue;
  variant?: "feature" | "default" | "compact";
  index?: number;
  badge?: VenueBadgeState | null;
  userPhotoUrl?: string | null;
  userLocation?: UserLatLng | null;
  eager?: boolean;
}

const CARD_SIZE = { w: 600, h: 600 };
const FEATURE_SIZE = { w: 800, h: 1000 };

export function VenueCard({ venue, variant = "default", index = 0, badge, userPhotoUrl: userPhotoProp, userLocation, eager }: Props) {
  const { data: fetchedPhoto } = useLatestVenuePhoto(userPhotoProp === undefined ? venue.dbId : undefined);
  const userPhotoUrl = userPhotoProp !== undefined ? userPhotoProp : fetchedPhoto;

  const locationLabel = useMemo(
    () => venueLocationLabel(venue, userLocation ?? null),
    [venue, userLocation],
  );

  const loading = eager ? "eager" : "lazy";
  const fetchPriority = eager ? "high" : "auto";

  const previewBadges = getVenuePreviewBadges(badge);

  if (variant === "feature") {
    return (
      <Link to={`/steder/${venue.id}`} className="group block tap-scale animate-stagger" style={{ animationDelay: `${index * 60}ms` }}>
        <div className="relative aspect-[4/5] overflow-hidden rounded-3xl shadow-card">
          <VenueImage
            venue={venue}
            userPhotoUrl={userPhotoUrl}
            size={FEATURE_SIZE}
            loading="eager"
            fetchPriority="high"
            imgClassName="absolute inset-0 transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-night/90 via-night/20 to-transparent" />

          <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-2">
            <VenuePreviewBadges badges={previewBadges} size="md" />
            <VenueCardFavoriteButton venueId={venue.id} size="md" />
          </div>

          <div className="absolute inset-x-0 bottom-0 p-5 text-white">
            <div className="mb-1 flex items-center gap-2 text-xs/none opacity-90">
              <span className="font-medium">{venue.category}</span>
              <span className="opacity-60">•</span>
              <span>{locationLabel}</span>
            </div>
            <h3 className="font-display text-2xl font-semibold leading-tight">{venue.name}</h3>
            <div className="mt-2 flex items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-sun text-sun" />{venue.rating}</span>
              {venue.dealText && <span className="rounded-full bg-primary/90 px-2 py-0.5 text-xs font-medium">{venue.dealText}</span>}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === "compact") {
    return (
      <Link to={`/steder/${venue.id}`} className="group block w-[180px] shrink-0 tap-scale animate-stagger" style={{ animationDelay: `${index * 50}ms` }}>
        <div className="relative aspect-square overflow-hidden rounded-2xl shadow-soft">
          <VenueImage
            venue={venue}
            userPhotoUrl={userPhotoUrl}
            size={CARD_SIZE}
            loading={loading}
            fetchPriority={fetchPriority}
            imgClassName="transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-night/70 to-transparent" />
          <div className="absolute top-2 left-2 right-2 flex items-start justify-between gap-1.5">
            <VenuePreviewBadges badges={previewBadges} />
            <VenueCardFavoriteButton venueId={venue.id} />
          </div>
        </div>
        <div className="mt-2.5 px-1">
          <h4 className="truncate font-display text-base font-semibold">{venue.name}</h4>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Star className="h-3 w-3 fill-sun text-sun" />{venue.rating}</span>
            <span>·</span><span className="capitalize truncate">{venue.category}</span><span>·</span><span className="truncate">{locationLabel}</span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/steder/${venue.id}`} className="group block w-[280px] shrink-0 tap-scale animate-stagger" style={{ animationDelay: `${index * 50}ms` }}>
      <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-card">
        <VenueImage
          venue={venue}
          userPhotoUrl={userPhotoUrl}
          size={CARD_SIZE}
          loading={loading}
          fetchPriority={fetchPriority}
          imgClassName="transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-night/60 via-transparent to-transparent" />
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
          <VenuePreviewBadges badges={previewBadges} />
          <VenueCardFavoriteButton venueId={venue.id} />
        </div>
        {venue.dealText && (
          <div className="absolute bottom-3 left-3 rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground shadow-soft">
            {venue.dealText}
          </div>
        )}
      </div>
      <div className="mt-3 px-1">
        <div className="flex items-baseline justify-between gap-2">
          <h4 className="truncate font-display text-lg font-semibold">{venue.name}</h4>
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Star className="h-3 w-3 fill-sun text-sun" />{venue.rating}</span>
          <span>·</span><span>{venue.category}</span><span>·</span><span>{venue.area}</span>
        </div>
      </div>
    </Link>
  );
}
