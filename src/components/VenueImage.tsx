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

  useEffect(() => {
    const r = resolveVenueImage(venue, userPhotoUrl, size);
    setSrc(r.src);
    setIsGoogle(r.isGoogle);
  }, [venue, userPhotoUrl, size]);

  return (
    <div className={cn("relative h-full w-full", className)}>
      <img
        src={src}
        alt={alt ?? venue.name}
        loading={loading}
        onError={() => {
          if (src !== PLACEHOLDER) {
            setSrc(PLACEHOLDER);
            setIsGoogle(false);
          }
        }}
        className={cn("h-full w-full object-cover", imgClassName)}
      />
      {isGoogle && showAttribution && (
        <span className="pointer-events-none absolute bottom-1 right-1 rounded bg-black/55 px-1.5 py-0.5 text-[9px] font-medium leading-none text-white">
          Google
        </span>
      )}
    </div>
  );
}
