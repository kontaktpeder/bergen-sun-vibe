import { Link, useNavigate } from "react-router-dom";
import { Bell, Heart, LogOut, MapPin, Settings, Shield, Sun, Trophy } from "lucide-react";
import { toast } from "sonner";
import { useFavorites } from "@/lib/favorites";
import { useAuthProfile } from "@/hooks/useAuthProfile";
import { useIsAdmin } from "@/hooks/useReports";
import { supabase } from "@/integrations/supabase/client";
import { getLevel, getNextLevelThreshold, getLevelProgress } from "@/lib/levels";

const Profile = () => {
  const favs = useFavorites();
  const navigate = useNavigate();
  const { user, profile, isAuthed, loading } = useAuthProfile();
  const { data: isAdmin } = useIsAdmin(user?.id);

  const stats = [
    { label: "Lagret", value: favs.length, icon: Heart },
    { label: "Poeng", value: profile?.points ?? 0, icon: Sun },
    { label: "Sol-dager", value: 47, icon: MapPin },
  ];

  const items = [
    { icon: Bell, label: "Varsler", desc: "Sol-alerts og tilbud" },
    { icon: MapPin, label: "Mitt område", desc: "Bergen sentrum" },
    { icon: Settings, label: "Innstillinger", desc: "Konto og preferanser" },
  ];

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) toast.error(error.message);
    else toast.success("Logget ut");
  };

  const displayName = profile?.username || user?.email?.split("@")[0] || "Gjest";
  const initials = displayName.slice(0, 2).toUpperCase();

  if (loading) {
    return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Laster…</div>;
  }

  if (!isAuthed) {
    return (
      <div className="px-5 pt-[max(env(safe-area-inset-top),1.5rem)] pb-12">
        <div className="mt-10 overflow-hidden rounded-3xl bg-gradient-to-br from-night via-sunset-purple to-primary p-7 text-white shadow-card">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-sun shadow-glow">
            <Sun className="h-6 w-6 text-night" strokeWidth={2.5} />
          </div>
          <h1 className="mt-5 font-display text-2xl font-semibold">Bli en del av Bergen</h1>
          <p className="mt-2 text-sm opacity-85">
            Logg inn for å lagre steder, samle poeng og hjelpe andre å finne sola.
          </p>
          <button
            onClick={() => navigate("/auth")}
            className="tap-scale mt-6 w-full rounded-full bg-sun py-3.5 font-semibold text-night"
          >
            Logg inn eller opprett konto
          </button>
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground">v1.0 · Laget med ☀️ i Bergen</p>
      </div>
    );
  }

  return (
    <div className="pb-6">
      <div className="relative h-44 overflow-hidden bg-gradient-to-br from-primary via-sunset-pink to-sunset-purple">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-sun blur-3xl opacity-60" />
      </div>

      <div className="-mt-16 px-5">
        <div className="grid h-24 w-24 place-items-center rounded-full bg-card text-3xl shadow-float ring-4 ring-background">
          <span className="font-display font-semibold">{initials}</span>
        </div>
        <h1 className="mt-3 font-display text-2xl font-semibold">{displayName}</h1>
        <p className="text-sm text-muted-foreground">{user?.email}</p>

        <div className="mt-5 grid grid-cols-3 gap-3">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-2xl bg-card p-4 text-center shadow-soft">
              <Icon className="mx-auto h-4 w-4 text-primary" />
              <div className="mt-1 font-display text-xl font-semibold">{value}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>

        {(() => {
          const points = profile?.points ?? 0;
          const level = getLevel(points);
          const next = getNextLevelThreshold(points);
          const nextLevel = next != null ? getLevel(next) : null;
          const progress = Math.round(getLevelProgress(points) * 100);
          return (
            <div className="mt-6 rounded-2xl bg-gradient-to-br from-primary/10 to-sunset-pink/10 p-5 shadow-soft">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">Ditt nivå</div>
                  <div className="font-display text-xl font-semibold">{level}</div>
                </div>
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full bg-gradient-to-r from-primary to-sunset-pink transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {next != null && nextLevel
                  ? `Du er ${level} – ${next - points} poeng til ${nextLevel}`
                  : `Du er ${level} – maks nivå nådd 🎉`}
              </p>
              <Link
                to="/leaderboard"
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary"
              >
                Se topplisten →
              </Link>
            </div>
          );
        })()}

        <div className="mt-6 overflow-hidden rounded-2xl bg-card shadow-soft">
          {items.map(({ icon: Icon, label, desc }, i) => (
            <button key={label} className={`tap-scale flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-secondary ${i > 0 ? "border-t border-border" : ""}`}>
              <div className="grid h-10 w-10 place-items-center rounded-full bg-secondary">
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="font-medium">{label}</div>
                <div className="text-xs text-muted-foreground">{desc}</div>
              </div>
              <span className="text-muted-foreground">›</span>
            </button>
          ))}
        </div>

        <div className="mt-8 rounded-3xl bg-gradient-to-br from-night to-sunset-purple p-6 text-white shadow-card">
          <div className="text-xs font-semibold uppercase tracking-widest opacity-80">Uteliv Pro</div>
          <h3 className="mt-1 font-display text-xl font-semibold">Få sol-alerts før alle andre</h3>
          <p className="mt-1 text-sm opacity-85">Eksklusive tilbud, push-varsler når sola treffer favorittstedene dine.</p>
          <button className="tap-scale mt-4 rounded-full bg-sun px-5 py-2.5 text-sm font-semibold text-night">Prøv 7 dager gratis</button>
        </div>

        {isAdmin && (
          <Link
            to="/admin/reports"
            className="tap-scale mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-card py-3.5 text-sm font-medium shadow-soft"
          >
            <Shield className="h-4 w-4" /> Adminpanel
          </Link>
        )}

        <button
          onClick={handleSignOut}
          className="tap-scale mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-card py-3.5 text-sm font-medium text-muted-foreground shadow-soft"
        >
          <LogOut className="h-4 w-4" /> Logg ut
        </button>

        <p className="mt-8 text-center text-xs text-muted-foreground">v1.0 · Laget med ☀️ i Bergen</p>
      </div>
    </div>
  );
};

export default Profile;
