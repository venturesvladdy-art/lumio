import type { I18nText, UserState } from "@/lib/types";

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
  return {
    answered,
    correct,
    bestCombo,
    skills: Object.keys(state.skills).length,
    streak: state.streakDays,
    xp: state.xp,
    level: levelInfo(state.xp).level,
    accuracy: answered > 0 ? Math.round((correct / answered) * 100) : 0,
  };
}

/** ---- Badges ---- */

export interface BadgeDef {
  id: string;
  name: I18nText;
  desc: I18nText;
  icon: string; // lucide-react icon name
  test: (a: Aggregate) => boolean;
}

export const BADGES: BadgeDef[] = [
  {
    id: "first-step",
    name: { en: "First Step", pl: "Pierwszy krok" },
    desc: { en: "Answer your first question", pl: "Odpowiedz na pierwsze pytanie" },
    icon: "Footprints",
    test: (a) => a.answered >= 1,
  },
  {
    id: "on-fire",
    name: { en: "On Fire", pl: "W ogniu" },
    desc: { en: "Reach a 3-day streak", pl: "Osiągnij 3-dniową passę" },
    icon: "Flame",
    test: (a) => a.streak >= 3,
  },
  {
    id: "combo-5",
    name: { en: "Combo Master", pl: "Mistrz combo" },
    desc: { en: "Get 5 correct in a row", pl: "Zdobądź 5 poprawnych z rzędu" },
    icon: "Zap",
    test: (a) => a.bestCombo >= 5,
  },
  {
    id: "sharp-shooter",
    name: { en: "Sharpshooter", pl: "Strzelec wyborowy" },
    desc: { en: "Answer 10 correctly", pl: "Odpowiedz poprawnie 10 razy" },
    icon: "Target",
    test: (a) => a.correct >= 10,
  },
  {
    id: "explorer",
    name: { en: "Explorer", pl: "Odkrywca" },
    desc: { en: "Learn 3 different skills", pl: "Ucz się 3 różnych umiejętności" },
    icon: "Compass",
    test: (a) => a.skills >= 3,
  },
  {
    id: "rising-star",
    name: { en: "Rising Star", pl: "Wschodząca gwiazda" },
    desc: { en: "Reach level 3", pl: "Osiągnij poziom 3" },
    icon: "Star",
    test: (a) => a.level >= 3,
  },
  {
    id: "scholar",
    name: { en: "Scholar", pl: "Erudyta" },
    desc: { en: "Answer 25 correctly", pl: "Odpowiedz poprawnie 25 razy" },
    icon: "GraduationCap",
    test: (a) => a.correct >= 25,
  },
  {
    id: "unstoppable",
    name: { en: "Unstoppable", pl: "Nie do zatrzymania" },
    desc: { en: "Reach a 7-day streak", pl: "Osiągnij 7-dniową passę" },
    icon: "Rocket",
    test: (a) => a.streak >= 7,
  },
];

export function getBadge(id: string): BadgeDef | undefined {
  return BADGES.find((b) => b.id === id);
}

/** All badge ids currently satisfied by the given state. */
export function evaluateBadges(state: UserState): string[] {
  const a = aggregate(state);
  return BADGES.filter((b) => b.test(a)).map((b) => b.id);
}

/** Combo bonus XP for a streak of correct answers (caps to keep things sane). */
export function comboBonus(combo: number): number {
  if (combo <= 1) return 0;
  return Math.min(combo - 1, 5) * 2;
}
