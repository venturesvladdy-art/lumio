"use client";

import { useStore } from "@/lib/store";
import { aggregate, badgesForDisplay, type BadgeDef, type BadgeProgress } from "@/lib/gamification";
import { useTx } from "@/lib/i18n";
import { Card, ProgressBar } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

const TIER_CHIP: Record<string, string> = {
  gold: "bg-gradient-to-br from-amber-400 to-orange-500 text-white",
  silver: "bg-gradient-to-br from-slate-300 to-slate-500 text-white",
  bronze: "bg-gradient-to-br from-orange-300 to-amber-600 text-white",
};

const TIER_LABEL: Record<string, string> = {
  gold: "Gold",
  silver: "Silver",
  bronze: "Bronze",
};

/** Prominent achievements panel: earned badges shine; locked ones show a
 *  progress bar and exactly what's left — closest wins surface first. */
export function Achievements() {
  const tx = useTx();
  const { state } = useStore();
  const a = aggregate(state);
  const items = badgesForDisplay(a);
  const earned = items.filter((i) => i.prog.earned).length;
  const total = items.length;

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 text-amber-600">
            <Icon name="Trophy" className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">
              Achievements
            </h2>
            <p className="text-xs text-slate-500">
              {earned} of {total} unlocked
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ProgressBar
            value={(earned / total) * 100}
            className="h-2 w-28"
            barClassName="bg-amber-400"
          />
          <span className="text-xs font-semibold text-amber-600">
            {Math.round((earned / total) * 100)}%
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ badge, prog }) => (
          <BadgeTile key={badge.id} badge={badge} prog={prog} name={tx(badge.name)} desc={tx(badge.desc)} />
        ))}
      </div>
    </Card>
  );
}

function BadgeTile({
  badge,
  prog,
  name,
  desc,
}: {
  badge: BadgeDef;
  prog: BadgeProgress;
  name: string;
  desc: string;
}) {
  const earned = prog.earned;
  return (
    <div
      className={cn(
        "relative flex gap-3 rounded-2xl border p-3.5 transition-all",
        earned
          ? "border-amber-200 bg-amber-50/60"
          : "border-slate-200 bg-white hover:border-slate-300"
      )}
    >
      <span
        className={cn(
          "grid h-11 w-11 shrink-0 place-items-center rounded-xl",
          earned ? TIER_CHIP[badge.tier] : "bg-slate-100 text-slate-300"
        )}
      >
        <Icon name={earned ? badge.icon : "Lock"} className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className={cn("truncate text-sm font-semibold", earned ? "text-ink" : "text-slate-600")}>
            {name}
          </span>
          <span
            className={cn(
              "shrink-0 text-[10px] font-bold uppercase tracking-wide",
              earned ? "text-amber-600" : "text-slate-300"
            )}
          >
            {TIER_LABEL[badge.tier]}
          </span>
        </div>
        <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{desc}</p>
        {earned ? (
          <div className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
            <Icon name="CheckCircle2" className="h-3.5 w-3.5" />
            Unlocked
          </div>
        ) : (
          <div className="mt-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>
                {prog.cur}/{prog.target}
              </span>
              <span>{prog.remaining} to go</span>
            </div>
            <ProgressBar value={prog.pct} className="mt-1 h-1.5" barClassName="bg-brand-400" />
          </div>
        )}
      </div>
    </div>
  );
}
