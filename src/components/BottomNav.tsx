import { NavLink } from "react-router-dom";
import { Home, Map, Heart, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", icon: Home, label: "Hjem" },
  { to: "/explore", icon: Map, label: "Kart" },
  { to: "/favorites", icon: Heart, label: "Lagret" },
  { to: "/profile", icon: User, label: "Profil" },
];

export function BottomNav() {
  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 pb-[max(env(safe-area-inset-bottom),0.5rem)]">
      <div className="mx-auto max-w-md px-4">
        <div className="pointer-events-auto flex items-center justify-around rounded-full glass shadow-float py-2">
          {items.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) => cn(
                "tap-scale relative flex flex-col items-center gap-0.5 rounded-full px-4 py-2 transition-colors",
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
          ))}
        </div>
      </div>
    </nav>
  );
}
