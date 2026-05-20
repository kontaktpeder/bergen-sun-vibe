import { Outlet, useLocation } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { ContributeFab } from "./contribute/ContributeFab";
import { ShareNowOverlay } from "./share/ShareNowOverlay";
import { RewardOverlayHost } from "./RewardOverlay";
import { CityPickerModal } from "./CityPickerModal";
import { ScrollManager } from "./ScrollManager";
import { FLAGS } from "@/lib/flags";

export function AppLayout() {
  const location = useLocation();
  return (
    <div className="relative mx-auto min-h-screen w-full max-w-md overflow-x-hidden bg-background pb-28">
      <ScrollManager />
      <div key={location.pathname} className="animate-fade-in">
        <Outlet />
      </div>
      {/* Legacy ContributeFab kept mounted ONLY as a fallback for venue_add. */}
      {/* TODO(share-flow): remove once ShareNowOverlay handles venue creation. */}
      {FLAGS.contributionsEnabled && <ContributeFab />}
      {FLAGS.contributionsEnabled && <ShareNowOverlay />}
      <BottomNav />
      <RewardOverlayHost />
      <CityPickerModal />
    </div>
  );
}
