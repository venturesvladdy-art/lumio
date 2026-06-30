import type { SurveyAnswers } from "@/lib/survey/types";
import type {
  DailyQuests,
  I18nText,
  MasteryLevel,
  Quest,
  UserState,
  XpGoals,
} from "@/lib/types";

/** ---- Levels ---- */

export interface LevelDef {
  /** cumulative XP needed to reach this level */
  threshold: number;
  title: I18nText;
}

export const LEVELS: LevelDef[] = [
  { threshold: 0, title: { en: "Novice", pl: "Nowicjusz" } },
  { threshold: 50, title: { en: "Apprentice", pl: "Adept" } },
  { threshold: 120, title: { en: "Explorer", pl: "Odkrywca" } },
  { threshold: 220, title: { en: "Skilled", pl: "Wprawny" } },
  { threshold: 360, title: { en: "Sharp", pl: "Bystry" } },
  { threshold: 560, title: { en: "Expert", pl: "Ekspert" } },
  { threshold: 820, title: { en: "Master", pl: "Mistrz" } },
  { threshold: 1150, title: { en: "Grandmaster", pl: "Arcymistrz" } },
  { threshold: 1600, title: { en: "Sage", pl: "Mędrzec" } },
  { threshold: 2200, title: { en: "Luminary", pl: "Luminarz" } },
];

export interface LevelInfo {
  level: number; // 1-based
  title: I18nText;
  base: number; // xp at start of this level
  next: number | null; // xp needed for next level (null if max)
  into: number; // xp earned within current level
  span: number; // xp span of current level
  pct: number; // 0..100 progress to next level
  toNext: number; // xp remaining to next level (0 if max)
  isMax: boolean;
}

export function levelInfo(xp: number): LevelInfo {
  let idx = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].threshold) idx = i;
    else break;
  }
  const current = LEVELS[idx];
  const nextDef = LEVELS[idx + 1] ?? null;
  const base = current.threshold;
  const next = nextDef ? nextDef.threshold : null;
  const span = next !== null ? next - base : 0;
  const into = xp - base;
  const pct = next !== null ? Math.min(100, Math.round((into / span) * 100)) : 100;
  return {
    level: idx + 1,
    title: current.title,
    base,
    next,
    into,
    span,
    pct,
    toNext: next !== null ? Math.max(0, next - xp) : 0,
    isMax: next === null,
  };
}

/** ---- Aggregates derived from user state ---- */

export interface Aggregate {
  answered: number;
  correct: number;
  bestCombo: number;
  skills: number;
  streak: number;
  xp: number;
  level: number;
  accuracy: number; // 0..100
  /** number of skills at Expert mastery (drives mastery badges/trophies) */
  expertSkills: number;
}

export function aggregate(state: UserState): Aggregate {
  let answered = 0;
  let correct = 0;
  let bestCombo = 0;
  for (const p of Object.values(state.skills)) {
    answered += p.completedItemIds.length;
    correct += p.correctItemIds.length;
    bestCombo = Math.max(bestCombo, p.bestCombo);
  }
  const expertSkills = state.mastery
    ? Object.values(state.mastery).filter((m) => m.level === "expert").length
    : 0;
  return {
    answered,
    correct,
    bestCombo,
    skills: Object.keys(state.skills).length,
    streak: state.streakDays,
    xp: state.xp,
    level: levelInfo(state.xp).level,
    accuracy: answered > 0 ? Math.round((correct / answered) * 100) : 0,
    expertSkills,
  };
}

/** ---- Badges ---- */

export type BadgeTier = "bronze" | "silver" | "gold";

export interface BadgeDef {
  id: string;
  name: I18nText;
  desc: I18nText;
  icon: string; // lucide-react icon name
  tier: BadgeTier;
  /** [current, target] used both to test earned (cur >= target) and to render a progress bar. */
  progress: (a: Aggregate) => [number, number];
}

/** Accuracy only counts once there's a meaningful sample. */
const ratedAccuracy = (a: Aggregate) => (a.answered >= 20 ? a.accuracy : 0);

export const BADGES: BadgeDef[] = [
  {
    id: "first-step",
    name: { en: "First Step", pl: "Pierwszy krok" },
    desc: { en: "Answer your first question", pl: "Odpowiedz na pierwsze pytanie" },
    icon: "Footprints",
    tier: "bronze",
    progress: (a) => [a.answered, 1],
  },
  {
    id: "sharp-shooter",
    name: { en: "Sharpshooter", pl: "Strzelec wyborowy" },
    desc: { en: "Answer 10 correctly", pl: "Odpowiedz poprawnie 10 razy" },
    icon: "Target",
    tier: "bronze",
    progress: (a) => [a.correct, 10],
  },
  {
    id: "scholar",
    name: { en: "Scholar", pl: "Erudyta" },
    desc: { en: "Answer 25 correctly", pl: "Odpowiedz poprawnie 25 razy" },
    icon: "GraduationCap",
    tier: "silver",
    progress: (a) => [a.correct, 25],
  },
  {
    id: "centurion",
    name: { en: "Centurion", pl: "Centurion" },
    desc: { en: "Answer 100 correctly", pl: "Odpowiedz poprawnie 100 razy" },
    icon: "Trophy",
    tier: "gold",
    progress: (a) => [a.correct, 100],
  },
  {
    id: "on-fire",
    name: { en: "On Fire", pl: "W ogniu" },
    desc: { en: "Reach a 3-day streak", pl: "Osiągnij 3-dniową passę" },
    icon: "Flame",
    tier: "bronze",
    progress: (a) => [a.streak, 3],
  },
  {
    id: "unstoppable",
    name: { en: "Unstoppable", pl: "Nie do zatrzymania" },
    desc: { en: "Reach a 7-day streak", pl: "Osiągnij 7-dniową passę" },
    icon: "Rocket",
    tier: "silver",
    progress: (a) => [a.streak, 7],
  },
  {
    id: "fortnight",
    name: { en: "Two-Week Titan", pl: "Tytan dwóch tygodni" },
    desc: { en: "Reach a 14-day streak", pl: "Osiągnij 14-dniową passę" },
    icon: "CalendarCheck",
    tier: "gold",
    progress: (a) => [a.streak, 14],
  },
  {
    id: "combo-5",
    name: { en: "Combo Master", pl: "Mistrz combo" },
    desc: { en: "Get 5 correct in a row", pl: "Zdobądź 5 poprawnych z rzędu" },
    icon: "Zap",
    tier: "bronze",
    progress: (a) => [a.bestCombo, 5],
  },
  {
    id: "combo-10",
    name: { en: "Combo Legend", pl: "Legenda combo" },
    desc: { en: "Get 10 correct in a row", pl: "Zdobądź 10 poprawnych z rzędu" },
    icon: "Sparkles",
    tier: "silver",
    progress: (a) => [a.bestCombo, 10],
  },
  {
    id: "sniper",
    name: { en: "Sniper", pl: "Snajper" },
    desc: { en: "Hold 90% accuracy (20+ answered)", pl: "Utrzymaj 90% celności (20+ odpowiedzi)" },
    icon: "Crosshair",
    tier: "gold",
    progress: (a) => [ratedAccuracy(a), 90],
  },
  {
    id: "explorer",
    name: { en: "Explorer", pl: "Odkrywca" },
    desc: { en: "Learn 3 different skills", pl: "Ucz się 3 różnych umiejętności" },
    icon: "Compass",
    tier: "bronze",
    progress: (a) => [a.skills, 3],
  },
  {
    id: "polymath",
    name: { en: "Polymath", pl: "Erudyta wszechstronny" },
    desc: { en: "Learn 5 different skills", pl: "Ucz się 5 różnych umiejętności" },
    icon: "Library",
    tier: "silver",
    progress: (a) => [a.skills, 5],
  },
  {
    id: "rising-star",
    name: { en: "Rising Star", pl: "Wschodząca gwiazda" },
    desc: { en: "Reach level 3", pl: "Osiągnij poziom 3" },
    icon: "Star",
    tier: "bronze",
    progress: (a) => [a.level, 3],
  },
  {
    id: "sharp-mind",
    name: { en: "Sharp Mind", pl: "Bystry umysł" },
    desc: { en: "Reach level 5", pl: "Osiągnij poziom 5" },
    icon: "Brain",
    tier: "silver",
    progress: (a) => [a.level, 5],
  },
  {
    id: "high-roller",
    name: { en: "High Roller", pl: "Wysoki lot" },
    desc: { en: "Earn 500 total XP", pl: "Zdobądź 500 XP łącznie" },
    icon: "Gem",
    tier: "silver",
    progress: (a) => [a.xp, 500],
  },
  {
    id: "luminary",
    name: { en: "XP Luminary", pl: "Luminarz XP" },
    desc: { en: "Earn 1,000 total XP", pl: "Zdobądź 1000 XP łącznie" },
    icon: "Crown",
    tier: "gold",
    progress: (a) => [a.xp, 1000],
  },
  {
    id: "skill-master",
    name: { en: "Skill Master", pl: "Mistrz umiejętności" },
    desc: { en: "Reach Expert in any skill", pl: "Osiągnij poziom Ekspert w dowolnej umiejętności" },
    icon: "Medal",
    tier: "gold",
    progress: (a) => [a.expertSkills, 1],
  },
  {
    id: "mastermind",
    name: { en: "Mastermind", pl: "Mózg operacji" },
    desc: { en: "Master 3 different skills", pl: "Opanuj 3 różne umiejętności" },
    icon: "Award",
    tier: "gold",
    progress: (a) => [a.expertSkills, 3],
  },
];

export function getBadge(id: string): BadgeDef | undefined {
  return BADGES.find((b) => b.id === id);
}

export interface BadgeProgress {
  cur: number;
  target: number;
  pct: number; // 0..100
  earned: boolean;
  remaining: number;
}

/** Current standing on one badge — drives the progress bar and "what's left". */
export function badgeProgress(a: Aggregate, b: BadgeDef): BadgeProgress {
  const [raw, target] = b.progress(a);
  const cur = Math.max(0, Math.min(raw, target));
  return {
    cur,
    target,
    pct: target > 0 ? Math.round((cur / target) * 100) : 0,
    earned: raw >= target,
    remaining: Math.max(0, target - raw),
  };
}

/** All badge ids currently satisfied by the given state. */
export function evaluateBadges(state: UserState): string[] {
  const a = aggregate(state);
  return BADGES.filter((b) => badgeProgress(a, b).earned).map((b) => b.id);
}

/**
 * Badges ordered for display: earned first (gold→bronze), then locked sorted by
 * how close they are — so the next achievable win is always near the top.
 */
export function badgesForDisplay(
  a: Aggregate
): { badge: BadgeDef; prog: BadgeProgress }[] {
  const tierRank: Record<BadgeTier, number> = { gold: 0, silver: 1, bronze: 2 };
  return BADGES.map((badge) => ({ badge, prog: badgeProgress(a, badge) }))
    .sort((x, y) => {
      if (x.prog.earned !== y.prog.earned) return x.prog.earned ? -1 : 1;
      if (x.prog.earned) return tierRank[x.badge.tier] - tierRank[y.badge.tier];
      return y.prog.pct - x.prog.pct; // locked: closest first
    });
}

/** ---- Per-skill mastery trophies ---- */

export interface SkillTrophy {
  skillId: string;
  level: MasteryLevel;
  pct: number; // 0..100 overall mastery of the skill
  earned: boolean; // true once the skill hits Expert
}

/**
 * One trophy per skill the learner has touched, earned at Expert mastery.
 * Earned first, then closest-to-mastered. Empty until the mastery system has
 * data (tracking tiers / DB mode), so it renders nothing for guests.
 */
export function masteryTrophies(state: UserState): SkillTrophy[] {
  if (!state.mastery) return [];
  return Object.values(state.mastery)
    .map((m) => ({
      skillId: m.skillId,
      level: m.level,
      pct: m.pct,
      earned: m.level === "expert",
    }))
    .sort((a, b) => (a.earned !== b.earned ? (a.earned ? -1 : 1) : b.pct - a.pct));
}

/** Combo bonus XP for a streak of correct answers (caps to keep things sane). */
export function comboBonus(combo: number): number {
  if (combo <= 1) return 0;
  return Math.min(combo - 1, 5) * 2;
}

/** ---- XP goals (derived from the intake survey) ---- */

export const DEFAULT_GOALS: XpGoals = { dailyXp: 40, weeklyXp: 200 };

const first = (a: SurveyAnswers, key: string) => a[key]?.[0] ?? "";
const roundTo = (n: number, step: number) => Math.round(n / step) * step;

/**
 * Turn the survey's commitment signals (overall time budget, depth, exam
 * deadline) into a daily + weekly XP target. Heavier commitment / nearer
 * deadline → a higher bar. Always returns sane, round numbers.
 */
export function deriveXpGoals(answers: SurveyAnswers): XpGoals {
  const base =
    { lt5: 20, "5to15": 40, "15to40": 60, gt40: 80 }[first(answers, "timeBudget")] ??
    40;
  const depthMult =
    { essentials: 0.8, solid: 1, mastery: 1.25 }[first(answers, "depth")] ?? 1;
  const deadlineMult =
    { lt2w: 1.5, "1to2m": 1.15, gt2m: 1, unset: 1 }[first(answers, "deadline")] ?? 1;

  const dailyXp = Math.min(
    150,
    Math.max(15, roundTo(base * depthMult * deadlineMult, 5))
  );
  const weeklyXp = roundTo(dailyXp * 5, 10); // ~5 active days a week
  return { dailyXp, weeklyXp };
}

/** ---- Daily quests ---- */

interface QuestTemplate {
  id: string;
  metric: Quest["metric"];
  icon: string;
  /** build label/target/reward; `goals` lets the XP quest scale to the user. */
  build: (seed: number, goals: XpGoals) => {
    label: string;
    target: number;
    xpReward: number;
  };
}

const QUEST_POOL: QuestTemplate[] = [
  {
    id: "xp",
    metric: "xp",
    icon: "Zap",
    build: (_seed, goals) => {
      const target = Math.max(20, goals.dailyXp);
      return { label: `Earn ${target} XP today`, target, xpReward: Math.max(10, roundTo(target * 0.3, 5)) };
    },
  },
  {
    id: "answered",
    metric: "answered",
    icon: "ListChecks",
    build: (seed) => {
      const target = 12 + (seed % 3) * 3; // 12 / 15 / 18
      return { label: `Answer ${target} questions`, target, xpReward: 15 };
    },
  },
  {
    id: "correct",
    metric: "correct",
    icon: "CheckCircle2",
    build: (seed) => {
      const target = 8 + (seed % 3) * 2; // 8 / 10 / 12
      return { label: `Get ${target} correct answers`, target, xpReward: 15 };
    },
  },
  {
    id: "combo",
    metric: "combo",
    icon: "Flame",
    build: (seed) => {
      const target = 5 + (seed % 2) * 2; // 5 / 7
      return { label: `Hit a ${target}-in-a-row combo`, target, xpReward: 20 };
    },
  },
];

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Deterministically generate the day's 3 quests from the pool (seeded by date),
 * scaled to the learner's goals. Same day → same quests across reloads.
 */
export function dailyQuests(dateKey: string, goals: XpGoals): DailyQuests {
  const seed = hashStr(dateKey);
  const drop = seed % QUEST_POOL.length; // pick 3 of 4
  const chosen = QUEST_POOL.filter((_, i) => i !== drop);
  const quests: Quest[] = chosen.map((tpl) => {
    const { label, target, xpReward } = tpl.build(seed, goals);
    return {
      id: `${dateKey}:${tpl.id}`,
      label,
      metric: tpl.metric,
      target,
      xpReward,
      icon: tpl.icon,
      claimed: false,
    };
  });
  return { date: dateKey, quests };
}

/** Live progress on a quest, read from the day's counters. */
export function questProgress(
  q: Quest,
  daily: { xp: number; answered: number; correct: number; bestCombo: number }
): number {
  switch (q.metric) {
    case "xp":
      return daily.xp;
    case "answered":
      return daily.answered;
    case "correct":
      return daily.correct;
    case "combo":
      return daily.bestCombo;
  }
}
