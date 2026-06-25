import type { SurveyAnswers, SurveyQuestion } from "@/lib/survey/types";

export const MAX_QUESTIONS = 10;

function answered(a: SurveyAnswers, id: string): boolean {
  return Array.isArray(a[id]) && a[id].length > 0;
}

/**
 * Walk the bank honoring each question's `when` predicate (branching), capped
 * at MAX_QUESTIONS. Returns the next unanswered visible question, or null when
 * the survey is complete.
 */
export function nextQuestion(
  bank: SurveyQuestion[],
  answers: SurveyAnswers
): SurveyQuestion | null {
  let asked = 0;
  for (const q of bank) {
    if (asked >= MAX_QUESTIONS) return null;
    if (q.when && !q.when(answers)) continue;
    asked += 1;
    if (!answered(answers, q.id)) return q;
  }
  return null;
}

/** Visible (branch-passing) questions given current answers — for the progress bar. */
export function visibleQuestions(
  bank: SurveyQuestion[],
  answers: SurveyAnswers
): SurveyQuestion[] {
  const out: SurveyQuestion[] = [];
  for (const q of bank) {
    if (out.length >= MAX_QUESTIONS) break;
    if (!q.when || q.when(answers)) out.push(q);
  }
  return out;
}

/** 0..100 progress through the (branch-aware) survey. */
export function surveyProgress(
  bank: SurveyQuestion[],
  answers: SurveyAnswers
): number {
  const visible = visibleQuestions(bank, answers);
  if (visible.length === 0) return 0;
  const done = visible.filter((q) => answered(answers, q.id)).length;
  return Math.round((done / visible.length) * 100);
}
