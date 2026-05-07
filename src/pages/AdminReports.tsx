import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuthProfile } from "@/hooks/useAuthProfile";
import { useIsAdmin, useModerateReport, useReports } from "@/hooks/useReports";
import { timeAgo } from "@/lib/time";

const REASON_LABELS: Record<string, string> = {
  wrong_info: "Feil info",
  spam: "Spam",
  inappropriate: "Upassende bilde",
  other: "Annet",
};

const AdminReports = () => {
  const { user, isAuthed, loading } = useAuthProfile();
  const { data: isAdmin, isLoading: roleLoading } = useIsAdmin(user?.id);
  const { data: reports = [], isLoading, error } = useReports();
  const moderate = useModerateReport();
  const navigate = useNavigate();

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

  const act = async (reportId: string, action: "ignore" | "remove") => {
    try {
      await moderate.mutateAsync({ reportId, action });
      toast.success(action === "remove" ? "Bidrag fjernet" : "Rapport ignorert");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Noe gikk galt";
      toast.error(msg);
    }
  };

  return (
    <div className="px-5 pt-[max(env(safe-area-inset-top),1.5rem)] pb-12">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} aria-label="Tilbake" className="grid h-10 w-10 place-items-center rounded-full bg-card shadow-soft tap-scale">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="font-display text-2xl font-semibold">Rapporter</h1>
          <p className="text-sm text-muted-foreground">{reports.length} aktive</p>
        </div>
      </div>

      {isLoading && <div className="mt-6 text-sm text-muted-foreground">Laster…</div>}
      {error && <div className="mt-6 text-sm text-destructive">Kunne ikke hente rapporter.</div>}
      {!isLoading && !error && reports.length === 0 && (
        <div className="mt-12 text-center text-sm text-muted-foreground">Ingen rapporter 🎉</div>
      )}

      <div className="mt-5 space-y-3">
        {reports.map((r) => {
          const c = r.contribution;
          const d = (c?.data ?? {}) as Record<string, unknown>;
          const removed = c?.status === "removed";
          return (
            <div key={r.id} className="rounded-2xl bg-card p-4 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs uppercase tracking-widest text-primary">
                    {c?.type ?? "ukjent"}
                  </div>
                  <div className="mt-0.5 truncate font-medium">
                    {r.venue?.name ?? "Ukjent sted"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {REASON_LABELS[r.reason] ?? r.reason} · {timeAgo(r.created_at)}
                  </div>
                </div>
                {removed && (
                  <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-destructive">
                    Fjernet
                  </span>
                )}
              </div>

              {c && (
                <div className="mt-3 rounded-lg bg-secondary/50 p-3 text-xs">
                  {c.type === "beer_price" && <>Pris: kr {String(d.price ?? "?")}</>}
                  {c.type === "sun_report" && <>Status: {String(d.status ?? "?")}</>}
                  {c.type === "crowd_report" && <>Stemning: {String(d.level ?? "?")}</>}
                  {c.type === "photo" && d.image_url ? (
                    <img
                      src={String(d.image_url)}
                      alt=""
                      className="h-32 w-full rounded-md object-cover"
                    />
                  ) : null}
                  {c.type === "venue_add" && <>Nytt sted</>}
                  <div className="mt-1 text-muted-foreground">+{c.points_awarded} poeng</div>
                </div>
              )}

              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={moderate.isPending}
                  onClick={() => act(r.id, "ignore")}
                >
                  Ignorer
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={moderate.isPending || removed}
                  onClick={() => act(r.id, "remove")}
                >
                  Fjern bidrag
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminReports;
