import { Outlet } from "react-router-dom";
import { BottomNav } from "./BottomNav";

export function AppLayout() {
  return (
    <div className="relative mx-auto min-h-screen w-full max-w-md overflow-x-hidden bg-background pb-28">
      <Outlet />
      <BottomNav />
    </div>
  );
}
