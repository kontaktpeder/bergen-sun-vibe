import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  buildVenueShareText,
  type ShareLive,
  type ShareVenue,
} from "@/lib/shareText";

export async function shareVenue(venue: ShareVenue, live?: ShareLive) {
  const data = buildVenueShareText(venue, live);
  try {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      await navigator.share({ title: data.title, text: data.text, url: data.url });
      return "shared" as const;
    }
  } catch (err) {
    // AbortError = user cancelled; silently ignore
    if ((err as { name?: string })?.name === "AbortError") return "cancelled" as const;
  }
  try {
    await navigator.clipboard.writeText(`${data.text} ${data.url}`);
    toast.success("Lenke kopiert");
    return "copied" as const;
  } catch {
    toast.error("Klarte ikke å dele");
    return "failed" as const;
  }
}

interface Props {
  venue: ShareVenue;
  live?: ShareLive;
  variant?: "primary" | "ghost" | "card";
  className?: string;
  children?: React.ReactNode;
}

export function ShareVenueButton({
  venue,
  live,
  variant = "card",
  className,
  children,
}: Props) {
  const handle = () => void shareVenue(venue, live);

  if (variant === "primary") {
    return (
      <button
        onClick={handle}
        className={cn(
          "tap-scale w-full rounded-2xl bg-gradient-to-br from-primary to-sunset-pink py-5 text-base font-bold text-white shadow-float",
          className,
        )}
      >
        {children ?? "Del med venner"}
      </button>
    );
  }

  if (variant === "ghost") {
    return (
      <button
        onClick={handle}
        aria-label="Del"
        className={cn(
          "tap-scale grid h-10 w-10 place-items-center rounded-full glass shadow-soft",
          className,
        )}
      >
        <Share2 className="h-4 w-4" />
      </button>
    );
  }

  return (
    <button
      onClick={handle}
      className={cn(
        "tap-scale flex items-center justify-center gap-2 rounded-full bg-card py-3 text-sm font-medium shadow-soft",
        className,
      )}
    >
      <Share2 className="h-4 w-4" />
      {children ?? "Del"}
    </button>
  );
}
