import { getLevel } from "@/lib/levels";
import { showReward } from "@/components/RewardOverlay";

type RewardArgs = {
  type: "sun_report" | "beer_price" | "photo" | "venue_add";
  awardedPoints: number;
  beforePoints: number;
  afterPoints: number;
  isBeerConfirm?: boolean;
};

export function showRewardFeedback(args: RewardArgs) {
  const { type, awardedPoints, beforePoints, afterPoints, isBeerConfirm } = args;

  const meta: Record<string, { emoji: string; title: string; subtitle?: string }> = {
    sun_report: { emoji: "☀️", title: "Takk! Solstatus oppdatert" },
    beer_price_new: { emoji: "🍺", title: "Takk! Ølprisen er oppdatert" },
    beer_price_confirm: { emoji: "✅", title: "Takk for bekreftelsen" },
    photo: { emoji: "📸", title: "Takk! Bildet er publisert" },
    venue_add: { emoji: "📍", title: "Stedet er lagt til" },
  };

  const key =
    type === "beer_price" ? (isBeerConfirm ? "beer_price_confirm" : "beer_price_new") : type;
  const m = meta[key];

  showReward({
    emoji: m.emoji,
    points: awardedPoints,
    title: m.title,
    variant: type === "venue_add" ? "venue" : "points",
  });

  const oldLevel = getLevel(beforePoints);
  const newLevel = getLevel(afterPoints);
  if (oldLevel !== newLevel) {
    showReward({
      emoji: "🎉",
      title: `Nivå opp! Du er nå ${newLevel}`,
      subtitle: "Fortsett å bidra for å låse opp mer.",
      variant: "levelup",
    });
  }
}
