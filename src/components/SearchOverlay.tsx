import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Plus, Search as SearchIcon, X } from "lucide-react";
import { useVenues } from "@/hooks/useVenues";
import { useVenuePhotos } from "@/hooks/useVenuePhotos";
import { openContributeFab } from "@/lib/contribute-bus";
import { VenueImage } from "@/components/VenueImage";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SearchOverlay({ open, onClose }: Props) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const { data: venues = [] } = useVenues();

  useEffect(() => {
    if (open) {
      setQ("");
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
      return () => {
        clearTimeout(t);
        document.removeEventListener("keydown", onKey);
        document.body.style.overflow = "";
      };
    }
  }, [open, onClose]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    return venues
      .filter((v) => {
        const hay = `${v.name} ${v.area ?? ""} ${v.category ?? ""} ${(v.tags ?? []).join(" ")} ${v.city ?? ""}`.toLowerCase();
        return hay.includes(term);
      })
      .slice(0, 30);
  }, [q, venues]);

  const { data: photoMap = {} } = useVenuePhotos(results.map((v) => v.dbId));

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex flex-col bg-background animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border/50 px-3 pt-[max(env(safe-area-inset-top),0.75rem)] pb-3">
        <button
          onClick={onClose}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full hover:bg-secondary tap-scale"
          aria-label="Lukk søk"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex flex-1 items-center gap-2 rounded-full bg-secondary px-4 py-2.5">
          <SearchIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Søk barer, områder, stemning..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {q && (
            <button onClick={() => setQ("")} aria-label="Tøm" className="text-muted-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        {!q && (
          <div className="mt-10 text-center text-sm text-muted-foreground">
            Begynn å skrive for å søke i alle steder.
          </div>
        )}

        {q && results.length > 0 && (
          <div className="space-y-2">
            {results.map((v) => (
              <button
                key={v.id}
                onClick={() => {
                  onClose();
                  navigate(`/venue/${v.id}`);
                }}
                className={cn(
                  "tap-scale flex w-full items-center gap-3 rounded-2xl bg-card p-2.5 text-left shadow-soft",
                )}
              >
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                  <VenueImage venue={v} userPhotoUrl={photoMap[v.dbId] ?? null} size={{ w: 400, h: 400 }} compactFallback showAttribution={false} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-display text-base font-semibold">{v.name}</div>
                  <div className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">
                      {v.area ? `${v.area} · ` : ""}{v.city ?? ""} · {v.category}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {q && results.length === 0 && (
          <div className="mt-10 flex flex-col items-center text-center">
            <div className="text-base font-semibold">Ingen treff på "{q}"</div>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              Kjenner du dette stedet? Hjelp fellesskapet og legg det til.
            </p>
            <button
              onClick={() => {
                onClose();
                openContributeFab("venue");
              }}
              className="tap-scale mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-soft"
            >
              <Plus className="h-4 w-4" />
              Legg til nytt sted
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
