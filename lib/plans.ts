import type { PlanTier, I18nText, UserState } from "@/lib/types";

export interface PlanConfig {
  id: PlanTier;
  name: string; // brand name, same in both languages
  priceMonthly: number;
  priceYearly: number;
  /** Infinity => unlimited */
  dailyQuestions: number;
  maxSkills: number;
  tracking: boolean;
  highlight: boolean; // visually featured ("most popular")
  blurb: I18nText;
  features: I18nText[];
}

export const PLANS: Record<PlanTier, PlanConfig> = {
  basic: {
    id: "basic",
    name: "Basic",
    priceMonthly: 0,
    priceYearly: 0,
    dailyQuestions: 5,
    maxSkills: 3,
    tracking: false,
    highlight: false,
    blurb: {
      en: "Everything you need to start learning, free forever.",
      pl: "Wszystko, czego potrzebujesz na start — za darmo na zawsze.",
    },
    features: [
      { en: "5 questions per day", pl: "5 pytań dziennie" },
      { en: "Up to 3 skills", pl: "Do 3 umiejętności" },
      { en: "AI-personalized plans", pl: "Plany personalizowane przez AI" },
      { en: "XP, levels & streaks", pl: "PD, poziomy i passy" },
      { en: "English & Polish", pl: "Angielski i polski" },
    ],
  },
  smart: {
    id: "smart",
    name: "Smart",
    priceMonthly: 10,
    priceYearly: 100,
    dailyQuestions: 20,
    maxSkills: Infinity,
    tracking: true,
    highlight: true,
    blurb: {
      en: "For serious learners who want momentum and insight.",
      pl: "Dla ambitnych, którzy chcą tempa i wglądu w postępy.",
    },
    features: [
      { en: "20 questions per day", pl: "20 pytań dziennie" },
      { en: "Unlimited skills", pl: "Nieograniczona liczba umiejętności" },
      { en: "Helpful progress tracking", pl: "Pomocne śledzenie postępów" },
      { en: "Accuracy & streak insights", pl: "Wgląd w skuteczność i passy" },
      { en: "Everything in Basic", pl: "Wszystko z planu Basic" },
    ],
  },
  guru: {
    id: "guru",
    name: "Guru",
    priceMonthly: 40,
    priceYearly: 350,
    dailyQuestions: Infinity,
    maxSkills: Infinity,
    tracking: true,
    highlight: false,
    blurb: {
      en: "Unlimited everything for total mastery.",
      pl: "Wszystko bez limitów — pełne mistrzostwo.",
    },
    features: [
      { en: "Unlimited questions", pl: "Pytania bez limitu" },
      { en: "Unlimited skills", pl: "Umiejętności bez limitu" },
      { en: "Advanced tracking & insights", pl: "Zaawansowane śledzenie i analizy" },
      { en: "Priority new content", pl: "Priorytetowy dostęp do nowości" },
      { en: "Everything in Smart", pl: "Wszystko z planu Smart" },
    ],
  },
};

export const PLAN_ORDER: PlanTier[] = ["basic", "smart", "guru"];

export function dailyLimit(tier: PlanTier): number {
  return PLANS[tier].dailyQuestions;
}

export function skillLimit(tier: PlanTier): number {
  return PLANS[tier].maxSkills;
}

export function isUnlimited(n: number): boolean {
  return !Number.isFinite(n);
}

/** Questions remaining today for the user under their tier. */
export function remainingToday(state: UserState): number {
  const limit = dailyLimit(state.tier);
  if (isUnlimited(limit)) return Infinity;
  return Math.max(0, limit - state.dailyAnswered);
}

export function canAnswerMore(state: UserState): boolean {
  return remainingToday(state) > 0;
}

export function activeSkillCount(state: UserState): number {
  return Object.keys(state.skills).length;
}

export function canAddSkill(state: UserState, skillId: string): boolean {
  if (state.skills[skillId]) return true; // already added
  const limit = skillLimit(state.tier);
  if (isUnlimited(limit)) return true;
  return activeSkillCount(state) < limit;
}

/** Yearly savings vs paying monthly, as a whole-number percentage. */
export function yearlySavingPct(tier: PlanTier): number {
  const p = PLANS[tier];
  if (p.priceMonthly === 0) return 0;
  const full = p.priceMonthly * 12;
  return Math.round(((full - p.priceYearly) / full) * 100);
}
