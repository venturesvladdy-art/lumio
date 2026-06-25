import type { SurveyAnswers, SurveyQuestion } from "@/lib/survey/types";

const has = (a: SurveyAnswers, key: string, ...vals: string[]) =>
  vals.includes(a[key]?.[0] ?? "");

/**
 * The authored intake survey. Non-redundant (one calibration, not
 * experience+self-rating), generation-relevant (total time, not per-day), and
 * branching (exam path asks exam name / score / deadline). A learner sees 6–9
 * of these depending on their path; the runner hard-caps at 10.
 */
export const SURVEY: SurveyQuestion[] = [
  {
    id: "goal",
    type: "single",
    prompt: "What are you here to do?",
    options: [
      { value: "exam", label: "Pass a specific exam or test" },
      { value: "career", label: "Level up for work" },
      { value: "school", label: "Do better in a class" },
      { value: "growth", label: "Grow a personal skill" },
      { value: "curiosity", label: "Explore out of curiosity" },
    ],
  },
  {
    id: "examName",
    type: "single",
    prompt: "Which exam?",
    options: [
      { value: "sat", label: "SAT" },
      { value: "gmat", label: "GMAT" },
      { value: "gre", label: "GRE" },
      { value: "cert", label: "A professional certification" },
      { value: "other_exam", label: "Another exam" },
    ],
    when: (a) => has(a, "goal", "exam"),
  },
  {
    id: "subareas",
    type: "subareas",
    prompt: "Where do you want to start?",
    helper: "Pick 1–3 areas — we'll build your first drill around them.",
    minSelect: 1,
    maxSelect: 3,
  },
  {
    id: "calibration",
    type: "single",
    prompt: "How would you place yourself right now?",
    options: [
      { value: "new", label: "New — starting from scratch" },
      { value: "rusty", label: "Some exposure, but rusty" },
      { value: "solid", label: "Solid on the basics" },
      { value: "advanced", label: "Advanced — polishing weak spots" },
    ],
  },
  {
    id: "priorScore",
    type: "single",
    prompt: "Roughly where do you score now?",
    options: [
      { value: "low", label: "Below average" },
      { value: "mid", label: "Around the middle" },
      { value: "high", label: "Above average" },
      { value: "near_top", label: "Near the top" },
    ],
    when: (a) => has(a, "goal", "exam") && has(a, "calibration", "solid", "advanced"),
  },
  {
    id: "depth",
    type: "single",
    prompt: "How deep do you want to go?",
    options: [
      { value: "essentials", label: "Just the essentials" },
      { value: "solid", label: "A solid working command" },
      { value: "mastery", label: "Full mastery" },
    ],
  },
  {
    id: "timeBudget",
    type: "single",
    prompt: "How much time do you want to invest overall?",
    options: [
      { value: "lt5", label: "Under 5 hours" },
      { value: "5to15", label: "5–15 hours" },
      { value: "15to40", label: "15–40 hours" },
      { value: "gt40", label: "40+ hours" },
    ],
  },
  {
    id: "deadline",
    type: "single",
    prompt: "When's your exam?",
    options: [
      { value: "lt2w", label: "Within 2 weeks" },
      { value: "1to2m", label: "1–2 months out" },
      { value: "gt2m", label: "More than 2 months" },
      { value: "unset", label: "No fixed date" },
    ],
    when: (a) => has(a, "goal", "exam"),
  },
  {
    id: "feedbackStyle",
    type: "single",
    prompt: "How do you like to be tested?",
    options: [
      { value: "fast", label: "Quick checks" },
      { value: "balanced", label: "A mix" },
      { value: "written", label: "Make me explain in writing" },
    ],
  },
];
