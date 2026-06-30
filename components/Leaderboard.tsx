"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { buildLeaderboard, type LeaderboardScope } from "@/lib/leaderboard";
import { Card } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

const MEDAL = ["🥇", "🥈", "🥉"];

/** Weekly / all-time leaderboard with the learner spliced in by XP. */
export function Leaderboard({ userName = "You" }: { userName?: string }) {
  const { state } = useStore();
  const [scope, setScope] = useState<LeaderboardScope>("weekly");

  const rows = buildLeaderboard(
    {
      name: userName,
      emoji: "🚀",
      weeklyXp: state.weekXp,
      totalXp: state.xp,
      streak: state.streakDays,
    },
    scope
  );

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-600">
            <Icon name="Trophy" className="h-5 w-5" />
          </span>
          <h2 className="font-display text-lg font-semibold text-ink">
            Leaderboard
          </h2>
        </div>
        <div className="flex rounded-full border border-slate-200 bg-slate-50 p-0.5 text-xs font-semibold">
          <button
            onClick={() => setScope("weekly")}
            className={cn(
              "rounded-full px-3 py-1 transition-colors",
              scope === "weekly" ? "bg-white text-ink shadow-sm" : "text-slate-400"
            )}
          >
            This week
          </button>
          <button
            onClick={() => setScope("allTime")}
            className={cn(
              "rounded-full px-3 py-1 transition-colors",
              scope === "allTime" ? "bg-white text-ink shadow-sm" : "text-slate-400"
            )}
          >
            All-time
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-1.5">
        {rows.map((r) => (
          <div
            key={r.id}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2 transition-colors",
              r.isUser
                ? "border border-brand-200 bg-brand-50"
                : "hover:bg-slate-50"
            )}
          >
            <span className="w-7 shrink-0 text-center text-sm font-bold text-slate-400">
              {r.rank <= 3 ? (
                <span className="text-base">{MEDAL[r.rank - 1]}</span>
              ) : (
                r.rank
              )}
            </span>
            <span className="text-xl" aria-hidden>
              {r.emoji}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "truncate text-sm font-semibold",
                    r.isUser ? "text-brand-700" : "text-ink"
                  )}
                >
                  {r.name}
                </span>
                {r.isUser && (
                  <span className="rounded-full bg-brand-600 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                    You
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400">Level {r.level}</div>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-sm font-bold text-ink">
                {r.score.toLocaleString()}
              </div>
              <div className="text-[10px] uppercase tracking-wide text-slate-400">
                XP
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
