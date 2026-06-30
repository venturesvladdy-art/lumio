"use client";

import { useStore } from "@/lib/store";
import { masteryTrophies } from "@/lib/gamification";
import { resolveSkill } from "@/lib/skills";
import { useTx } from "@/lib/i18n";
import { Card, ProgressBar } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/Icon";
import { ACCENT_TILE } from "@/components/ui/accent";
import { cn } from "@/lib/utils";

const LEVEL_LABEL: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  expert: "Expert",
};

/** One trophy per skill, earned at Expert mastery. Renders nothing until the
 *  mastery system has data (tracking tiers / DB mode). */
export function MasteryTrophies() {
  const tx = useTx();
  const { state } = useStore();
  const trophies = masteryTrophies(state);
  if (trophies.length === 0) return null;
  const mastered = trophies.filter((t) => t.earned).length;

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 text-amber-600">
            <Icon name="Medal" className="h-5 w-5" />
          </span>
          <h2 className="font-display text-lg font-semibold text-ink">
            Mastery trophies
          </h2>
        </div>
        <span className="text-xs text-slate-400">{mastered} mastered</span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {trophies.map((t) => {
          const skill = resolveSkill(t.skillId);
          return (
            <div
              key={t.skillId}
              className={cn(
                "rounded-2xl border p-3",
                t.earned ? "border-amber-200 bg-amber-50/60" : "border-slate-200 bg-white"
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "relative grid h-11 w-11 shrink-0 place-items-center rounded-xl",
                    t.earned
                      ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white"
                      : ACCENT_TILE[skill.accent]
                  )}
                >
                  <Icon name={skill.icon} className="h-5 w-5" />
                  {t.earned && (
                    <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-white shadow-sm">
                      <Icon name="Trophy" className="h-3 w-3 text-amber-500" />
                    </span>
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-ink">
                    {tx(skill.name)}
                  </div>
                  <div className="text-xs text-slate-500">
                    {t.earned ? "Mastered 🏆" : `${LEVEL_LABEL[t.level]} · ${t.pct}%`}
                  </div>
                  {!t.earned && <ProgressBar value={t.pct} className="mt-1.5 h-1.5" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
