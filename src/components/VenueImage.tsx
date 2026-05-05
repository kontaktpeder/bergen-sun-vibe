import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { resolveVenueImage, type ResolvedVenueImage } from "@/lib/venue-image";
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

type Status = "loading" | "loaded" | "error";

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
  const initial = resolveVenueImage(venue, userPhotoUrl, size);
  const [resolved, setResolved] = useState<ResolvedVenueImage>(initial);
  const [status, setStatus] = useState<Status>(
    initial.kind === "fallback" ? "loaded" : "loading",
  );

  useEffect(() => {
    const r = resolveVenueImage(venue, userPhotoUrl, size);
    setResolved(r);
    setStatus(r.kind === "fallback" ? "loaded" : "loading");
  }, [venue, userPhotoUrl, size]);

  const handleError = () => {
    setResolved({ kind: "fallback", src: null });
    setStatus("loaded");
  };

  if (resolved.kind === "fallback") {
    return (
      <VenueFallback venue={venue} className={className} compact={compactFallback} />
    );
  }

  return (
    <div className={cn("relative h-full w-full overflow-hidden bg-secondary/40", className)}>
      {status === "loading" && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-secondary/60 to-secondary/30" />
      )}
      {status !== "error" && (
        <img
          src={resolved.src}
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
      )}
      {resolved.kind === "google" && status === "loaded" && showAttribution && (
        <span className="pointer-events-none absolute bottom-1 right-1 rounded bg-black/55 px-1.5 py-0.5 text-[9px] font-medium leading-none text-white">
          Google
        </span>
      )}
    </div>
  );
}
