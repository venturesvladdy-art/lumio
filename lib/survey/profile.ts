import type { Difficulty } from "@/lib/types";
import type { LearnerProfile, SurveyAnswers } from "@/lib/survey/types";

const first = (a: SurveyAnswers, k: string) => a[k]?.[0];

const CALIBRATION_SCORE: Record<string, number> = {
  new: 0.1,
  rusty: 0.35,
  solid: 0.6,
  advanced: 0.85,
};
const SCORE_BUMP: Record<string, number> = {
  low: -0.1,
  mid: 0,
  high: 0.07,
  near_top: 0.13,
};
const HOURS: Record<string, number> = { lt5: 3, "5to15": 10, "15to40": 25, gt40: 60 };
const FREE_TOLERANCE: Record<string, number> = { fast: 0.15, balanced: 0.5, written: 0.85 };

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

/** Derive the single LearnerProfile the generator consumes from survey answers. */
export function deriveProfile(answers: SurveyAnswers): LearnerProfile {
  const calibration = first(answers, "calibration") ?? "rusty";
  const priorScore = first(answers, "priorScore");
  const proficiency = clamp01(
    (CALIBRATION_SCORE[calibration] ?? 0.35) + (priorScore ? SCORE_BUMP[priorScore] ?? 0 : 0)
  );
  const level: Difficulty =
    proficiency < 0.33 ? "beginner" : proficiency < 0.7 ? "intermediate" : "advanced";

  const depth = (first(answers, "depth") ?? "solid") as LearnerProfile["depth"];
  const feedbackStyle = first(answers, "feedbackStyle") ?? "balanced";

  return {
    goal: first(answers, "goal") ?? "growth",
    examName: first(answers, "examName"),
    subareaKeys: answers["subareas"] ?? [],
    level,
    proficiency,
    depth,
    totalHours: HOURS[first(answers, "timeBudget") ?? "5to15"] ?? 10,
    deadline: first(answers, "deadline"),
    freeTextTolerance: FREE_TOLERANCE[feedbackStyle] ?? 0.5,
  };
}

/** Survey proficiency (0..1) for a subarea's mastery starting level. */
export function proficiencyFromAnswers(answers: SurveyAnswers): number {
  const calibration = first(answers, "calibration") ?? "rusty";
  const priorScore = first(answers, "priorScore");
  return clamp01(
    (CALIBRATION_SCORE[calibration] ?? 0.35) + (priorScore ? SCORE_BUMP[priorScore] ?? 0 : 0)
  );
}
