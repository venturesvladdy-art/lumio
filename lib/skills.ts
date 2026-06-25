import type { SkillDef, AccentColor } from "@/lib/types";

export const SKILLS: SkillDef[] = [
  {
    id: "exam",
    predefined: true,
    icon: "GraduationCap",
    accent: "brand",
    name: { en: "Pass an Exam", pl: "Pass an Exam" },
    tagline: {
      en: "Ace the SAT, GMAT, GRE and more with targeted practice.",
      pl: "Ace the SAT, GMAT, GRE and more with targeted practice.",
    },
    description: {
      en: "Sharpen the quant, verbal, reading and reasoning skills that standardized tests reward — one targeted question at a time.",
      pl: "Sharpen the quant, verbal, reading and reasoning skills that standardized tests reward — one targeted question at a time.",
    },
    topics: {
      en: ["SAT", "GMAT", "GRE", "Quant", "Verbal"],
      pl: ["SAT", "GMAT", "GRE", "Quant", "Verbal"],
    },
  },
  {
    id: "spanish",
    predefined: true,
    icon: "Languages",
    accent: "rose",
    name: { en: "Learn Spanish", pl: "Learn Spanish" },
    tagline: {
      en: "Build real Spanish — words, grammar and everyday phrases.",
      pl: "Build real Spanish — words, grammar and everyday phrases.",
    },
    description: {
      en: "Grow your vocabulary, master the grammar that trips people up, and hold everyday conversations with confidence.",
      pl: "Grow your vocabulary, master the grammar that trips people up, and hold everyday conversations with confidence.",
    },
    topics: {
      en: ["Vocabulary", "Grammar", "Verbs", "Numbers", "Conversation"],
      pl: ["Vocabulary", "Grammar", "Verbs", "Numbers", "Conversation"],
    },
  },
  {
    id: "python",
    predefined: true,
    icon: "Cpu",
    accent: "emerald",
    name: { en: "Python Coding", pl: "Python Coding" },
    tagline: {
      en: "Learn to code with Python, from syntax to real logic.",
      pl: "Learn to code with Python, from syntax to real logic.",
    },
    description: {
      en: "Master Python's core building blocks — variables, data structures, control flow and functions — through hands-on questions.",
      pl: "Master Python's core building blocks — variables, data structures, control flow and functions — through hands-on questions.",
    },
    topics: {
      en: ["Syntax", "Data structures", "Loops", "Functions", "Logic"],
      pl: ["Syntax", "Data structures", "Loops", "Functions", "Logic"],
    },
  },
  {
    id: "finance",
    predefined: true,
    icon: "TrendingUp",
    accent: "amber",
    name: { en: "Personal Finance", pl: "Personal Finance" },
    tagline: {
      en: "Take control of money — budgeting, credit and investing.",
      pl: "Take control of money — budgeting, credit and investing.",
    },
    description: {
      en: "Build the money skills that compound: budgeting, managing debt, investing basics, and planning for the future.",
      pl: "Build the money skills that compound: budgeting, managing debt, investing basics, and planning for the future.",
    },
    topics: {
      en: ["Budgeting", "Credit & debt", "Investing", "Taxes", "Retirement"],
      pl: ["Budgeting", "Credit & debt", "Investing", "Taxes", "Retirement"],
    },
  },
  {
    id: "data",
    predefined: true,
    icon: "LineChart",
    accent: "sky",
    name: { en: "Data & Statistics", pl: "Data & Statistics" },
    tagline: {
      en: "Read data like a pro — averages, probability and charts.",
      pl: "Read data like a pro — averages, probability and charts.",
    },
    description: {
      en: "Make sense of numbers: averages and spread, probability, reading charts, and spotting misleading statistics.",
      pl: "Make sense of numbers: averages and spread, probability, reading charts, and spotting misleading statistics.",
    },
    topics: {
      en: ["Averages", "Probability", "Charts", "Studies", "Spread"],
      pl: ["Averages", "Probability", "Charts", "Studies", "Spread"],
    },
  },
  {
    id: "interpersonal",
    predefined: true,
    icon: "Users",
    accent: "violet",
    name: { en: "Interpersonal Skills", pl: "Interpersonal Skills" },
    tagline: {
      en: "Communicate, listen and lead with confidence.",
      pl: "Communicate, listen and lead with confidence.",
    },
    description: {
      en: "Practice the everyday social skills — listening, feedback, negotiation — that make you someone people want to work with.",
      pl: "Practice the everyday social skills — listening, feedback, negotiation — that make you someone people want to work with.",
    },
    topics: {
      en: ["Active listening", "Feedback", "Negotiation", "Empathy", "Conflict"],
      pl: ["Active listening", "Feedback", "Negotiation", "Empathy", "Conflict"],
    },
  },
  {
    id: "speaking",
    predefined: true,
    icon: "MessageSquare",
    accent: "brand",
    name: { en: "Public Speaking", pl: "Public Speaking" },
    tagline: {
      en: "Speak with structure, presence and zero panic.",
      pl: "Speak with structure, presence and zero panic.",
    },
    description: {
      en: "Craft talks that land — clear structure, confident delivery, calming your nerves, and handling any audience.",
      pl: "Craft talks that land — clear structure, confident delivery, calming your nerves, and handling any audience.",
    },
    topics: {
      en: ["Structure", "Delivery", "Nerves", "Storytelling", "Q&A"],
      pl: ["Structure", "Delivery", "Nerves", "Storytelling", "Q&A"],
    },
  },
  {
    id: "ai",
    predefined: true,
    icon: "BrainCircuit",
    accent: "violet",
    name: { en: "Artificial Intelligence", pl: "Artificial Intelligence" },
    tagline: {
      en: "Understand modern AI — from basics to LLMs.",
      pl: "Understand modern AI — from basics to LLMs.",
    },
    description: {
      en: "Go from core machine-learning ideas to how today's large language models actually work.",
      pl: "Go from core machine-learning ideas to how today's large language models actually work.",
    },
    topics: {
      en: ["Machine learning", "Neural nets", "LLMs", "Prompting", "Evaluation"],
      pl: ["Machine learning", "Neural nets", "LLMs", "Prompting", "Evaluation"],
    },
  },
  {
    id: "engineering",
    predefined: true,
    icon: "Wrench",
    accent: "sky",
    name: { en: "Engineering", pl: "Engineering" },
    tagline: {
      en: "Fundamentals that span every engineering field.",
      pl: "Fundamentals that span every engineering field.",
    },
    description: {
      en: "Strengthen the core principles — mechanics, circuits, algorithms, reliability — behind great engineering work.",
      pl: "Strengthen the core principles — mechanics, circuits, algorithms, reliability — behind great engineering work.",
    },
    topics: {
      en: ["Mechanics", "Circuits", "Algorithms", "Reliability", "Units"],
      pl: ["Mechanics", "Circuits", "Algorithms", "Reliability", "Units"],
    },
  },
  {
    id: "chess",
    predefined: true,
    icon: "Crown",
    accent: "amber",
    name: { en: "Chess", pl: "Chess" },
    tagline: {
      en: "Sharpen openings, tactics and endgames.",
      pl: "Sharpen openings, tactics and endgames.",
    },
    description: {
      en: "Level up your game: sound openings, spotting tactics like forks and pins, converting endgames, and planning ahead.",
      pl: "Level up your game: sound openings, spotting tactics like forks and pins, converting endgames, and planning ahead.",
    },
    topics: {
      en: ["Openings", "Tactics", "Endgames", "Strategy", "Checkmate"],
      pl: ["Openings", "Tactics", "Endgames", "Strategy", "Checkmate"],
    },
  },
];

const CUSTOM_ACCENTS: AccentColor[] = ["emerald", "brand", "amber", "sky", "rose", "violet"];

export function getSkill(id: string): SkillDef | undefined {
  return SKILLS.find((s) => s.id === id);
}

export function slugify(name: string): string {
  return (
    "custom-" +
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40)
  );
}

/** Build a SkillDef for a user-defined ("Other") skill. */
export function makeCustomSkill(rawName: string): SkillDef {
  const name = rawName.trim() || "Custom skill";
  const id = slugify(name) || "custom-skill";
  // deterministic accent from name length so it stays stable
  const accent = CUSTOM_ACCENTS[name.length % CUSTOM_ACCENTS.length];
  return {
    id,
    predefined: false,
    icon: "Sparkles",
    accent,
    name: { en: name, pl: name },
    tagline: {
      en: "A custom plan, built around your goal.",
      pl: "Własny plan, zbudowany wokół Twojego celu.",
    },
    description: {
      en: `A personalized learning track for "${name}", generated from your answers.`,
      pl: `Spersonalizowana ścieżka nauki dla „${name}”, stworzona na podstawie Twoich odpowiedzi.`,
    },
    topics: {
      en: ["Foundations", "Core ideas", "Practice", "Application", "Mastery"],
      pl: ["Podstawy", "Kluczowe idee", "Praktyka", "Zastosowanie", "Mistrzostwo"],
    },
  };
}

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function resolveSkill(id: string, fallbackName?: string): SkillDef {
  const predefined = getSkill(id);
  if (predefined) return predefined;
  const reconstructed = titleCase(id.replace(/^custom-/, "").replace(/-/g, " "));
  return makeCustomSkill(fallbackName ?? reconstructed);
}
