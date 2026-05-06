import { Outlet } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { ContributeFab } from "./contribute/ContributeFab";
import { RewardOverlayHost } from "./RewardOverlay";
import { CityPickerModal } from "./CityPickerModal";
import { FLAGS } from "@/lib/flags";

export function AppLayout() {
  return (
    <div className="relative mx-auto min-h-screen w-full max-w-md overflow-x-hidden bg-background pb-28">
      <Outlet />
      {FLAGS.contributionsEnabled && <ContributeFab />}
      <BottomNav />
      <RewardOverlayHost />
      <CityPickerModal />
    </div>
  );
}
