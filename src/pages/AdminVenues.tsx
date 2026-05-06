import { useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowLeft, Shield, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuthProfile } from "@/hooks/useAuthProfile";
import { useIsAdmin } from "@/hooks/useReports";

type VenueRow = {
  id: string;
  name: string;
  slug: string;
  category: string;
  city: string | null;
  area: string | null;
  created_at: string;
};

const AdminVenues = () => {
  const { user, isAuthed, loading } = useAuthProfile();
  const { data: isAdmin, isLoading: roleLoading } = useIsAdmin(user?.id);
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);

  const { data: venues = [], isLoading, error } = useQuery({
    queryKey: ["admin-venues"],
    enabled: !!isAdmin,
    queryFn: async (): Promise<VenueRow[]> => {
      const { data, error } = await supabase
        .from("venues")
        .select("id, name, slug, category, city, area, created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as VenueRow[];
    },
  });

  const deleteVenue = useMutation({
    mutationFn: async (venueId: string) => {
      const { data, error } = await supabase.rpc("admin_delete_venue", { _venue_id: venueId });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-venues"] });
      qc.invalidateQueries({ queryKey: ["venues"] });
      qc.invalidateQueries({ queryKey: ["venue"] });
    },
  });

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return venues;
    return venues.filter((v) =>
      `${v.name} ${v.area ?? ""} ${v.city ?? ""} ${v.category}`.toLowerCase().includes(term),
    );
  }, [q, venues]);

  if (loading || roleLoading) {
    return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Laster…</div>;
  }
  if (!isAuthed) return <Navigate to="/auth" replace />;
  if (!isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center px-6 text-center">
        <div>
          <Shield className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">Du har ikke tilgang til denne siden.</p>
          <Link to="/" className="mt-4 inline-block text-primary">Tilbake</Link>
        </div>
      </div>
    );
  }

  const handleDelete = async (v: VenueRow) => {
    const ok = window.confirm(`Slette "${v.name}"? Dette fjerner stedet og alle bidrag knyttet til det. Kan ikke angres.`);
    if (!ok) return;
    setPendingId(v.id);
    try {
      await deleteVenue.mutateAsync(v.id);
      toast.success(`Slettet "${v.name}"`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Kunne ikke slette");
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="px-5 pt-[max(env(safe-area-inset-top),1.5rem)] pb-12">
      <div className="flex items-center gap-3">
        <Link to="/profile" className="grid h-10 w-10 place-items-center rounded-full bg-card shadow-soft">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-semibold">Steder</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} av {venues.length}</p>
        </div>
      </div>

      <div className="relative mt-5">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Søk navn, område, by…"
          className="w-full rounded-full bg-card py-3 pl-11 pr-4 text-sm shadow-soft outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {isLoading && <div className="mt-6 text-sm text-muted-foreground">Laster…</div>}
      {error && <div className="mt-6 text-sm text-destructive">Kunne ikke hente steder.</div>}
      {!isLoading && !error && filtered.length === 0 && (
        <div className="mt-12 text-center text-sm text-muted-foreground">Ingen treff</div>
      )}

      <div className="mt-5 space-y-2">
        {filtered.map((v) => (
          <div key={v.id} className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-soft">
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{v.name}</div>
              <div className="truncate text-xs text-muted-foreground">
                {v.category}{v.area ? ` · ${v.area}` : ""}{v.city ? ` · ${v.city}` : ""}
              </div>
            </div>
            <Link
              to={`/venue/${v.slug}`}
              className="rounded-full px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              Vis
            </Link>
            <Button
              variant="destructive"
              size="sm"
              disabled={pendingId === v.id}
              onClick={() => handleDelete(v)}
              aria-label={`Slett ${v.name}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminVenues;
