/** ---- Core shared types ---- */

export type Locale = "en" | "pl";

/** A piece of text available in both supported languages. */
export interface I18nText {
  en: string;
  pl: string;
}

export interface I18nList {
  en: string[];
  pl: string[];
}

export type PlanTier = "basic" | "smart" | "guru";

export type Difficulty = "beginner" | "intermediate" | "advanced";

/** ---- Skills ---- */

export interface SkillDef {
  id: string;
  predefined: boolean;
  icon: string; // lucide-react icon name
  accent: AccentColor;
  name: I18nText;
  tagline: I18nText;
  description: I18nText;
  topics: I18nList;
}

export type AccentColor =
  | "brand"
  | "amber"
  | "emerald"
  | "sky"
  | "rose"
  | "violet";

/** ---- Onboarding questionnaire ---- */

export interface OnboardingOption {
  value: string;
  label: I18nText;
}

export interface OnboardingQuestion {
  id: string;
  prompt: I18nText;
  helper?: I18nText;
  /** "single" — pick one, "multi" — pick several, "scale" — 1..5 self-rating */
  type: "single" | "multi" | "scale";
  options: OnboardingOption[];
  /** marks the question that determines the learner level */
  levelDriver?: boolean;
}

export type OnboardingAnswers = Record<string, string[]>;

/** ---- Learning content (Q&A) ---- */

export type QAFormat =
  | "mcq"
  | "truefalse"
  | "numeric"
  | "input" // short exact typed answer
  | "order" // sequence/rank items
  | "free"; // AI-graded open response

export interface QAItem {
  id: string;
  skillId: string;
  difficulty: Difficulty;
  format: QAFormat;
  question: I18nText;
  /** options for mcq / truefalse, parallel arrays per locale (empty for numeric/free) */
  options: I18nList;
  correctIndex: number;
  /** numeric: canonical answer · free: model answer (kept server-side ideally) */
  answerText?: string;
  /** input: accepted answers (lowercased/trimmed) the grader matches against */
  acceptedAnswers?: string[];
  /** order: the items to sequence (shown shuffled) */
  orderItems?: string[];
  /** order: indices of orderItems in the correct sequence */
  correctOrder?: number[];
  /** free: grading rubric used by the AI grader */
  rubric?: string;
  /** v2: canonical concept id (kebab-case) — the mastery dedup key */
  concept?: string;
  /** v2: catalogued subarea this question belongs to */
  subareaKey?: string;
  /** the learning brief (clientId) this question belongs to, if any (legacy) */
  briefClientId?: string;
  explanation: I18nText;
  hint?: I18nText;
  xp: number;
}

/** Stage B: a short learning brief shown before the questions it primes. */
export interface Brief {
  clientId: string;
  title: string;
  body: string;
  orderIndex: number;
}

/** ---- Generated plan ---- */

export interface PlanModule {
  id: string;
  title: I18nText;
  /** ids of items we have real content for and can play now */
  itemIds: string[];
  /** total questions planned for this module (>= itemIds.length) */
  plannedCount: number;
}

export interface LearningPlan {
  skillId: string;
  createdAt: number;
  level: Difficulty;
  focus: string[];
  totalPlanned: number; // up to 100
  modules: PlanModule[];
  summary: I18nText; // the agent's personalized note
  /** Stage B: set when this plan is a single-area drill */
  areaId?: string;
  areaName?: string;
}

/** ---- Progress & user state ---- */

export interface SkillProgress {
  skillId: string;
  plan: LearningPlan;
  completedItemIds: string[];
  correctItemIds: string[];
  xp: number;
  /** live consecutive-correct counter for this skill */
  combo: number;
  /** best consecutive-correct run achieved, for combo flair & badges */
  bestCombo: number;
  /** AI-generated Q&A items for this plan; empty when using the static bank */
  generatedItems: QAItem[];
  /** Stage B: learning briefs that prime groups of questions */
  briefs?: Brief[];
}

/** Stage B: per-area progress used for the dashboard coverage map. */
export interface AreaCoverage {
  areaId: string;
  areaName: string;
  total: number;
  answered: number;
  correct: number;
}

/** v2: the four mastery bands a learner climbs within a subarea. */
export type MasteryLevel = "beginner" | "intermediate" | "advanced" | "expert";

/** v2: a learner's standing within one catalogued subarea. */
export interface SubareaMastery {
  subareaKey: string;
  areaKey: string;
  name: string;
  /** distinct concepts mastered through Q&A (concept-deduped) */
  masteredConcepts: number;
  /** floor credited from the intake survey's starting level */
  creditedConcepts: number;
  /** full-coverage concept target for this subarea */
  conceptTarget: number;
  level: MasteryLevel;
  /** 0–100 progress toward the next level (100 at Expert = mastered) */
  pctToNext: number;
}

/** v2: a learner's standing across a whole skill (areas → subareas). */
export interface SkillMastery {
  skillId: string;
  level: MasteryLevel;
  /** overall 0–100 across the catalogue */
  pct: number;
  subareas: SubareaMastery[];
}

export interface UserState {
  tier: PlanTier;
  xp: number;
  streakDays: number;
  lastActiveDate: string | null;
  dailyAnswered: number;
  dailyDate: string | null;
  earnedBadges: string[];
  skills: Record<string, SkillProgress>;
  onboarded: boolean;
  /** Stage B: areas drilled per skill (skillId → coverage list). */
  coverage?: Record<string, AreaCoverage[]>;
  /** v2: per-skill subarea mastery levels (skillId → mastery). */
  mastery?: Record<string, SkillMastery>;
}
