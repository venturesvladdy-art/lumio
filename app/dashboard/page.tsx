"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useT, useTx } from "@/lib/i18n";
import { USE_DB } from "@/lib/flags";
import { useStore } from "@/lib/store";
import { useRequireAuth, useCurrentUser } from "@/lib/session";
import { resolveSkill } from "@/lib/skills";
import { planItemIds } from "@/lib/agent";
import type { SkillMastery } from "@/lib/types";
import { LEVEL_LABEL } from "@/lib/mastery";
import {
  aggregate,
  BADGES,
  getBadge,
  levelInfo,
} from "@/lib/gamification";
import {
  activeSkillCount,
  dailyLimit,
  isUnlimited,
  PLANS,
  remainingToday,
  skillLimit,
} from "@/lib/plans";
import { cn } from "@/lib/utils";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ManageBillingButton } from "@/components/ManageBillingButton";
import { Icon } from "@/components/ui/Icon";
import {
  Card,
  Pill,
  ProgressBar,
  ProgressRing,
  SectionLabel,
} from "@/components/ui/primitives";
import { ACCENT_TILE } from "@/components/ui/accent";

export default function DashboardPage() {
  const t = useT();
  const tx = useTx();
  const { state, hydrated, resetAll } = useStore();
  const { ready: authReady, user, refresh } = useCurrentUser();
  useRequireAuth();

  // On arrival (e.g. returning from Stripe checkout) re-sync tier + progress
  // from the server once, so an upgrade made elsewhere shows up immediately.
  const refreshedRef = useRef(false);
  useEffect(() => {
    if (USE_DB && authReady && user && !refreshedRef.current) {
      refreshedRef.current = true;
      void refresh();
    }
  }, [authReady, user, refresh]);

  if (!authReady || !user || !hydrated) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-brand-500" />
      </div>
    );
  }

  const agg = aggregate(state);
  const lvl = levelInfo(state.xp);
  const tier = PLANS[state.tier];
  const skillIds = Object.keys(state.skills);
  const limit = dailyLimit(state.tier);
  const unlimited = isUnlimited(limit);
  const left = remainingToday(state);
  const doneToday = state.dailyAnswered;
  const dailyPct = unlimited
    ? Math.min(100, doneToday * 20)
    : Math.round((doneToday / limit) * 100);

  const empty = skillIds.length === 0;

  return (
    <div className="container-page py-12 lg:py-16">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <SectionLabel>{t("dashboard.title")}</SectionLabel>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            {t("dashboard.welcome")} 👋
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Pill tone="violet">
            <Icon name="Sparkles" className="h-3.5 w-3.5" />
            {t("dashboard.planLabel")}: {tier.name}
          </Pill>
          {!empty && !USE_DB && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => resetAll()}
              title="Reset demo progress"
            >
              <Icon name="RotateCcw" className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {empty ? (
        <EmptyState />
      ) : (
        <>
          {/* Stat tiles */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Level */}
            <Card className="flex items-center gap-4 p-5">
              <ProgressRing value={lvl.pct} size={84} stroke={9}>
                <div className="text-center">
                  <div className="font-display text-xl font-bold text-ink">
                    {lvl.level}
                  </div>
                </div>
              </ProgressRing>
              <div>
                <div className="font-display text-lg font-semibold text-ink">
                  {tx(lvl.title)}
                </div>
                <div className="text-xs text-slate-500">
                  {lvl.isMax
                    ? `${state.xp} XP`
                    : t("dashboard.toNext", { n: lvl.toNext })}
                </div>
              </div>
            </Card>

            {/* Total XP */}
            <StatTile
              icon="Zap"
              tone="bg-brand-50 text-brand-600"
              value={state.xp}
              label={t("dashboard.xpLabel")}
            />

            {/* Streak */}
            <StatTile
              icon="Flame"
              tone="bg-amber-50 text-amber-600"
              value={state.streakDays}
              label={`${t("dashboard.streakLabel")} · ${t("dashboard.streakUnit")}`}
            />

            {/* Daily goal */}
            <Card className="flex items-center gap-4 p-5">
              <ProgressRing
                value={dailyPct}
                size={84}
                stroke={9}
                barClassName="text-emerald-500"
              >
                <Icon name="Target" className="h-6 w-6 text-emerald-500" />
              </ProgressRing>
              <div>
                <div className="font-display text-lg font-semibold text-ink">
                  {t("dashboard.dailyGoal")}
                </div>
                <div className="text-xs text-slate-500">
                  {unlimited
                    ? t("dashboard.dailyUnlimited", { done: doneToday })
                    : t("dashboard.dailyDone", { done: doneToday, limit })}
                </div>
              </div>
            </Card>
          </div>

          {/* Main grid */}
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            {/* Skills */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-semibold text-ink">
                  {t("dashboard.skillsTitle")}
                </h2>
                <ButtonLink href="/skills" variant="soft" size="sm">
                  <Icon name="Plus" className="h-4 w-4" />
                  {t("dashboard.addSkill")}
                </ButtonLink>
              </div>

              <div className="mt-4 space-y-4">
                {skillIds.map((sid) => {
                  const skill = resolveSkill(sid);
                  const prog = state.skills[sid];
                  const playable = planItemIds(prog.plan);
                  const done = playable.filter((x) =>
                    prog.completedItemIds.includes(x)
                  ).length;
                  const pct = playable.length
                    ? Math.round((done / playable.length) * 100)
                    : 0;
                  const acc =
                    prog.completedItemIds.length > 0
                      ? Math.round(
                          (prog.correctItemIds.length /
                            prog.completedItemIds.length) *
                            100
                        )
                      : 0;
                  const finishedAll = done === playable.length && done > 0;
                  return (
                    <Card key={sid} className="p-5">
                      <div className="flex items-start gap-4">
                        <span
                          className={cn(
                            "grid h-12 w-12 shrink-0 place-items-center rounded-2xl",
                            ACCENT_TILE[skill.accent]
                          )}
                        >
                          <Icon name={skill.icon} className="h-6 w-6" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <Link
                              href={`/learn/${sid}`}
                              className="truncate font-display text-lg font-semibold text-ink hover:text-brand-700"
                            >
                              {tx(skill.name)}
                            </Link>
                            <span className="shrink-0 text-sm text-slate-400">
                              {prog.plan.level}
                            </span>
                          </div>

                          <div className="mt-3 flex items-center gap-3">
                            <ProgressBar value={pct} />
                            <span className="shrink-0 text-xs font-medium text-slate-500">
                              {done}/{playable.length}
                            </span>
                          </div>

                          <div className="mt-4 flex flex-wrap items-center gap-2">
                            <ButtonLink
                              href={`/learn/${sid}/session`}
                              size="sm"
                              variant={finishedAll ? "outline" : "primary"}
                            >
                              <Icon
                                name={finishedAll ? "RotateCcw" : "PlayCircle"}
                                className="h-4 w-4"
                              />
                              {finishedAll
                                ? t("dashboard.review")
                                : t("dashboard.continue")}
                            </ButtonLink>
                            {tier.tracking && prog.completedItemIds.length > 0 && (
                              <>
                                <Pill tone="emerald">
                                  <Icon name="Target" className="h-3.5 w-3.5" />
                                  {acc}% {t("dashboard.accuracy")}
                                </Pill>
                                {prog.bestCombo >= 2 && (
                                  <Pill tone="amber">
                                    <Icon name="Flame" className="h-3.5 w-3.5" />
                                    {prog.bestCombo}
                                  </Pill>
                                )}
                              </>
                            )}
                          </div>

                          <SubareaLevels mastery={state.mastery?.[sid]} skillId={sid} />
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-6">
              {/* Badges */}
              <Card className="p-5">
                <h2 className="font-display text-lg font-semibold text-ink">
                  {t("dashboard.badgesTitle")}
                </h2>
                {state.earnedBadges.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-500">
                    {t("dashboard.badgesEmpty")}
                  </p>
                ) : null}
                <div className="mt-4 grid grid-cols-4 gap-3">
                  {BADGES.map((b) => {
                    const earned = state.earnedBadges.includes(b.id);
                    return (
                      <div
                        key={b.id}
                        title={`${tx(b.name)} — ${tx(b.desc)}`}
                        className={cn(
                          "group grid aspect-square place-items-center rounded-2xl border transition-all",
                          earned
                            ? "border-amber-200 bg-amber-50 text-amber-600"
                            : "border-slate-100 bg-slate-50 text-slate-300"
                        )}
                      >
                        <Icon name={earned ? b.icon : "Lock"} className="h-6 w-6" />
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Plan / usage */}
              <Card className="p-5">
                <h2 className="font-display text-lg font-semibold text-ink">
                  {t("dashboard.planLabel")}: {tier.name}
                </h2>

                {/* skills usage */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <span>{t("nav.skills")}</span>
                    <span>
                      {isUnlimited(skillLimit(state.tier))
                        ? `${activeSkillCount(state)} · ∞`
                        : t("dashboard.skillsLimit", {
                            used: activeSkillCount(state),
                            limit: skillLimit(state.tier),
                          })}
                    </span>
                  </div>
                  {!isUnlimited(skillLimit(state.tier)) && (
                    <ProgressBar
                      className="mt-2"
                      value={
                        (activeSkillCount(state) / skillLimit(state.tier)) * 100
                      }
                    />
                  )}
                </div>

                {/* daily usage */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <span>{t("dashboard.dailyGoal")}</span>
                    <span>
                      {unlimited ? `${doneToday} · ∞` : `${doneToday}/${limit}`}
                    </span>
                  </div>
                  {!unlimited && (
                    <ProgressBar className="mt-2" value={dailyPct} />
                  )}
                </div>

                {state.tier !== "guru" && (
                  <ButtonLink href="/pricing" className="mt-5 w-full" variant="soft">
                    <Icon name="TrendingUp" className="h-4 w-4" />
                    {t("dashboard.upgradeForMore")}
                  </ButtonLink>
                )}
                <ManageBillingButton />
              </Card>

              {/* Tracking upsell for Basic */}
              {!tier.tracking && (
                <Card className="border-brand-100 bg-brand-50/40 p-5">
                  <div className="flex items-center gap-2 text-brand-700">
                    <Icon name="LineChart" className="h-5 w-5" />
                    <span className="font-medium">Smart</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    {t("home.feat1Desc")}
                  </p>
                  <ButtonLink href="/pricing" size="sm" className="mt-4">
                    {t("common.upgrade")}
                  </ButtonLink>
                </Card>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const LEVEL_TONE: Record<string, "slate" | "sky" | "brand" | "violet"> = {
  beginner: "slate",
  intermediate: "sky",
  advanced: "brand",
  expert: "violet",
};

/** v2: per-subarea mastery levels with drill-in links + overall skill level. */
function SubareaLevels({ mastery, skillId }: { mastery?: SkillMastery; skillId: string }) {
  if (!mastery || mastery.subareas.length === 0) return null;
  return (
    <div className="mt-4 border-t border-slate-100 pt-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Mastery
        </div>
        <Pill tone={LEVEL_TONE[mastery.level]}>
          <Icon name="Gauge" className="h-3.5 w-3.5" />
          {LEVEL_LABEL[mastery.level]} · {mastery.pct}%
        </Pill>
      </div>
      <div className="mt-3 space-y-2.5">
        {mastery.subareas.map((s) => (
          <Link
            key={s.subareaKey}
            href={`/learn/${skillId}?area=${encodeURIComponent(s.subareaKey)}&areaName=${encodeURIComponent(s.name)}&continue=1`}
            className="group block"
          >
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="truncate font-medium text-slate-700 group-hover:text-brand-700">
                {s.name}
              </span>
              <span className="shrink-0 text-xs font-semibold text-slate-500">
                {LEVEL_LABEL[s.level]}
                {s.level !== "expert" ? ` · ${s.pctToNext}% to next` : ""}
              </span>
            </div>
            <ProgressBar value={s.level === "expert" ? 100 : s.pctToNext} className="mt-1 h-1.5" />
          </Link>
        ))}
      </div>
    </div>
  );
}

function StatTile({
  icon,
  tone,
  value,
  label,
}: {
  icon: string;
  tone: string;
  value: number | string;
  label: string;
}) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <span className={cn("grid h-14 w-14 place-items-center rounded-2xl", tone)}>
        <Icon name={icon} className="h-7 w-7" />
      </span>
      <div>
        <div className="font-display text-2xl font-bold text-ink">{value}</div>
        <div className="text-xs text-slate-500">{label}</div>
      </div>
    </Card>
  );
}

function EmptyState() {
  const t = useT();
  return (
    <Card className="mt-10 p-12 text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-brand-50 text-brand-600">
        <Icon name="Compass" className="h-8 w-8" />
      </div>
      <h2 className="mt-6 font-display text-2xl font-bold text-ink">
        {t("dashboard.emptyTitle")}
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-slate-600">
        {t("dashboard.emptyDesc")}
      </p>
      <div className="mt-7">
        <ButtonLink href="/skills" size="lg">
          {t("dashboard.emptyCta")}
          <Icon name="ArrowRight" className="h-4 w-4" />
        </ButtonLink>
      </div>
    </Card>
  );
}
