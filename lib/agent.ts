import type {
  Difficulty,
  I18nText,
  LearningPlan,
  OnboardingAnswers,
  PlanModule,
  QAItem,
  SkillDef,
} from "@/lib/types";
import { itemsForSkill } from "@/lib/content";
import { deriveLevel, focusLabels } from "@/lib/onboarding";
import { delay } from "@/lib/utils";

/**
 * ────────────────────────────────────────────────────────────────────────────
 *  THE LEARNING AGENT
 * ────────────────────────────────────────────────────────────────────────────
 *  Plans are produced in `app/api/generate-plan/route.ts`:
 *    • with an ANTHROPIC_API_KEY set → Claude generates real, personalized,
 *      bilingual Q&As (see that route).
 *    • without a key → `buildBankPlan` below sequences the hand-authored bank.
 *
 *  Both paths assemble the same `LearningPlan` shape via `assemblePlan`, so the
 *  rest of the app is identical regardless of source. This module has no
 *  React/DOM/SDK imports so it can run on the server too.
 * ────────────────────────────────────────────────────────────────────────────
 */

export const MODULE_TITLES: I18nText[] = [
  { en: "Foundations", pl: "Podstawy" },
  { en: "Core Concepts", pl: "Kluczowe pojęcia" },
  { en: "Applied Practice", pl: "Praktyka w działaniu" },
  { en: "Challenge Round", pl: "Runda wyzwań" },
  { en: "Mastery", pl: "Mistrzostwo" },
];

const LEVEL_WORD: Record<Difficulty, I18nText> = {
  beginner: { en: "beginner-friendly", pl: "dla początkujących" },
  intermediate: { en: "intermediate", pl: "średnio zaawansowany" },
  advanced: { en: "advanced", pl: "zaawansowany" },
};

export function totalPlannedFor(level: Difficulty): number {
  return level === "beginner" ? 64 : level === "intermediate" ? 80 : 100;
}

function rank(d: Difficulty): number {
  return d === "beginner" ? 0 : d === "intermediate" ? 1 : 2;
}

/** Order items so the ones closest to the learner's level come first. */
export function orderItems(items: QAItem[], level: Difficulty): QAItem[] {
  const lr = rank(level);
  return [...items].sort((a, b) => {
    const da = Math.abs(rank(a.difficulty) - lr);
    const db = Math.abs(rank(b.difficulty) - lr);
    if (da !== db) return da - db;
    return rank(a.difficulty) - rank(b.difficulty);
  });
}

/** The status messages the UI cycles through while "the agent thinks". */
export const BUILD_STEPS = [
  "building1",
  "building2",
  "building3",
  "building4",
  "building5",
] as const;

function joinList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} & ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} & ${items[items.length - 1]}`;
}

/** A friendly bilingual coach note, used by the bank fallback. */
export function bankSummary(
  level: Difficulty,
  focus: { en: string; pl: string }[],
  totalPlanned: number
): I18nText {
  const focusEn = focus.map((f) => f.en);
  const focusPl = focus.map((f) => f.pl);
  const focusStrEn = focusEn.length ? joinList(focusEn) : "the essentials";
  const focusStrPl = focusPl.length ? joinList(focusPl) : "podstawy";
  return {
    en: `Based on your answers I built a ${LEVEL_WORD[level].en} plan focused on ${focusStrEn}. We'll start with fundamentals and raise the challenge as your accuracy climbs — ${totalPlanned} questions in all.`,
    pl: `Na podstawie Twoich odpowiedzi zbudowałem plan ${LEVEL_WORD[level].pl} skupiony na: ${focusStrPl}. Zaczniemy od podstaw i podniesiemy poprzeczkę wraz ze wzrostem skuteczności — łącznie ${totalPlanned} pytań.`,
  };
}

/** Assemble a LearningPlan from playable items + a summary. Shared by both paths. */
export function assemblePlan(opts: {
  skillId: string;
  level: Difficulty;
  focusValues: string[];
  summary: I18nText;
  items: QAItem[];
  createdAt: number;
}): LearningPlan {
  const { skillId, level, focusValues, summary, items, createdAt } = opts;
  const half = Math.max(1, Math.ceil(items.length / 2));
  const m1 = items.slice(0, half);
  const m2 = items.slice(half);
  const playable = items.length;

  const totalPlanned = totalPlannedFor(level);
  const lockedTotal = Math.max(0, totalPlanned - playable);
  const c3 = Math.round(lockedTotal * 0.4);
  const c4 = Math.round(lockedTotal * 0.33);
  const c5 = Math.max(0, lockedTotal - c3 - c4);

  const modules: PlanModule[] = [
    { id: "m1", title: MODULE_TITLES[0], itemIds: m1.map((i) => i.id), plannedCount: m1.length },
    { id: "m2", title: MODULE_TITLES[1], itemIds: m2.map((i) => i.id), plannedCount: m2.length },
    { id: "m3", title: MODULE_TITLES[2], itemIds: [], plannedCount: c3 },
    { id: "m4", title: MODULE_TITLES[3], itemIds: [], plannedCount: c4 },
    { id: "m5", title: MODULE_TITLES[4], itemIds: [], plannedCount: c5 },
  ];

  return { skillId, createdAt, level, focus: focusValues, totalPlanned, modules, summary };
}

export interface GeneratePlanInput {
  skill: SkillDef;
  answers: OnboardingAnswers;
}

export interface PlanResult {
  plan: LearningPlan;
  items: QAItem[];
}

/** Build a plan from the hand-authored bank (no network, no delay). */
export function buildBankPlan(
  { skill, answers }: GeneratePlanInput,
  createdAt: number = Date.now()
): PlanResult {
  const level = deriveLevel(answers);
  const focusValues = answers["focus"] ?? [];
  const focusList = focusLabels(skill, focusValues);
  const ordered = orderItems(itemsForSkill(skill.id), level);
  const summary = bankSummary(level, focusList, totalPlannedFor(level));
  const plan = assemblePlan({
    skillId: skill.id,
    level,
    focusValues,
    summary,
    items: ordered,
    createdAt,
  });
  return { plan, items: ordered };
}

/**
 * Client-side fallback used only when the API route is unreachable. Adds a
 * small delay so the "building your plan" animation reads naturally.
 */
export async function generatePlan(input: GeneratePlanInput): Promise<LearningPlan> {
  await delay(2000);
  return buildBankPlan(input).plan;
}

/** Convenience: every playable item id in a plan, in order. */
export function planItemIds(plan: LearningPlan): string[] {
  return plan.modules.flatMap((m) => m.itemIds);
}
