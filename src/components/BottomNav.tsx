import { NavLink, useLocation } from "react-router-dom";
import { Home, Map, Heart, User, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { openContributeFab } from "@/lib/contribute-bus";
import { FLAGS } from "@/lib/flags";
import { useHideOnScroll } from "@/hooks/useScrollDirection";

const items = [
  { to: "/", icon: Home, label: "Hjem" },
  { to: "/explore", icon: Map, label: "Kart" },
  { to: "/favorites", icon: Heart, label: "Lagret" },
  { to: "/profile", icon: User, label: "Profil" },
];

export function BottomNav() {
  const location = useLocation();
  const onAuth = location.pathname.startsWith("/auth");
  const hidden = useHideOnScroll(48);

  return (
    <nav
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-0 z-40 pb-[max(env(safe-area-inset-bottom),0.5rem)] transition-all duration-300 ease-out",
        hidden ? "translate-y-[120%] opacity-0" : "translate-y-0 opacity-100",
      )}
      aria-hidden={hidden}
    >
      <div className="mx-auto max-w-md px-4">
        <div className="pointer-events-auto flex items-center justify-around rounded-full glass shadow-float py-2">
          {items.slice(0, 2).map(({ to, icon: Icon, label }) => (
            <NavItem key={to} to={to} Icon={Icon} label={label} />
          ))}
          {FLAGS.contributionsEnabled && !onAuth && (
            <button
              onClick={() => openContributeFab("venue")}
              aria-label="Legg til nytt sted"
              className="tap-scale -my-3 grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-primary to-sunset-pink text-white shadow-float"
            >
              <Plus className="h-6 w-6" strokeWidth={2.5} />
            </button>
          )}
          {items.slice(2).map(({ to, icon: Icon, label }) => (
            <NavItem key={to} to={to} Icon={Icon} label={label} />
          ))}
        </div>
      </div>
    </nav>
  );
}

function NavItem({ to, Icon, label }: { to: string; Icon: typeof Home; label: string }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) => cn(
        "tap-scale relative flex flex-col items-center gap-0.5 rounded-full px-3 py-2 transition-colors",
        isActive ? "text-primary" : "text-muted-foreground",
      )}
    >
      {({ isActive }) => (
        <>
          {isActive && <span className="absolute inset-0 -z-10 rounded-full bg-primary/10" />}
          <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
          <span className="text-[10px] font-medium leading-none">{label}</span>
        </>
      )}
    </NavLink>
  );
}
