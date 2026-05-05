import type { VenueContribution } from "@/hooks/useVenueContributions";
import { timeAgo } from "@/lib/time";

type Props = { contributions: VenueContribution[]; onAdd: () => void };

export function VenuePhotoGallery({ contributions, onAdd }: Props) {
  const photos = contributions
    .filter((c) => c.type === "photo")
    .map((c) => ({
      id: c.id,
      url: (c.data as Record<string, unknown>)?.image_url as string | undefined,
      at: c.created_at,
    }))
    .filter((p): p is { id: string; url: string; at: string } => typeof p.url === "string");

  if (photos.length === 0) return null;

  return (
    <section className="mt-5">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-widest text-primary">
          Bilder fra brukere
        </div>
        <button onClick={onAdd} className="text-xs font-medium text-primary">+ Legg til</button>
      </div>
      <div className="-mx-5 mt-3 flex gap-3 overflow-x-auto px-5 pb-1 scroll-pl-5 snap-x snap-mandatory">
        {photos.map((p) => (
          <div key={p.id} className="relative h-44 w-40 shrink-0 snap-start overflow-hidden rounded-2xl bg-secondary/40 shadow-soft">
            <img src={p.url} alt="Bilde fra bruker" loading="lazy" className="h-full w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-2 text-[10px] font-medium text-white">
              {timeAgo(p.at)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
