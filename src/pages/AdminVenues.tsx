import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Trash2, Search, Image as ImageIcon, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuthProfile } from "@/hooks/useAuthProfile";
import { useIsAdmin } from "@/hooks/useReports";
import { AdminVenuePhotos } from "@/components/admin/AdminVenuePhotos";
import { AdminVenueEditor } from "@/components/admin/AdminVenueEditor";
import { cn } from "@/lib/utils";

type VenueRow = {
  id: string;
  name: string;
  slug: string;
  category: string;
  city: string | null;
  area: string | null;
  description: string | null;
  tags: string[] | null;
  hours: string | null;
  created_at: string;
};

const AdminVenues = () => {
  const { user, isAuthed, loading } = useAuthProfile();
  const { data: isAdmin, isLoading: roleLoading } = useIsAdmin(user?.id);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
        <button onClick={() => navigate(-1)} aria-label="Tilbake" className="grid h-10 w-10 place-items-center rounded-full bg-card shadow-soft tap-scale">
          <ArrowLeft className="h-4 w-4" />
        </button>
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
        {filtered.map((v) => {
          const expanded = expandedId === v.id;
          return (
            <div key={v.id} className="rounded-2xl bg-card shadow-soft">
              <div className="flex items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{v.name}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {v.category}{v.area ? ` · ${v.area}` : ""}{v.city ? ` · ${v.city}` : ""}
                  </div>
                </div>
                <button
                  onClick={() => setExpandedId(expanded ? null : v.id)}
                  className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                  aria-label="Vis bilder"
                >
                  <ImageIcon className="h-4 w-4" />
                  <ChevronDown
                    className={cn("h-3 w-3 transition-transform", expanded && "rotate-180")}
                  />
                </button>
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
              {expanded && <AdminVenuePhotos venueId={v.id} />}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminVenues;
