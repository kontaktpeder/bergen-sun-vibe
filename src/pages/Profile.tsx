import { Bell, Heart, MapPin, Settings, Sun } from "lucide-react";
import { useFavorites } from "@/lib/favorites";

const Profile = () => {
  const favs = useFavorites();

  const stats = [
    { label: "Lagret", value: favs.length, icon: Heart },
    { label: "Besøkt", value: 12, icon: MapPin },
    { label: "Sol-dager", value: 47, icon: Sun },
  ];

  const items = [
    { icon: Bell, label: "Varsler", desc: "Sol-alerts og tilbud" },
    { icon: MapPin, label: "Mitt område", desc: "Bergen sentrum" },
    { icon: Settings, label: "Innstillinger", desc: "Konto og preferanser" },
  ];

  return (
    <div className="pb-6">
      <div className="relative h-44 overflow-hidden bg-gradient-to-br from-primary via-sunset-pink to-sunset-purple">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-sun blur-3xl opacity-60" />
      </div>

      <div className="-mt-16 px-5">
        <div className="grid h-24 w-24 place-items-center rounded-full bg-card text-3xl shadow-float ring-4 ring-background">
          <span className="font-display font-semibold">JS</span>
        </div>
        <h1 className="mt-3 font-display text-2xl font-semibold">Jonas Solheim</h1>
        <p className="text-sm text-muted-foreground">Bergen · Medlem siden 2026</p>

        <div className="mt-5 grid grid-cols-3 gap-3">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-2xl bg-card p-4 text-center shadow-soft">
              <Icon className="mx-auto h-4 w-4 text-primary" />
              <div className="mt-1 font-display text-xl font-semibold">{value}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>

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

        <p className="mt-8 text-center text-xs text-muted-foreground">v1.0 · Laget med ☀️ i Bergen</p>
      </div>
    </div>
  );
};

export default Profile;
