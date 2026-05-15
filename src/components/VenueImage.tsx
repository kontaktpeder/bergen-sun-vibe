import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { googlePlacePhotoUrl, type ResolvedVenueImage } from "@/lib/venue-image";
import { VenueFallback } from "./VenueFallback";
import type { Venue } from "@/lib/domain";

type Props = {
  venue: Pick<Venue, "image" | "googlePhotoName" | "name" | "category"> & { id?: string };
  userPhotoUrl?: string | null;
  className?: string;
  imgClassName?: string;
  size?: { w?: number; h?: number };
  alt?: string;
  loading?: "lazy" | "eager";
  fetchPriority?: "high" | "low" | "auto";
  showAttribution?: boolean;
  compactFallback?: boolean;
};

type Status = "loading" | "loaded";

function buildSources(
  venue: Pick<Venue, "image" | "googlePhotoName">,
  userPhotoUrl: string | null | undefined,
  size?: { w?: number; h?: number },
): ResolvedVenueImage[] {
  const out: ResolvedVenueImage[] = [];
  if (userPhotoUrl && userPhotoUrl.trim().length > 0)
    out.push({ kind: "user", src: userPhotoUrl });
  if (venue.image && venue.image.trim().length > 0)
    out.push({ kind: "custom", src: venue.image });
  const g = googlePlacePhotoUrl(venue.googlePhotoName, size);
  if (g) out.push({ kind: "google", src: g });
  return out;
}

export function VenueImage({
  venue,
  userPhotoUrl,
  className,
  imgClassName,
  size,
  alt,
  loading = "lazy",
  fetchPriority = "auto",
  showAttribution = true,
  compactFallback,
}: Props) {
  const sizeW = size?.w;
  const sizeH = size?.h;

  const sources = useMemo(
    () => buildSources(venue, userPhotoUrl, { w: sizeW, h: sizeH }),
    [venue.image, venue.googlePhotoName, userPhotoUrl, sizeW, sizeH],
  );

  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState<Status>(sources.length > 0 ? "loading" : "loaded");

  useEffect(() => {
    setIndex(0);
    setStatus(sources.length > 0 ? "loading" : "loaded");
  }, [sources]);

  const current = sources[index];

  if (!current) {
    return <VenueFallback venue={venue} className={className} compact={compactFallback} />;
  }

  const handleError = () => {
    if (index < sources.length - 1) {
      setIndex(index + 1);
      setStatus("loading");
    } else {
      // Exhausted — force fallback by advancing past the end
      setIndex(sources.length);
      setStatus("loaded");
    }
  };

  return (
    <div className={cn("relative h-full w-full overflow-hidden bg-secondary/40", className)}>
      {status === "loading" && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-secondary/60 to-secondary/30" />
      )}
      <img
        key={current.src}
        src={current.src}
        alt={alt ?? venue.name}
        loading={loading}
        decoding="async"
        // @ts-expect-error fetchpriority is valid HTML but missing from React types in older versions
        fetchpriority={fetchPriority}
        onLoad={() => setStatus("loaded")}
        onError={handleError}
        className={cn(
          "h-full w-full object-cover transition-opacity duration-300",
          status === "loaded" ? "opacity-100" : "opacity-0",
          imgClassName,
        )}
      />
      {current.kind === "google" && status === "loaded" && showAttribution && (
        <span className="pointer-events-none absolute bottom-1 right-1 rounded bg-black/55 px-1.5 py-0.5 text-[9px] font-medium leading-none text-white">
          Google
        </span>
      )}
    </div>
  );
}
