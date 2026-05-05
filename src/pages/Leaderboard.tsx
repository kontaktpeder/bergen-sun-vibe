import { Link } from "react-router-dom";
import { ArrowLeft, Trophy } from "lucide-react";
import { useLeaderboard } from "@/hooks/useLeaderboard";

const medal = (rank: number) => (rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`);

const Leaderboard = () => {
  const { data: entries = [], isLoading, error } = useLeaderboard(10);

  return (
    <div className="px-5 pt-[max(env(safe-area-inset-top),1.5rem)] pb-12">
      <div className="flex items-center gap-3">
        <Link to="/profile" className="grid h-10 w-10 place-items-center rounded-full bg-card shadow-soft">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-semibold">Topplisten</h1>
          <p className="text-sm text-muted-foreground">Bergens mest aktive sol-bidragsytere</p>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl bg-card shadow-soft">
        {isLoading && <div className="p-6 text-sm text-muted-foreground">Laster…</div>}
        {error && <div className="p-6 text-sm text-destructive">Kunne ikke hente topplisten.</div>}
        {!isLoading && !error && entries.length === 0 && (
          <div className="grid place-items-center gap-2 p-10 text-center">
            <Trophy className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Ingen bidrag ennå – bli den første!</p>
          </div>
        )}
        {entries.map((e, i) => {
          const rank = i + 1;
          const initials = (e.username ?? "Anonym").slice(0, 2).toUpperCase();
          return (
            <div
              key={e.id}
              className={`flex items-center gap-4 px-5 py-4 ${i > 0 ? "border-t border-border" : ""}`}
            >
              <div className="w-10 text-center font-display text-lg font-semibold">{medal(rank)}</div>
              {e.avatarUrl ? (
                <img src={e.avatarUrl} alt="" className="h-11 w-11 rounded-full object-cover" />
              ) : (
                <div className="grid h-11 w-11 place-items-center rounded-full bg-secondary font-display text-sm font-semibold">
                  {initials}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{e.username ?? "Anonym"}</div>
                <div className="text-xs text-muted-foreground">{e.level}</div>
              </div>
              <div className="text-right">
                <div className="font-display text-lg font-semibold">{e.points}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">poeng</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Leaderboard;
