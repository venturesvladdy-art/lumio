"use client";

import { useStore } from "@/lib/store";
import { questProgress } from "@/lib/gamification";
import { useCelebration } from "@/components/Celebration";
import { Card, ProgressBar } from "@/components/ui/primitives";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

/** Today's rotating challenges, with claimable bonus XP. */
export function DailyQuests() {
  const { state, claimQuest } = useStore();
  const { celebrate } = useCelebration();
  const quests = state.quests?.quests ?? [];
  if (quests.length === 0) return null;

  const daily = {
    xp: state.dailyXp,
    answered: state.dailyAnswered,
    correct: state.dailyCorrect,
    bestCombo: state.dailyBestCombo,
  };
  const claimedCount = quests.filter((q) => q.claimed).length;

  const onClaim = (id: string) => {
    const res = claimQuest(id);
    if (res.claimed) {
      celebrate({
        title: `+${res.xp} XP`,
        subtitle: "Quest complete!",
        icon: "Trophy",
      });
    }
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-50 text-violet-600">
            <Icon name="Target" className="h-5 w-5" />
          </span>
          <h2 className="font-display text-lg font-semibold text-ink">
            Daily quests
          </h2>
        </div>
        <span className="text-xs text-slate-400">
          {claimedCount}/{quests.length} done
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {quests.map((q) => {
          const cur = Math.min(questProgress(q, daily), q.target);
          const pct = q.target > 0 ? Math.round((cur / q.target) * 100) : 0;
          const complete = cur >= q.target;
          return (
            <div
              key={q.id}
              className={cn(
                "rounded-2xl border p-3.5",
                q.claimed
                  ? "border-emerald-200 bg-emerald-50/50"
                  : complete
                  ? "border-amber-200 bg-amber-50/60"
                  : "border-slate-200 bg-white"
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "grid h-9 w-9 shrink-0 place-items-center rounded-lg",
                    q.claimed
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-slate-100 text-slate-500"
                  )}
                >
                  <Icon name={q.claimed ? "CheckCircle2" : q.icon} className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-ink">
                      {q.label}
                    </span>
                    <span className="shrink-0 text-xs font-bold text-amber-600">
                      +{q.xpReward}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <ProgressBar
                      value={pct}
                      className="h-1.5"
                      barClassName={q.claimed ? "bg-emerald-400" : "bg-violet-400"}
                    />
                    <span className="shrink-0 text-[11px] font-medium text-slate-400">
                      {cur}/{q.target}
                    </span>
                  </div>
                </div>
              </div>

              {complete && !q.claimed && (
                <Button
                  size="sm"
                  className="mt-3 w-full"
                  onClick={() => onClaim(q.id)}
                >
                  <Icon name="Sparkles" className="h-4 w-4" />
                  Claim +{q.xpReward} XP
                </Button>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-center text-[11px] text-slate-400">
        Quests refresh every day — come back tomorrow for more.
      </p>
    </Card>
  );
}
