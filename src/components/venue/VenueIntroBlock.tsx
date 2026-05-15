import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { VenueSection } from "./VenueSection";

interface Props {
  introShort: string;
  introFull: string;
  showReadMore: boolean;
}

export function VenueIntroBlock({ introShort, introFull, showReadMore }: Props) {
  const [open, setOpen] = useState(false);

  if (!introShort.trim()) return null;

  return (
    <VenueSection id="om-stedet" title="Om stedet">
      <p className="text-[15px] leading-relaxed text-foreground/85">{introShort}</p>

      {showReadMore && (
        <Collapsible open={open} onOpenChange={setOpen} className="mt-2">
          <CollapsibleTrigger className="inline-flex items-center gap-1 text-sm font-medium text-primary tap-scale">
            {open ? "Vis mindre" : "Les mer"}
            <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 text-[15px] leading-relaxed text-foreground/85">
            {introFull}
          </CollapsibleContent>
        </Collapsible>
      )}
    </VenueSection>
  );
}
