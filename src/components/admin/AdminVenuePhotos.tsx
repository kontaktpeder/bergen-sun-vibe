import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type PhotoRow = {
  id: string;
  created_at: string;
  user_id: string;
  image_url: string;
};

export function AdminVenuePhotos({ venueId }: { venueId: string }) {
  const qc = useQueryClient();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const { data: photos = [], isLoading } = useQuery<PhotoRow[]>({
    queryKey: ["admin-venue-photos", venueId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contributions")
        .select("id, created_at, user_id, data")
        .eq("venue_id", venueId)
        .eq("type", "photo")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? [])
        .map((r) => {
          const url = (r.data as Record<string, unknown> | null)?.image_url;
          return typeof url === "string" && url
            ? { id: r.id, created_at: r.created_at, user_id: r.user_id, image_url: url }
            : null;
        })
        .filter(Boolean) as PhotoRow[];
    },
  });

  const deletePhoto = useMutation({
    mutationFn: async (contributionId: string) => {
      const { error } = await supabase.rpc("admin_delete_contribution", {
        _contribution_id: contributionId,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-venue-photos", venueId] });
      qc.invalidateQueries({ queryKey: ["venue-photos-batch"] });
      qc.invalidateQueries({ queryKey: ["venue-latest-photo", venueId] });
      qc.invalidateQueries({ queryKey: ["contributions", venueId] });
    },
  });

  const handleDelete = async (p: PhotoRow) => {
    if (!window.confirm("Slette dette bildet? Kan ikke angres.")) return;
    setPendingId(p.id);
    try {
      await deletePhoto.mutateAsync(p.id);
      toast.success("Bilde slettet");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Kunne ikke slette");
    } finally {
      setPendingId(null);
    }
  };

  if (isLoading) {
    return <div className="px-3 pb-3 text-xs text-muted-foreground">Laster bilder…</div>;
  }

  if (photos.length === 0) {
    return <div className="px-3 pb-3 text-xs text-muted-foreground">Ingen bilder.</div>;
  }

  return (
    <div className="grid grid-cols-3 gap-2 px-3 pb-3">
      {photos.map((p) => (
        <div key={p.id} className="relative aspect-square overflow-hidden rounded-xl bg-secondary">
          <img src={p.image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
          <button
            onClick={() => handleDelete(p)}
            disabled={pendingId === p.id}
            aria-label="Slett bilde"
            className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-destructive text-destructive-foreground shadow-soft tap-scale disabled:opacity-50"
          >
            {pendingId === p.id ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      ))}
    </div>
  );
}
