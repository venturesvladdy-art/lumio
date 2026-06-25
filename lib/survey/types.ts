import type { Difficulty } from "@/lib/types";

/** Authored intake survey: a bank of branching questions, ≤10 ever asked. */

export type SurveyAnswers = Record<string, string[]>;

export type SurveyQuestionType = "single" | "multi" | "subareas";

export interface SurveyOption {
  value: string;
  label: string;
}

export interface SurveyQuestion {
  id: string;
  type: SurveyQuestionType;
  prompt: string;
  helper?: string;
  /** options for single/multi (the `subareas` type pulls options from the taxonomy) */
  options?: SurveyOption[];
  minSelect?: number;
  maxSelect?: number;
  /** branching: only asked when this predicate (over prior answers) holds */
  when?: (a: SurveyAnswers) => boolean;
}

/** The learner profile derived from the survey — the single thing generation consumes. */
export interface LearnerProfile {
  goal: string;
  examName?: string;
  subareaKeys: string[];
  level: Difficulty; // generation difficulty band
  proficiency: number; // 0..1
  depth: "essentials" | "solid" | "mastery";
  totalHours: number;
  deadline?: string;
  freeTextTolerance: number; // 0..1 appetite for AI-graded free writing
}
