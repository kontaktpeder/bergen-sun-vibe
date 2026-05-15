import { useState } from "react";
import { VenueSection } from "./VenueSection";

interface Props {
  description: string;
}

const PREVIEW_LEN = 280;

export function VenueIntroBlock({ description }: Props) {
  const [open, setOpen] = useState(false);
  const trimmed = description.trim();
  if (!trimmed) return null;

  const showReadMore = trimmed.length > PREVIEW_LEN + 20;
  const preview = showReadMore
    ? trimmed.slice(0, PREVIEW_LEN).replace(/\s+\S*$/, "") + "…"
    : trimmed;

  return (
    <VenueSection id="om-stedet" title="Om stedet">
      <p className="text-[15px] leading-relaxed text-foreground/85 whitespace-pre-line">
        {open ? trimmed : preview}
      </p>
      {showReadMore && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="mt-2 text-sm font-medium text-primary tap-scale"
        >
          {open ? "Vis mindre" : "Les mer"}
        </button>
      )}
    </VenueSection>
  );
}
