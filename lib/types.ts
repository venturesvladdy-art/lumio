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
  /**
   * The chosen STARTING band (manual override, else the skill's survey level).
   * Drives the dashboard up/down control and the difficulty of new drills.
   * Never "expert" — that band is earned only through Q&A.
   */
  startLevel: Difficulty;
  /** 0–100 progress toward the next level (100 at Expert = mastered) */
  pctToNext: number;
  /** distinct questions answered / answered correctly in this subarea */
  answered: number;
  correct: number;
}

/** v2: a learner's standing across a whole skill (areas → subareas). */
export interface SkillMastery {
  skillId: string;
  level: MasteryLevel;
  /** overall 0–100 across the catalogue */
  pct: number;
  subareas: SubareaMastery[];
}

/** ---- Gamification: goals & daily quests ---- */

/** A daily/weekly XP target, derived from the intake survey's commitment signals. */
export interface XpGoals {
  dailyXp: number;
  weeklyXp: number;
}

export type QuestMetric = "xp" | "answered" | "correct" | "combo";

/** One of today's rotating challenges. Progress is read from the daily counters. */
export interface Quest {
  id: string;
  /** human label, e.g. "Earn 30 XP today" */
  label: string;
  metric: QuestMetric;
  target: number;
  xpReward: number;
  icon: string; // lucide-react icon name
  claimed: boolean;
}

/** The set of quests generated for one local day. */
export interface DailyQuests {
  date: string; // todayKey()
  quests: Quest[];
}

export interface UserState {
  tier: PlanTier;
  xp: number;
  streakDays: number;
  lastActiveDate: string | null;
  dailyAnswered: number;
  dailyDate: string | null;
  /** XP earned today (resets with dailyDate) — drives the daily XP goal. */
  dailyXp: number;
  /** Correct answers today (resets with dailyDate) — drives quests. */
  dailyCorrect: number;
  /** Best correct-combo reached today (resets with dailyDate) — drives quests. */
  dailyBestCombo: number;
  /** XP earned this ISO week — drives the weekly goal & leaderboard. */
  weekXp: number;
  /** weekKey() this weekXp belongs to; reset when it rolls over. */
  weekKey: string | null;
  /** Daily/weekly XP targets (survey-derived, with a sensible default). */
  goals: XpGoals;
  /** Streak-saver tokens: auto-spent to protect a streak on a missed day. */
  streakFreezes: number;
  /** Today's challenges (regenerated each local day). */
  quests?: DailyQuests;
  earnedBadges: string[];
  skills: Record<string, SkillProgress>;
  onboarded: boolean;
  /** Stage B: areas drilled per skill (skillId → coverage list). */
  coverage?: Record<string, AreaCoverage[]>;
  /** v2: per-skill subarea mastery levels (skillId → mastery). */
  mastery?: Record<string, SkillMastery>;
  /** Billing: a scheduled plan change applying at the end of the period. */
  billing?: {
    /** The lower tier we'll move to at periodEnd ("basic" = cancellation). */
    pendingTier: PlanTier | null;
    /** ISO date the pending change takes effect (the current period end). */
    periodEnd: string | null;
  };
}
