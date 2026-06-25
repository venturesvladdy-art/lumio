"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import type { Difficulty, LearningPlan, SkillDef } from "@/lib/types";
import { resolveSkill } from "@/lib/skills";
import { focusLabels } from "@/lib/onboarding";
import { BUILD_STEPS } from "@/lib/agent";
import { requestPlan } from "@/lib/planClient";
import { SURVEY } from "@/lib/survey/skillsprinter.survey";
import { nextQuestion, surveyProgress } from "@/lib/survey/runner";
import type { SurveyAnswers } from "@/lib/survey/types";
import { useStore } from "@/lib/store";
import { useRequireAuth } from "@/lib/session";
import { useT, useTx } from "@/lib/i18n";
import { canAddSkill } from "@/lib/plans";
import { cn } from "@/lib/utils";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { LogoMark } from "@/components/ui/Logo";
import { Pill, ProgressBar, SectionLabel } from "@/components/ui/primitives";
import { ACCENT_TILE } from "@/components/ui/accent";

type Phase = "loading" | "locked" | "survey" | "pick" | "building" | "plan";

interface SubOption {
  subareaKey: string;
  name: string;
  area: string;
}
interface TaxArea {
  name: string;
  subareas: { subareaKey: string; name: string }[];
}

const LEVEL_LABEL: Record<Difficulty, { en: string; pl: string }> = {
  beginner: { en: "Beginner", pl: "Początkujący" },
  intermediate: { en: "Intermediate", pl: "Średni" },
  advanced: { en: "Advanced", pl: "Zaawansowany" },
};

export default function LearnPage() {
  return (
    <Suspense fallback={<CenteredLoader />}>
      <Onboarding />
    </Suspense>
  );
}

function CenteredLoader() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-brand-500" />
    </div>
  );
}

function Onboarding() {
  const params = useParams();
  const search = useSearchParams();
  const router = useRouter();
  const { state, hydrated, startSkill } = useStore();
  const { ready: authReady, user } = useRequireAuth();

  const id = String(params.skill);
  const name = search.get("name") ?? undefined;
  const skill = useMemo(() => resolveSkill(id, name), [id, name]);

  const forcePick = search.get("pick") === "1";
  const contAreaId = search.get("area") ?? undefined;
  const contAreaName = search.get("areaName") ?? undefined;
  const isContinue = search.get("continue") === "1";

  const [phase, setPhase] = useState<Phase>("loading");
  const [answers, setAnswers] = useState<SurveyAnswers>({});
  const [draft, setDraft] = useState<string[]>([]);
  const [areas, setAreas] = useState<TaxArea[] | null>(null);
  const [plan, setPlan] = useState<LearningPlan | null>(null);
  const didInit = useRef(false);

  const subOptions: SubOption[] = useMemo(
    () =>
      (areas ?? []).flatMap((a) =>
        a.subareas.map((s) => ({ subareaKey: s.subareaKey, name: s.name, area: a.name }))
      ),
    [areas]
  );

  // Load the taxonomy (areas → subareas) for the picker / survey.
  useEffect(() => {
    let active = true;
    fetch("/api/taxonomy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skillId: skill.id, skillName: skill.name.en }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { taxonomy?: { areas?: TaxArea[] } }) => {
        if (active) setAreas(d.taxonomy?.areas ?? []);
      })
      .catch(() => {
        if (active)
          setAreas([
            { name: "Core Areas", subareas: skill.topics.en.map((t) => ({ subareaKey: `${skill.id}:core:${t.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, name: t })) },
          ]);
      });
    return () => {
      active = false;
    };
  }, [skill.id, skill.name.en, skill.topics.en]);

  const runBuild = useCallback(
    async (subareaKey: string, subareaName: string, continueDrill = false) => {
      setPhase("building");
      const { plan: generated, items, briefs } = await requestPlan({
        skill,
        answers,
        area: { id: subareaKey, name: subareaName },
        continueDrill,
      });
      startSkill(generated, items, briefs);
      setPlan(generated);
      setPhase("plan");
    },
    [skill, answers, startSkill]
  );

  // Decide the starting phase once state + taxonomy are ready.
  useEffect(() => {
    if (!hydrated || areas === null || didInit.current) return;
    didInit.current = true;
    if (isContinue && contAreaId && contAreaName) {
      void runBuild(contAreaId, contAreaName, true);
      return;
    }
    if (forcePick) {
      setPhase("pick");
      return;
    }
    const existing = state.skills[skill.id];
    if (existing) {
      setPlan(existing.plan);
      setPhase("plan");
    } else if (!canAddSkill(state, skill.id)) {
      setPhase("locked");
    } else {
      setPhase("survey");
    }
  }, [hydrated, areas, skill.id, state, forcePick, isContinue, contAreaId, contAreaName, runBuild]);

  const current = nextQuestion(SURVEY, answers);

  // Seed the multi-select draft when the question changes.
  useEffect(() => {
    setDraft(current ? answers[current.id] ?? [] : []);
  }, [current?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!authReady || !user || phase === "loading") return <CenteredLoader />;
  if (phase === "locked") return <LockedView skill={skill} />;
  if (phase === "building") return <BuildingView skill={skill} />;
  if (phase === "plan" && plan) return <PlanView skill={skill} plan={plan} />;
  if (phase === "pick")
    return (
      <SubareaPicker
        skill={skill}
        areas={areas ?? []}
        onPick={(s) => void runBuild(s.subareaKey, s.name)}
      />
    );

  // ---- survey ----
  if (!current) {
    // Survey complete → build the first chosen subarea.
    const firstKey = (answers["subareas"] ?? [])[0];
    const firstSub = subOptions.find((s) => s.subareaKey === firstKey);
    if (firstSub) {
      void runBuild(firstSub.subareaKey, firstSub.name);
    } else {
      setPhase("pick");
    }
    return <CenteredLoader />;
  }

  const progress = surveyProgress(SURVEY, answers);

  const commitSingle = (value: string) => {
    setAnswers((a) => ({ ...a, [current.id]: [value] }));
  };
  const toggleDraft = (value: string) => {
    setDraft((d) =>
      d.includes(value) ? d.filter((v) => v !== value) : [...d, value]
    );
  };
  const isMulti = current.type === "multi" || current.type === "subareas";
  const min = current.minSelect ?? 1;
  const max = current.maxSelect ?? 99;
  const canProceed = !isMulti || (draft.length >= min && draft.length <= max);
  const confirmMulti = () => {
    if (!canProceed) return;
    setAnswers((a) => ({ ...a, [current.id]: draft }));
  };

  const back = () => {
    const answeredIds = Object.keys(answers);
    if (answeredIds.length === 0) {
      router.push("/skills");
      return;
    }
    const lastId = answeredIds[answeredIds.length - 1];
    setAnswers((a) => {
      const copy = { ...a };
      delete copy[lastId];
      return copy;
    });
  };

  return (
    <div className="container-page max-w-2xl py-12 lg:py-16">
      <div className="flex items-center gap-3">
        <span className={cn("grid h-11 w-11 place-items-center rounded-2xl", ACCENT_TILE[skill.accent])}>
          <Icon name={skill.icon} className="h-6 w-6" />
        </span>
        <div>
          <SectionLabel>Personalizing {skill.name.en}</SectionLabel>
          <h1 className="font-display text-xl font-semibold text-ink">A few quick questions</h1>
        </div>
      </div>

      <div className="mt-7">
        <div className="mb-2 flex items-center justify-between text-sm text-slate-500">
          <span>Tailoring your plan</span>
          <span>{progress}%</span>
        </div>
        <ProgressBar value={progress} />
      </div>

      <div key={current.id} className="mt-9 animate-fade-up">
        <h2 className="font-display text-2xl font-semibold leading-tight text-ink">
          {current.prompt}
        </h2>
        {current.helper && <p className="mt-2 text-sm text-slate-500">{current.helper}</p>}

        <div className="mt-6">
          {current.type === "subareas" ? (
            <SubareaChecklist
              areas={areas ?? []}
              selected={draft}
              max={max}
              onToggle={toggleDraft}
            />
          ) : (
            <div className="grid gap-3">
              {(current.options ?? []).map((o) => {
                const selected = isMulti ? draft.includes(o.value) : false;
                return (
                  <button
                    key={o.value}
                    onClick={() => (isMulti ? toggleDraft(o.value) : commitSingle(o.value))}
                    className={cn(
                      "flex items-center justify-between rounded-2xl border px-5 py-4 text-left text-[15px] font-medium transition-all focusable",
                      selected
                        ? "border-brand-500 bg-brand-50 text-brand-900 shadow-ring"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    {o.label}
                    {isMulti && (
                      <span
                        className={cn(
                          "grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors",
                          selected
                            ? "border-brand-500 bg-brand-500 text-white"
                            : "border-slate-300 bg-white text-transparent"
                        )}
                      >
                        <Icon name="Check" className="h-3.5 w-3.5" strokeWidth={3} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="mt-9 flex items-center justify-between">
        <Button variant="ghost" onClick={back}>
          <Icon name="ChevronLeft" className="h-4 w-4" />
          Back
        </Button>
        {isMulti && (
          <Button onClick={confirmMulti} disabled={!canProceed} size="lg">
            Next
            <Icon name="ChevronRight" className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

/* ---------- Subarea selection (survey question + standalone picker) ---------- */
function SubareaChecklist({
  areas,
  selected,
  max,
  onToggle,
}: {
  areas: TaxArea[];
  selected: string[];
  max: number;
  onToggle: (key: string) => void;
}) {
  return (
    <div className="space-y-5">
      {areas.map((a) => (
        <div key={a.name}>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            {a.name}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {a.subareas.map((s) => {
              const on = selected.includes(s.subareaKey);
              const disabled = !on && selected.length >= max;
              return (
                <button
                  key={s.subareaKey}
                  onClick={() => onToggle(s.subareaKey)}
                  disabled={disabled}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all focusable",
                    on
                      ? "border-brand-500 bg-brand-50 text-brand-900 shadow-ring"
                      : disabled
                      ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  {s.name}
                  {on && <Icon name="Check" className="h-4 w-4 shrink-0 text-brand-600" strokeWidth={3} />}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function SubareaPicker({
  skill,
  areas,
  onPick,
}: {
  skill: SkillDef;
  areas: TaxArea[];
  onPick: (s: { subareaKey: string; name: string }) => void;
}) {
  return (
    <div className="container-page max-w-2xl py-12 lg:py-16">
      <div className="flex items-center gap-3">
        <span className={cn("grid h-11 w-11 place-items-center rounded-2xl", ACCENT_TILE[skill.accent])}>
          <Icon name={skill.icon} className="h-6 w-6" />
        </span>
        <div>
          <SectionLabel>{skill.name.en}</SectionLabel>
          <h1 className="font-display text-xl font-semibold text-ink">Pick a subarea to drill</h1>
        </div>
      </div>
      <p className="mt-4 text-slate-600">
        We&apos;ll build a focused set of questions for it and track your level.
      </p>
      <div className="mt-8 space-y-5">
        {areas.map((a) => (
          <div key={a.name}>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {a.name}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {a.subareas.map((s) => (
                <button
                  key={s.subareaKey}
                  onClick={() => onPick(s)}
                  className="group flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-ink transition-all hover:border-brand-300 hover:bg-brand-50/40 focusable"
                >
                  {s.name}
                  <Icon
                    name="ArrowRight"
                    className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5"
                  />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Building (agent thinking) ---------- */
function BuildingView({ skill }: { skill: SkillDef }) {
  const t = useT();
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % BUILD_STEPS.length), 480);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="container-page grid min-h-[70vh] max-w-xl place-items-center py-16 text-center">
      <div>
        <div className="relative mx-auto h-20 w-20">
          <span className="absolute inset-0 animate-ping rounded-3xl bg-brand-200/60" />
          <LogoMark className="relative h-20 w-20" />
        </div>
        <h1 className="mt-8 font-display text-2xl font-semibold text-ink">
          {t("onboarding.buildingTitle")}
        </h1>
        <p className="mt-2 h-6 text-brand-600 transition-all">
          {t(`onboarding.${BUILD_STEPS[step]}`)}
        </p>
        <div className="mt-10 space-y-3 text-left">
          {[0, 1, 2].map((i) => (
            <div key={i} className="shimmer rounded-2xl border border-slate-200 bg-white p-4">
              <div className="h-3 w-1/3 rounded-full bg-slate-100" />
              <div className="mt-3 h-2 w-2/3 rounded-full bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Locked (plan limit reached) ---------- */
function LockedView({ skill }: { skill: SkillDef }) {
  const t = useT();
  const tx = useTx();
  return (
    <div className="container-page grid min-h-[60vh] max-w-lg place-items-center py-16 text-center">
      <div>
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-slate-100 text-slate-400">
          <Icon name="Lock" className="h-8 w-8" />
        </div>
        <h1 className="mt-6 font-display text-2xl font-bold text-ink">{t("skills.lockedSkill")}</h1>
        <p className="mt-3 text-slate-600">{t("skills.lockedSkillDesc")}</p>
        <p className="mt-1 text-sm text-slate-400">{tx(skill.name)}</p>
        <div className="mt-7 flex justify-center gap-3">
          <ButtonLink href="/pricing">
            {t("common.upgrade")}
            <Icon name="ArrowRight" className="h-4 w-4" />
          </ButtonLink>
          <ButtonLink href="/dashboard" variant="outline">
            {t("nav.dashboard")}
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}

/* ---------- Plan reveal ---------- */
function PlanView({ skill, plan }: { skill: SkillDef; plan: LearningPlan }) {
  const t = useT();
  const tx = useTx();
  const { state } = useStore();

  const progress = state.skills[skill.id];
  const completed = new Set(progress?.completedItemIds ?? []);
  const focuses = focusLabels(skill, plan.focus);

  return (
    <div className="container-page max-w-3xl py-12 lg:py-16">
      <div className="text-center">
        <span className="inline-block animate-pop">
          <Pill tone="emerald">
            <Icon name="CheckCircle2" className="h-4 w-4" />
            {t("plan.readyBadge")}
          </Pill>
        </span>
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          {t("plan.title", { skill: tx(skill.name) })}
        </h1>
      </div>

      <div className="mt-8 rounded-3xl border border-brand-100 bg-brand-50/50 p-6">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white text-brand-600 shadow-sm">
            <Icon name="Sparkles" className="h-5 w-5" />
          </span>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-brand-500">
              {t("plan.summaryLabel")}
            </div>
            <p className="mt-1 text-[15px] leading-relaxed text-slate-700">{tx(plan.summary)}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetaTile label={t("plan.levelLabel")} value={tx(LEVEL_LABEL[plan.level])} icon="Gauge" />
        <MetaTile label={t("plan.plannedLabel")} value={String(plan.totalPlanned)} icon="Layers" />
        <MetaTile label={t("plan.modulesLabel")} value={String(plan.modules.length)} icon="BookOpen" />
        <MetaTile label={t("plan.focusLabel")} value={String(focuses.length || 1)} icon="Target" />
      </div>

      {focuses.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {focuses.map((f) => (
            <Pill key={f.en} tone={skill.accent}>
              {tx(f)}
            </Pill>
          ))}
        </div>
      )}

      <div className="mt-8 space-y-3">
        {plan.modules.map((m, i) => {
          const playable = m.itemIds.length > 0;
          const done = m.itemIds.filter((x) => completed.has(x)).length;
          const allDone = playable && done === m.itemIds.length;
          const pct = playable ? Math.round((done / m.itemIds.length) * 100) : 0;

          const rowBody = (
            <>
              <span
                className={cn(
                  "grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-bold",
                  playable ? "bg-brand-50 text-brand-600" : "bg-slate-100 text-slate-400"
                )}
              >
                {playable ? (
                  allDone ? <Icon name="CheckCircle2" className="h-5 w-5 text-emerald-500" /> : i + 1
                ) : (
                  <Icon name="Lock" className="h-4 w-4" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="truncate font-medium text-ink">{tx(m.title)}</h3>
                  <span className="shrink-0 text-xs text-slate-400">
                    {t("plan.moduleQuestions", { n: m.plannedCount })}
                  </span>
                </div>
                {playable ? (
                  <div className="mt-2 flex items-center gap-2">
                    <ProgressBar value={pct} className="h-1.5" />
                    <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-brand-600">
                      {allDone ? t("dashboard.review") : t("dashboard.continue")}
                      <Icon name="ChevronRight" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                ) : (
                  <p className="mt-1 text-xs text-slate-400">{t("plan.planned")}</p>
                )}
              </div>
            </>
          );

          if (playable) {
            const href = `/learn/${skill.id}/session?module=${m.id}${allDone ? "&review=1" : ""}`;
            return (
              <Link
                key={m.id}
                href={href}
                className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-brand-300 hover:bg-brand-50/40 focusable"
              >
                {rowBody}
              </Link>
            );
          }
          return (
            <div key={m.id} className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-paper p-4">
              {rowBody}
            </div>
          );
        })}
      </div>

      <div className="mt-9 flex flex-col gap-3 sm:flex-row">
        <ButtonLink href={`/learn/${skill.id}/session`} size="lg" className="flex-1">
          <Icon name="PlayCircle" className="h-5 w-5" />
          {t("plan.startSession")}
        </ButtonLink>
        <ButtonLink href="/dashboard" size="lg" variant="outline" className="flex-1">
          {t("plan.goDashboard")}
        </ButtonLink>
      </div>
    </div>
  );
}

function MetaTile({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <Icon name={icon} className="h-5 w-5 text-brand-500" />
      <div className="mt-2 font-display text-lg font-semibold text-ink">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}
