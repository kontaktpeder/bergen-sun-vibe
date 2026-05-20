import { NavLink, useLocation } from "react-router-dom";
import { Heart, Map, User, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { openShareNow } from "@/lib/share-bus";
import { FLAGS } from "@/lib/flags";

const leftItems = [
  { to: "/", icon: Heart, label: "Dine steder" },
  { to: "/explore", icon: Map, label: "Utforsk" },
];

const rightItems = [
  { to: "/profile", icon: User, label: "Profil" },
];

export function BottomNav() {
  const location = useLocation();
  const onAuth = location.pathname.startsWith("/auth");

  return (
    <nav
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 pb-[max(env(safe-area-inset-bottom),0.5rem)]"
      aria-hidden={false}
    >
      <div className="mx-auto max-w-md px-4">
        <div className="pointer-events-auto flex items-end justify-around rounded-3xl border border-white/40 bg-white/55 backdrop-blur-2xl shadow-[0_10px_30px_rgba(20,10,30,0.15)] px-2 py-2">
          {leftItems.map(({ to, icon: Icon, label }) => (
            <NavItem key={to} to={to} Icon={Icon} label={label} />
          ))}
          {FLAGS.contributionsEnabled && !onAuth && (
            <button
              onClick={() => openShareNow()}
              aria-label="Del nå"
              className="tap-scale relative flex flex-col items-center gap-0.5 px-2"
            >
              <span className="relative -mt-7 grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-primary to-sunset-pink text-white shadow-float ring-4 ring-white/60">
                <span className="absolute inset-0 -m-1 rounded-full bg-gradient-to-br from-primary to-sunset-pink opacity-50 animate-pulse-ring" />
                <Plus className="relative h-8 w-8" strokeWidth={2.6} />
              </span>
              <span className="text-[10px] font-bold text-foreground">Del nå</span>
            </button>
          )}
          {rightItems.map(({ to, icon: Icon, label }) => (
            <NavItem key={to} to={to} Icon={Icon} label={label} />
          ))}
        </div>
      </div>
    </nav>
  );
}

function NavItem({ to, Icon, label }: { to: string; Icon: typeof Heart; label: string }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      aria-label={label}
      className={({ isActive }) =>
        cn(
          "tap-scale flex min-w-[3.5rem] flex-col items-center gap-0.5 rounded-2xl px-2 py-1.5 transition-colors",
          isActive ? "text-primary" : "text-muted-foreground",
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
          <span className="text-[10px] font-medium leading-none">{label}</span>
        </>
      )}
    </NavLink>
  );
}
