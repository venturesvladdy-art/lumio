"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import type { Brief, QAItem, SkillDef } from "@/lib/types";
import { resolveSkill } from "@/lib/skills";
import { getItem } from "@/lib/content";
import { planItemIds } from "@/lib/agent";
import { useStore } from "@/lib/store";
import { useRequireAuth } from "@/lib/session";
import { useT, useTx } from "@/lib/i18n";
import { USE_DB } from "@/lib/flags";
import {
  canAnswerMore,
  dailyLimit,
  isUnlimited,
  PLANS,
  remainingToday,
} from "@/lib/plans";
import { getBadge } from "@/lib/gamification";
import { cn } from "@/lib/utils";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Pill, ProgressBar, SectionLabel } from "@/components/ui/primitives";
import { ACCENT_TILE } from "@/components/ui/accent";

interface Toast {
  id: number;
  text: string;
  icon: string;
}

export default function SessionPage() {
  return (
    <Suspense fallback={<Loader />}>
      <SessionInner />
    </Suspense>
  );
}

function SessionInner() {
  const params = useParams();
  const search = useSearchParams();
  const t = useT();
  const tx = useTx();
  const { state, hydrated, recordAnswer } = useStore();
  const { ready: authReady, user } = useRequireAuth();

  // Optional ?module=<id> scopes the session to one plan section; ?review=1
  // replays it including already-answered questions.
  const moduleId = search.get("module");
  const reviewMode = search.get("review") === "1";

  const id = String(params.skill);
  const skill = useMemo(() => resolveSkill(id), [id]);
  const progress = state.skills[skill.id];

  // Snapshot the queue of not-yet-completed items once, on first ready render.
  const [queue, setQueue] = useState<QAItem[] | null>(null);
  const builtRef = useRef(false);

  useEffect(() => {
    if (!hydrated || builtRef.current) return;
    builtRef.current = true;
    if (!progress) {
      setQueue([]);
      return;
    }
    const done = new Set(progress.completedItemIds);
    const generated = new Map(
      (progress.generatedItems ?? []).map((i) => [i.id, i] as const)
    );
    const scopedIds = moduleId
      ? progress.plan.modules.find((m) => m.id === moduleId)?.itemIds ?? []
      : planItemIds(progress.plan);
    const items = scopedIds
      .map((qid) => generated.get(qid) ?? getItem(qid))
      .filter((x): x is QAItem => Boolean(x))
      .filter((x) => reviewMode || !done.has(x.id));
    setQueue(items);
  }, [hydrated, progress, moduleId, reviewMode]);

  const [cursor, setCursor] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [text, setText] = useState(""); // numeric / free-text input
  const [grading, setGrading] = useState(false);
  const [feedback, setFeedback] = useState(""); // free-text AI feedback
  const [score, setScore] = useState<number | null>(null); // free-text score 0–5
  const [shownBriefs, setShownBriefs] = useState<Set<string>>(new Set());
  const [checked, setChecked] = useState(false);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [lastXp, setLastXp] = useState(0);
  const [combo, setCombo] = useState(0);
  const [sessionXp, setSessionXp] = useState(0);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  const pushToast = (text: string, icon: string) => {
    const tid = ++toastId.current;
    setToasts((ts) => [...ts, { id: tid, text, icon }]);
    setTimeout(() => {
      setToasts((ts) => ts.filter((x) => x.id !== tid));
    }, 3600);
  };

  // ---- Guard states ----
  if (!authReady || !user || !hydrated || queue === null) {
    return <Loader />;
  }
  if (!progress) {
    return (
      <Centered
        icon="Sparkles"
        title={t("dashboard.emptyTitle")}
        desc={t("dashboard.emptyDesc")}
      >
        <ButtonLink href={`/learn/${skill.id}`}>{t("dashboard.emptyCta")}</ButtonLink>
      </Centered>
    );
  }

  const limitReachedAtStart = !canAnswerMore(state) && sessionCount === 0;
  if (limitReachedAtStart) {
    return <LimitView />;
  }

  if (queue.length === 0) {
    return (
      <Centered
        icon="Trophy"
        title={t("session.completeTitle")}
        desc={t("session.keepGoing")}
      >
        <ButtonLink href="/dashboard">{t("session.backToDashboard")}</ButtonLink>
      </Centered>
    );
  }

  if (finished) {
    return (
      <CompletionView
        xp={sessionXp}
        correct={sessionCorrect}
        total={sessionCount}
        limited={!canAnswerMore(state)}
        moreLeft={cursor < queue.length}
        skillId={skill.id}
      />
    );
  }

  const item = queue[cursor];
  const options = tx(item.options);
  const total = queue.length;
  const isChoice = item.format === "mcq" || item.format === "truefalse";
  const isFree = item.format === "free";

  // Show the learning brief before the first question that references it.
  const briefForItem =
    item.briefClientId && !shownBriefs.has(item.briefClientId)
      ? (progress.briefs ?? []).find((b) => b.clientId === item.briefClientId)
      : undefined;
  if (briefForItem) {
    return (
      <BriefView
        brief={briefForItem}
        skill={skill}
        onContinue={() =>
          setShownBriefs((s) => new Set(s).add(briefForItem.clientId))
        }
      />
    );
  }

  const hasInput = isChoice ? selected !== null : text.trim().length > 0;

  const finalize = (
    correct: boolean,
    payload: { selectedIndex?: number; responseText?: string; score?: number | null }
  ) => {
    const res = recordAnswer(skill.id, item, correct);
    if (USE_DB) {
      // Append-only answer log (best-effort; never blocks the learner).
      void fetch("/api/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skillId: skill.id,
          questionClientId: item.id,
          type: item.format,
          selectedIndex: payload.selectedIndex,
          responseText: payload.responseText,
          score: payload.score ?? undefined,
          correct,
          xpGained: res.xpGained,
        }),
      }).catch(() => {});
    }
    setChecked(true);
    setLastCorrect(correct);
    setLastXp(res.xpGained);
    setCombo(res.combo);
    setSessionXp((x) => x + res.xpGained);
    setSessionCount((n) => n + 1);
    if (correct) setSessionCorrect((n) => n + 1);
    if (res.leveledUp) pushToast(t("dashboard.levelLabel") + " ↑", "TrendingUp");
    res.newBadges.forEach((bid) => {
      const b = getBadge(bid);
      if (b) pushToast(tx(b.name), b.icon);
    });
  };

  const check = async () => {
    if (checked || grading) return;
    if (isChoice) {
      if (selected === null) return;
      finalize(selected === item.correctIndex, { selectedIndex: selected });
    } else if (item.format === "numeric") {
      if (!text.trim()) return;
      const a = parseNum(text);
      const b = parseNum(item.answerText ?? "");
      finalize(a !== null && b !== null && a === b, { responseText: text.trim() });
    } else {
      // free-text → AI grade (Haiku)
      if (!text.trim()) return;
      setGrading(true);
      let correct = false;
      let s: number | null = null;
      let fb = "";
      try {
        const res = await fetch("/api/grade", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            skillId: skill.id,
            questionClientId: item.id,
            response: text.trim(),
          }),
        });
        const data = (await res.json()) as {
          pass?: boolean;
          score?: number;
          feedback?: string;
        };
        correct = Boolean(data.pass);
        s = typeof data.score === "number" ? data.score : null;
        fb = data.feedback ?? "";
      } catch {
        correct = text.trim().length >= 15;
      }
      setGrading(false);
      setScore(s);
      setFeedback(fb);
      finalize(correct, { responseText: text.trim(), score: s });
    }
  };

  const next = () => {
    const nextCursor = cursor + 1;
    setSelected(null);
    setText("");
    setFeedback("");
    setScore(null);
    setChecked(false);
    if (nextCursor >= queue.length || !canAnswerMore(state)) {
      setCursor(nextCursor);
      setFinished(true);
      return;
    }
    setCursor(nextCursor);
  };

  return (
    <div className="container-page max-w-2xl py-10 lg:py-14">
      {/* Toasts */}
      <div className="pointer-events-none fixed inset-x-0 top-20 z-50 flex flex-col items-center gap-2 px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="flex animate-pop items-center gap-2 rounded-full border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-amber-700 shadow-lift"
          >
            <Icon name={toast.icon} className="h-4 w-4" />
            {toast.text}
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <ButtonLink href={`/learn/${skill.id}`} variant="ghost" size="sm">
          <Icon name="ChevronLeft" className="h-4 w-4" />
          {t("session.back")}
        </ButtonLink>
        <DailyMeter />
      </div>

      {/* Progress */}
      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-slate-500">
            <span
              className={cn(
                "grid h-7 w-7 place-items-center rounded-lg",
                ACCENT_TILE[skill.accent]
              )}
            >
              <Icon name={skill.icon} className="h-4 w-4" />
            </span>
            {t("session.questionOf", { n: cursor + 1, total })}
          </span>
          {combo >= 2 && checked && lastCorrect && (
            <span className="flex items-center gap-1 font-semibold text-amber-600">
              <Icon name="Flame" className="h-4 w-4" />
              {t("session.combo", { n: combo })}
            </span>
          )}
        </div>
        <ProgressBar value={(cursor / total) * 100} />
      </div>

      {/* Question card */}
      <div key={item.id} className="mt-7 animate-fade-up">
        <div className="mb-4 flex items-center gap-2">
          <Pill tone={difficultyTone(item.difficulty)}>
            {t("plan.levelLabel")}: {item.difficulty}
          </Pill>
          <Pill tone="amber">
            <Icon name="Zap" className="h-3.5 w-3.5" />
            {item.xp} XP
          </Pill>
        </div>

        <h1 className="font-display text-2xl font-semibold leading-snug text-ink">
          {tx(item.question)}
        </h1>

        {isChoice ? (
          <div className="mt-6 grid gap-3">
            {options.map((opt, i) => {
              const isChosen = selected === i;
              const isCorrect = i === item.correctIndex;
              const showCorrect = checked && isCorrect;
              const showWrong = checked && isChosen && !isCorrect;
              return (
                <button
                  key={i}
                  disabled={checked}
                  onClick={() => setSelected(i)}
                  className={cn(
                    "flex items-center justify-between rounded-2xl border px-5 py-4 text-left text-[15px] font-medium transition-all focusable",
                    showCorrect &&
                      "border-emerald-400 bg-emerald-50 text-emerald-900",
                    showWrong && "border-rose-400 bg-rose-50 text-rose-900",
                    !checked &&
                      isChosen &&
                      "border-brand-500 bg-brand-50 text-brand-900 shadow-ring",
                    !checked &&
                      !isChosen &&
                      "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
                    checked &&
                      !showCorrect &&
                      !showWrong &&
                      "border-slate-200 bg-white text-slate-400"
                  )}
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={cn(
                        "grid h-7 w-7 shrink-0 place-items-center rounded-lg border text-xs font-bold",
                        showCorrect && "border-emerald-400 bg-emerald-400 text-white",
                        showWrong && "border-rose-400 bg-rose-400 text-white",
                        !checked && isChosen && "border-brand-500 bg-brand-500 text-white",
                        (!checked && !isChosen) ||
                          (checked && !showCorrect && !showWrong)
                          ? "border-slate-300 bg-white text-slate-500"
                          : ""
                      )}
                    >
                      {String.fromCharCode(65 + i)}
                    </span>
                    {opt}
                  </span>
                  {showCorrect && (
                    <Icon name="CheckCircle2" className="h-5 w-5 text-emerald-500" />
                  )}
                  {showWrong && <Icon name="X" className="h-5 w-5 text-rose-500" />}
                </button>
              );
            })}
          </div>
        ) : item.format === "numeric" ? (
          <div className="mt-6">
            <input
              type="text"
              inputMode="decimal"
              value={text}
              disabled={checked}
              autoFocus
              onChange={(e) => setText(e.target.value)}
              placeholder="Type your answer"
              className="h-14 w-full rounded-2xl border border-slate-300 bg-white px-5 text-lg text-ink outline-none transition-shadow placeholder:text-slate-400 focus:border-brand-400 focus:shadow-ring disabled:bg-slate-50"
            />
          </div>
        ) : (
          <div className="mt-6">
            <textarea
              value={text}
              disabled={checked || grading}
              maxLength={200}
              rows={4}
              autoFocus
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a short answer (up to 200 characters)…"
              className="w-full resize-none rounded-2xl border border-slate-300 bg-white px-5 py-4 text-[15px] leading-relaxed text-ink outline-none transition-shadow placeholder:text-slate-400 focus:border-brand-400 focus:shadow-ring disabled:bg-slate-50"
            />
            <div className="mt-1 text-right text-xs text-slate-400">
              {text.length}/200
            </div>
          </div>
        )}

        {/* Feedback */}
        {checked && (
          <div
            className={cn(
              "mt-5 animate-fade-up rounded-2xl border p-5",
              lastCorrect
                ? "border-emerald-200 bg-emerald-50"
                : "border-rose-200 bg-rose-50"
            )}
          >
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  "flex items-center gap-2 font-display text-lg font-semibold",
                  lastCorrect ? "text-emerald-700" : "text-rose-700"
                )}
              >
                <Icon
                  name={lastCorrect ? "PartyPopper" : "CircleHelp"}
                  className="h-5 w-5"
                />
                {lastCorrect ? t("session.correct") : t("session.incorrect")}
              </span>
              {lastCorrect && lastXp > 0 && (
                <span className="animate-pop rounded-full bg-amber-400 px-3 py-1 text-sm font-bold text-amber-950">
                  {t("session.xpPlus", { xp: lastXp })}
                </span>
              )}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              <span className="font-semibold text-slate-700">
                {t("session.explanation")}:{" "}
              </span>
              {tx(item.explanation)}
            </p>
            {isFree && score !== null && (
              <p className="mt-2 text-sm text-slate-600">
                <span className="font-semibold text-slate-700">Score: </span>
                {score}/5 {lastCorrect ? "· passed" : "· keep practicing"}
              </p>
            )}
            {isFree && feedback && (
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                <span className="font-semibold text-slate-700">Feedback: </span>
                {feedback}
              </p>
            )}
            {!isChoice && item.answerText && (
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                <span className="font-semibold text-slate-700">
                  {isFree ? "Model answer" : "Answer"}:{" "}
                </span>
                {item.answerText}
              </p>
            )}
          </div>
        )}

        {/* Action */}
        <div className="mt-6">
          {!checked ? (
            <Button
              onClick={() => void check()}
              disabled={!hasInput || grading}
              size="lg"
              className="w-full"
            >
              {grading ? "Grading…" : t("session.checkAnswer")}
            </Button>
          ) : (
            <Button onClick={next} size="lg" className="w-full">
              {cursor + 1 >= total || !canAnswerMore(state)
                ? t("session.finish")
                : t("session.next")}
              <Icon name="ArrowRight" className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  function DailyMeter() {
    const limit = dailyLimit(state.tier);
    if (isUnlimited(limit)) {
      return (
        <Pill tone="violet">
          <Icon name="Sparkles" className="h-3.5 w-3.5" />
          {PLANS[state.tier].name}
        </Pill>
      );
    }
    const left = remainingToday(state);
    return (
      <Pill tone={left <= 1 ? "rose" : "slate"}>
        {left}/{limit} · {PLANS[state.tier].name}
      </Pill>
    );
  }
}

function difficultyTone(d: string) {
  return d === "beginner" ? "emerald" : d === "intermediate" ? "amber" : "rose";
}

/** Parse a number from free input (tolerates commas/spaces). */
function parseNum(s: string): number | null {
  const n = Number(String(s).replace(/[,\s]/g, ""));
  return Number.isFinite(n) ? n : null;
}

/* ---------- Learning brief (Stage B) ---------- */
function BriefView({
  brief,
  skill,
  onContinue,
}: {
  brief: Brief;
  skill: SkillDef;
  onContinue: () => void;
}) {
  return (
    <div className="container-page max-w-2xl py-10 lg:py-14">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "grid h-9 w-9 place-items-center rounded-xl",
            ACCENT_TILE[skill.accent]
          )}
        >
          <Icon name="BookOpen" className="h-5 w-5" />
        </span>
        <SectionLabel>Learn this first</SectionLabel>
      </div>

      <div className="mt-6 rounded-3xl border border-brand-100 bg-brand-50/50 p-6 animate-fade-up">
        <h1 className="font-display text-2xl font-semibold leading-snug text-ink">
          {brief.title}
        </h1>
        <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-slate-700">
          {brief.body}
        </p>
      </div>

      <div className="mt-6">
        <Button onClick={onContinue} size="lg" className="w-full">
          Got it — start the questions
          <Icon name="ArrowRight" className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/* ---------- Sub-views ---------- */
function Loader() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-brand-500" />
    </div>
  );
}

function Centered({
  icon,
  title,
  desc,
  children,
}: {
  icon: string;
  title: string;
  desc: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="container-page grid min-h-[60vh] max-w-lg place-items-center py-16 text-center">
      <div>
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-brand-50 text-brand-600">
          <Icon name={icon} className="h-8 w-8" />
        </div>
        <h1 className="mt-6 font-display text-2xl font-bold text-ink">{title}</h1>
        <p className="mt-3 text-slate-600">{desc}</p>
        <div className="mt-7 flex justify-center gap-3">{children}</div>
      </div>
    </div>
  );
}

function LimitView() {
  const t = useT();
  const { state } = useStore();
  return (
    <div className="container-page grid min-h-[60vh] max-w-lg place-items-center py-16 text-center">
      <div>
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-amber-50 text-amber-600">
          <Icon name="Flame" className="h-8 w-8" />
        </div>
        <h1 className="mt-6 font-display text-2xl font-bold text-ink">
          {t("session.limitTitle")}
        </h1>
        <p className="mt-3 text-slate-600">
          {t("session.limitDesc", {
            plan: PLANS[state.tier].name,
            limit: dailyLimit(state.tier),
          })}
        </p>
        <div className="mt-7 flex justify-center gap-3">
          <ButtonLink href="/pricing">
            {t("session.seePlans")}
            <Icon name="ArrowRight" className="h-4 w-4" />
          </ButtonLink>
          <ButtonLink href="/dashboard" variant="outline">
            {t("session.backToDashboard")}
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}

function CompletionView({
  xp,
  correct,
  total,
  limited,
  moreLeft,
  skillId,
}: {
  xp: number;
  correct: number;
  total: number;
  limited: boolean;
  moreLeft: boolean;
  skillId: string;
}) {
  const t = useT();
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  return (
    <div className="container-page grid min-h-[70vh] max-w-lg place-items-center py-16 text-center">
      <div className="animate-fade-up">
        <div className="relative mx-auto h-20 w-20">
          <span className="absolute inset-0 animate-ping rounded-3xl bg-amber-200/60" />
          <span className="relative grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lift">
            <Icon name="Trophy" className="h-10 w-10" />
          </span>
        </div>
        <h1 className="mt-7 font-display text-3xl font-bold text-ink">
          {t("session.completeTitle")}
        </h1>
        <p className="mt-2 text-slate-600">
          {t("session.completeDesc", { xp })}
        </p>

        <div className="mt-7 grid grid-cols-3 gap-3">
          <SummaryStat value={`+${xp}`} label="XP" />
          <SummaryStat value={`${correct}/${total}`} label={t("dashboard.completed")} />
          <SummaryStat value={`${accuracy}%`} label={t("dashboard.accuracy")} />
        </div>

        {limited && (
          <p className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
            <Icon name="Flame" className="h-4 w-4" />
            {t("session.limitTitle")}
          </p>
        )}

        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          {moreLeft && !limited ? (
            <ButtonLink href={`/learn/${skillId}/session`} size="lg">
              <Icon name="PlayCircle" className="h-5 w-5" />
              {t("session.keepGoing")}
            </ButtonLink>
          ) : limited ? (
            <ButtonLink href="/pricing" size="lg">
              {t("session.seePlans")}
            </ButtonLink>
          ) : null}
          <ButtonLink href="/dashboard" size="lg" variant="outline">
            {t("session.backToDashboard")}
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}

function SummaryStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="font-display text-2xl font-bold text-ink">{value}</div>
      <div className="mt-0.5 text-xs text-slate-500">{label}</div>
    </div>
  );
}
