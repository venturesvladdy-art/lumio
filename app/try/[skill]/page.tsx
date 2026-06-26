"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { resolveSkill } from "@/lib/skills";
import {
  getTasteBank,
  selectTasteQuestions,
  type TasteBank,
  type TasteQuestion,
} from "@/lib/taste/banks";
import { getAnonId, savePendingClaim } from "@/lib/anon";
import type { Difficulty, SkillDef } from "@/lib/types";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Pill, ProgressBar, SectionLabel } from "@/components/ui/primitives";
import { ACCENT_TILE } from "@/components/ui/accent";
import { cn } from "@/lib/utils";

type Phase = "survey" | "play" | "done";

const LEVELS: { value: Difficulty; label: string; hint: string }[] = [
  { value: "beginner", label: "New to this", hint: "Start from the basics" },
  { value: "intermediate", label: "Some experience", hint: "I know the fundamentals" },
  { value: "advanced", label: "Pretty confident", hint: "Challenge me" },
];

export default function TrySkillPage() {
  const params = useParams();
  const id = String(params.skill);
  const skill = useMemo(() => resolveSkill(id), [id]);
  const bank = useMemo(() => getTasteBank(id), [id]);

  const [phase, setPhase] = useState<Phase>("survey");
  const [level, setLevel] = useState<Difficulty>("beginner");
  const [areaKey, setAreaKey] = useState<string | null>(null);
  const [queue, setQueue] = useState<TasteQuestion[]>([]);
  const [correct, setCorrect] = useState(0);

  if (!bank) return <NotAvailable />;

  const start = () => {
    setQueue(selectTasteQuestions(bank, { areaKey: areaKey ?? undefined, level, count: 5 }));
    setPhase("play");
  };

  if (phase === "survey") {
    return (
      <Survey
        skill={skill}
        bank={bank}
        level={level}
        setLevel={setLevel}
        areaKey={areaKey}
        setAreaKey={setAreaKey}
        onStart={start}
      />
    );
  }
  if (phase === "play") {
    return (
      <Play
        skill={skill}
        queue={queue}
        onDone={(c, correctIds) => {
          setCorrect(c);
          // Stash the result so it can be claimed into a new account (Phase 3).
          savePendingClaim({
            anonId: getAnonId(),
            skillId: id,
            level,
            correctIds,
            xp: correctIds.length * 15,
            streak: 1,
          });
          setPhase("done");
        }}
      />
    );
  }
  return <Done skill={skill} correct={correct} total={queue.length} />;
}

/* ---------------- Survey ---------------- */
function Survey({
  skill,
  bank,
  level,
  setLevel,
  areaKey,
  setAreaKey,
  onStart,
}: {
  skill: SkillDef;
  bank: TasteBank;
  level: Difficulty;
  setLevel: (d: Difficulty) => void;
  areaKey: string | null;
  setAreaKey: (k: string) => void;
  onStart: () => void;
}) {
  return (
    <div className="container-page max-w-2xl py-12 lg:py-16">
      <div className="flex items-center gap-3">
        <span className={cn("grid h-11 w-11 place-items-center rounded-2xl", ACCENT_TILE[skill.accent])}>
          <Icon name={skill.icon} className="h-6 w-6" />
        </span>
        <div>
          <SectionLabel>Free taste · no signup</SectionLabel>
          <h1 className="font-display text-xl font-semibold text-ink">Try {skill.name.en}</h1>
        </div>
      </div>

      <p className="mt-5 text-slate-600">
        Two quick questions and we&apos;ll hand you 5 sample questions — answer them, peek at
        the background theory, and see how SkillSprinter feels. No account needed.
      </p>

      <div className="mt-9">
        <h2 className="font-display text-lg font-semibold text-ink">How would you place yourself?</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {LEVELS.map((l) => (
            <button
              key={l.value}
              onClick={() => setLevel(l.value)}
              className={cn(
                "rounded-2xl border px-4 py-4 text-left transition-all focusable",
                level === l.value
                  ? "border-brand-500 bg-brand-50 shadow-ring"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              )}
            >
              <div className="font-medium text-ink">{l.label}</div>
              <div className="mt-0.5 text-xs text-slate-500">{l.hint}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="font-display text-lg font-semibold text-ink">Where do you want to start?</h2>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
          {bank.areas.map((a) => {
            const on = areaKey === a.key;
            return (
              <button
                key={a.key}
                onClick={() => setAreaKey(a.key)}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all focusable",
                  on
                    ? "border-brand-500 bg-brand-50 text-brand-900 shadow-ring"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                )}
              >
                {a.name}
                {on && <Icon name="Check" className="h-4 w-4 shrink-0 text-brand-600" strokeWidth={3} />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-9">
        <Button onClick={onStart} disabled={!areaKey} size="lg" className="w-full">
          Start the taste
          <Icon name="ArrowRight" className="h-4 w-4" />
        </Button>
        <p className="mt-3 text-center text-xs text-slate-400">
          5 questions · no account needed · create one after to keep your progress
        </p>
      </div>
    </div>
  );
}

/* ---------------- Play ---------------- */
function Play({
  skill,
  queue,
  onDone,
}: {
  skill: SkillDef;
  queue: TasteQuestion[];
  onDone: (correct: number, correctIds: string[]) => void;
}) {
  const [cursor, setCursor] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [showTheory, setShowTheory] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [correctIds, setCorrectIds] = useState<string[]>([]);

  const item = queue[cursor];
  const total = queue.length;
  const isLast = cursor + 1 >= total;

  const check = () => {
    if (selected === null || checked) return;
    setChecked(true);
    if (selected === item.correctIndex) {
      setCorrect((c) => c + 1);
      setCorrectIds((ids) => [...ids, item.id]);
    }
  };

  const next = () => {
    if (isLast) {
      onDone(correct, correctIds);
      return;
    }
    setCursor((c) => c + 1);
    setSelected(null);
    setChecked(false);
    setShowTheory(false);
  };

  const lastCorrect = checked && selected === item.correctIndex;

  return (
    <div className="container-page max-w-2xl py-10 lg:py-14">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm text-slate-500">
          <span className={cn("grid h-7 w-7 place-items-center rounded-lg", ACCENT_TILE[skill.accent])}>
            <Icon name={skill.icon} className="h-4 w-4" />
          </span>
          {skill.name.en}
        </span>
        <Pill tone="violet">
          <Icon name="Sparkles" className="h-3.5 w-3.5" />
          Free taste
        </Pill>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-sm text-slate-500">
          <span>
            Question {cursor + 1} of {total}
          </span>
          <span>{Math.round((cursor / total) * 100)}%</span>
        </div>
        <ProgressBar value={(cursor / total) * 100} />
      </div>

      <div key={item.id} className="mt-7 animate-fade-up">
        <div className="mb-4">
          <Pill tone={difficultyTone(item.difficulty)}>Level: {item.difficulty}</Pill>
        </div>
        <h1 className="whitespace-pre-line font-display text-2xl font-semibold leading-snug text-ink">
          {item.question}
        </h1>

        <div className="mt-6 grid gap-3">
          {item.options.map((opt, i) => {
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
                  showCorrect && "border-emerald-400 bg-emerald-50 text-emerald-900",
                  showWrong && "border-rose-400 bg-rose-50 text-rose-900",
                  !checked && isChosen && "border-brand-500 bg-brand-50 text-brand-900 shadow-ring",
                  !checked && !isChosen && "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
                  checked && !showCorrect && !showWrong && "border-slate-200 bg-white text-slate-400"
                )}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={cn(
                      "grid h-7 w-7 shrink-0 place-items-center rounded-lg border text-xs font-bold",
                      showCorrect && "border-emerald-400 bg-emerald-400 text-white",
                      showWrong && "border-rose-400 bg-rose-400 text-white",
                      !checked && isChosen && "border-brand-500 bg-brand-500 text-white",
                      (!checked && !isChosen) || (checked && !showCorrect && !showWrong)
                        ? "border-slate-300 bg-white text-slate-500"
                        : ""
                    )}
                  >
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                </span>
                {showCorrect && <Icon name="CheckCircle2" className="h-5 w-5 text-emerald-500" />}
                {showWrong && <Icon name="X" className="h-5 w-5 text-rose-500" />}
              </button>
            );
          })}
        </div>

        {checked && (
          <div
            className={cn(
              "mt-5 animate-fade-up rounded-2xl border p-5",
              lastCorrect ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"
            )}
          >
            <span
              className={cn(
                "flex items-center gap-2 font-display text-lg font-semibold",
                lastCorrect ? "text-emerald-700" : "text-rose-700"
              )}
            >
              <Icon name={lastCorrect ? "PartyPopper" : "CircleHelp"} className="h-5 w-5" />
              {lastCorrect ? "Correct!" : "Not quite"}
            </span>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              <span className="font-semibold text-slate-700">Why: </span>
              {item.explanation}
            </p>
          </div>
        )}

        {/* Pre-stored theory (no AI) */}
        {showTheory ? (
          <div className="mt-5 animate-fade-up rounded-2xl border border-violet-200 bg-violet-50/60 p-5">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-violet-700">
              <Icon name="Lightbulb" className="h-4 w-4" />
              Background &amp; theory
            </div>
            <p className="text-sm leading-relaxed text-slate-700">{item.theory}</p>
          </div>
        ) : (
          <button
            onClick={() => setShowTheory(true)}
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-violet-600 transition-colors hover:text-violet-800"
          >
            <Icon name="Lightbulb" className="h-4 w-4" />
            Show the background &amp; theory
          </button>
        )}

        <div className="mt-6">
          {!checked ? (
            <Button onClick={check} disabled={selected === null} size="lg" className="w-full">
              Check answer
            </Button>
          ) : (
            <Button onClick={next} size="lg" className="w-full">
              {isLast ? "See your result" : "Next question"}
              <Icon name="ArrowRight" className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Done ---------------- */
function Done({ skill, correct, total }: { skill: SkillDef; correct: number; total: number }) {
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  return (
    <div className="container-page grid min-h-[70vh] max-w-lg place-items-center py-16 text-center">
      <div className="animate-fade-up">
        <div className="relative mx-auto h-20 w-20">
          <span className="absolute inset-0 animate-ping rounded-3xl bg-amber-200/60" />
          <span className="relative grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lift">
            <Icon name="Trophy" className="h-10 w-10" />
          </span>
        </div>
        <h1 className="mt-7 font-display text-3xl font-bold text-ink">That&apos;s the taste!</h1>
        <p className="mt-2 text-slate-600">
          You got <span className="font-semibold text-ink">{correct}/{total}</span> ({pct}%) on your{" "}
          {skill.name.en} sample.
        </p>

        <div className="mt-7 rounded-3xl border border-brand-100 bg-brand-50/50 p-6 text-left">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white text-brand-600 shadow-sm">
              <Icon name="Sparkles" className="h-5 w-5" />
            </span>
            <div>
              <div className="font-display font-semibold text-ink">Create a free account to keep going</div>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                Get an AI-personalized plan that adapts to you, real-time explanations, mastery
                tracking, XP and streaks — free to start.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/login?mode=signup" size="lg">
            Create a free account
            <Icon name="ArrowRight" className="h-4 w-4" />
          </ButtonLink>
          <ButtonLink href="/try" size="lg" variant="outline">
            Try another skill
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}

function NotAvailable() {
  return (
    <div className="container-page grid min-h-[60vh] max-w-lg place-items-center py-16 text-center">
      <div>
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-slate-100 text-slate-400">
          <Icon name="Compass" className="h-8 w-8" />
        </div>
        <h1 className="mt-6 font-display text-2xl font-bold text-ink">No free taste here yet</h1>
        <p className="mt-3 text-slate-600">This skill doesn&apos;t have a sample set yet — pick one that does.</p>
        <div className="mt-7 flex justify-center gap-3">
          <ButtonLink href="/try">Browse free tastes</ButtonLink>
          <ButtonLink href="/login?mode=signup" variant="outline">
            Create a free account
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}

function difficultyTone(d: string) {
  return d === "beginner" ? "emerald" : d === "intermediate" ? "amber" : "rose";
}
