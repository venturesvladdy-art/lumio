import type {
  Difficulty,
  OnboardingAnswers,
  OnboardingQuestion,
  SkillDef,
} from "@/lib/types";

/**
 * The onboarding questionnaire. Most questions are generic; the "focus"
 * question is built dynamically from the chosen skill's topics so it always
 * feels specific. 5–10 short questions, per the product spec.
 */
export function buildOnboarding(skill: SkillDef): OnboardingQuestion[] {
  const focusOptions = skill.topics.en.map((en, i) => ({
    value: `focus-${i}`,
    label: { en, pl: skill.topics.pl[i] ?? en },
  }));

  return [
    {
      id: "goal",
      prompt: { en: "What's your main goal?", pl: "Jaki jest Twój główny cel?" },
      type: "single",
      options: [
        { value: "exam", label: { en: "Pass an exam or test", pl: "Zdać egzamin lub test" } },
        { value: "career", label: { en: "Grow my career", pl: "Rozwinąć karierę" } },
        { value: "school", label: { en: "Do better at school", pl: "Lepiej radzić sobie w szkole" } },
        { value: "growth", label: { en: "Personal growth", pl: "Rozwój osobisty" } },
        { value: "curiosity", label: { en: "Pure curiosity", pl: "Czysta ciekawość" } },
      ],
    },
    {
      id: "focus",
      prompt: { en: "Which areas matter most to you?", pl: "Które obszary są dla Ciebie najważniejsze?" },
      helper: { en: "Pick one or more", pl: "Wybierz jeden lub więcej" },
      type: "multi",
      options: focusOptions,
    },
    {
      id: "level",
      prompt: { en: "How would you rate your current level?", pl: "Jak oceniasz swój obecny poziom?" },
      type: "scale",
      levelDriver: true,
      options: ["1", "2", "3", "4", "5"].map((v) => ({
        value: v,
        label: { en: v, pl: v },
      })),
    },
    {
      id: "experience",
      prompt: { en: "How much have you studied this before?", pl: "Ile wcześniej się tym zajmowałeś?" },
      type: "single",
      options: [
        { value: "none", label: { en: "Never — I'm new", pl: "Nigdy — zaczynam" } },
        { value: "little", label: { en: "A little", pl: "Trochę" } },
        { value: "some", label: { en: "Quite a bit", pl: "Sporo" } },
        { value: "lots", label: { en: "A lot", pl: "Bardzo dużo" } },
      ],
    },
    {
      id: "time",
      prompt: { en: "How much time can you give each day?", pl: "Ile czasu możesz poświęcać dziennie?" },
      type: "single",
      options: [
        { value: "5", label: { en: "About 5 minutes", pl: "Około 5 minut" } },
        { value: "15", label: { en: "About 15 minutes", pl: "Około 15 minut" } },
        { value: "30", label: { en: "30 minutes or more", pl: "30 minut lub więcej" } },
      ],
    },
    {
      id: "style",
      prompt: { en: "How do you like to learn?", pl: "Jak lubisz się uczyć?" },
      type: "single",
      options: [
        { value: "drills", label: { en: "Quick drills", pl: "Szybkie ćwiczenia" } },
        { value: "deep", label: { en: "Deep dives", pl: "Dogłębna analiza" } },
        { value: "mix", label: { en: "A mix of both", pl: "Połączenie obu" } },
      ],
    },
    {
      id: "challenge",
      prompt: { en: "What difficulty feels right?", pl: "Jaki poziom trudności pasuje?" },
      type: "single",
      options: [
        { value: "gentle", label: { en: "Ease me in", pl: "Łagodny start" } },
        { value: "balanced", label: { en: "Keep it balanced", pl: "Wyważony" } },
        { value: "push", label: { en: "Push me hard", pl: "Wymagający" } },
      ],
    },
  ];
}

/** Derive a learner level from the questionnaire answers. */
export function deriveLevel(answers: OnboardingAnswers): Difficulty {
  const scale = Number(answers["level"]?.[0] ?? "3");
  const exp = answers["experience"]?.[0] ?? "little";
  const challenge = answers["challenge"]?.[0] ?? "balanced";

  let score = scale; // 1..5
  if (exp === "none") score -= 1;
  if (exp === "some") score += 1;
  if (exp === "lots") score += 2;
  if (challenge === "gentle") score -= 1;
  if (challenge === "push") score += 1;

  if (score <= 2) return "beginner";
  if (score <= 4) return "intermediate";
  return "advanced";
}

/** Map stored focus values back to localized labels for display. */
export function focusLabels(
  skill: SkillDef,
  values: string[]
): { en: string; pl: string }[] {
  const questions = buildOnboarding(skill);
  const focus = questions.find((q) => q.id === "focus");
  if (!focus) return [];
  return values
    .map((v) => focus.options.find((o) => o.value === v)?.label)
    .filter((x): x is { en: string; pl: string } => Boolean(x));
}
