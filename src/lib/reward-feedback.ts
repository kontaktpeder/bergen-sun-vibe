import { toast } from "sonner";
import { getLevel } from "@/lib/levels";

type RewardArgs = {
  type: "sun_report" | "beer_price" | "photo" | "venue_add";
  awardedPoints: number;
  beforePoints: number;
  afterPoints: number;
  isBeerConfirm?: boolean;
};

export function showRewardFeedback(args: RewardArgs) {
  const { type, awardedPoints, beforePoints, afterPoints, isBeerConfirm } = args;

  if (type === "beer_price" && isBeerConfirm) toast.success(`+${awardedPoints} poeng ✅`);
  else if (type === "sun_report") toast.success(`+${awardedPoints} poeng ☀️`);
  else if (type === "beer_price") toast.success(`+${awardedPoints} poeng 🍺`);
  else if (type === "photo") toast.success(`+${awardedPoints} poeng 📸`);
  else if (type === "venue_add") toast.success(`+${awardedPoints} poeng 📍`);

  const oldLevel = getLevel(beforePoints);
  const newLevel = getLevel(afterPoints);
  if (oldLevel !== newLevel) {
    toast.success(`Nivå opp! Du er nå ${newLevel} 🎉`);
  }
}
