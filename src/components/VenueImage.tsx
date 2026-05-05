import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { resolveVenueImage } from "@/lib/venue-image";
import type { Venue } from "@/lib/domain";

type Props = {
  venue: Pick<Venue, "image" | "googlePhotoName" | "name">;
  userPhotoUrl?: string | null;
  className?: string;
  imgClassName?: string;
  size?: { w?: number; h?: number };
  alt?: string;
  loading?: "lazy" | "eager";
  showAttribution?: boolean;
};

const PLACEHOLDER = "/placeholder.svg";

type Status = "loading" | "loaded" | "error";

export function VenueImage({
  venue,
  userPhotoUrl,
  className,
  imgClassName,
  size,
  alt,
  loading = "lazy",
  showAttribution = true,
}: Props) {
  const initial = resolveVenueImage(venue, userPhotoUrl, size);
  const [src, setSrc] = useState(initial.src);
  const [isGoogle, setIsGoogle] = useState(initial.isGoogle);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    const r = resolveVenueImage(venue, userPhotoUrl, size);
    setSrc(r.src);
    setIsGoogle(r.isGoogle);
    setStatus(r.src === PLACEHOLDER ? "loaded" : "loading");
  }, [venue, userPhotoUrl, size]);

  const handleError = () => {
    // Quietly fall back to placeholder, no console spam.
    if (src !== PLACEHOLDER) {
      setSrc(PLACEHOLDER);
      setIsGoogle(false);
      setStatus("loaded");
    } else {
      setStatus("error");
    }
  };

  const showImg = status !== "error";
  const showSkeleton = status === "loading";

  return (
    <div className={cn("relative h-full w-full overflow-hidden bg-secondary/40", className)}>
      {showSkeleton && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-secondary/60 to-secondary/30" />
      )}
      {showImg && (
        <img
          src={src}
          alt={alt ?? venue.name}
          loading={loading}
          onLoad={() => setStatus("loaded")}
          onError={handleError}
          className={cn(
            "h-full w-full object-cover transition-opacity duration-300",
            status === "loaded" ? "opacity-100" : "opacity-0",
            imgClassName,
          )}
        />
      )}
      {isGoogle && status === "loaded" && showAttribution && (
        <span className="pointer-events-none absolute bottom-1 right-1 rounded bg-black/55 px-1.5 py-0.5 text-[9px] font-medium leading-none text-white">
          Google
        </span>
      )}
    </div>
  );
}
