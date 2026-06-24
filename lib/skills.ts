import type { SkillDef, AccentColor } from "@/lib/types";

export const SKILLS: SkillDef[] = [
  {
    id: "sat",
    predefined: true,
    icon: "GraduationCap",
    accent: "brand",
    name: { en: "SAT Prep", pl: "Przygotowanie do SAT" },
    tagline: {
      en: "Lift your score with focused, adaptive practice.",
      pl: "Podnieś wynik dzięki skupionej, adaptacyjnej praktyce.",
    },
    description: {
      en: "Sharpen the reading, writing and math skills that move your SAT score — one targeted question at a time.",
      pl: "Wyostrz umiejętności czytania, pisania i matematyki, które windują wynik SAT — pytanie po pytaniu.",
    },
    topics: {
      en: ["Algebra", "Geometry", "Reading", "Grammar", "Data analysis"],
      pl: ["Algebra", "Geometria", "Czytanie", "Gramatyka", "Analiza danych"],
    },
  },
  {
    id: "gmat",
    predefined: true,
    icon: "Briefcase",
    accent: "amber",
    name: { en: "GMAT Prep", pl: "Przygotowanie do GMAT" },
    tagline: {
      en: "Crack quant and verbal for top business schools.",
      pl: "Rozłóż quant i verbal na czynniki — pod najlepsze uczelnie biznesowe.",
    },
    description: {
      en: "Build the quantitative reasoning and critical thinking the GMAT rewards, with practice that scales to your level.",
      pl: "Rozwijaj rozumowanie ilościowe i krytyczne myślenie, które nagradza GMAT — z praktyką dopasowaną do poziomu.",
    },
    topics: {
      en: ["Arithmetic", "Word problems", "Critical reasoning", "Probability", "Rates"],
      pl: ["Arytmetyka", "Zadania tekstowe", "Rozumowanie", "Prawdopodobieństwo", "Tempo"],
    },
  },
  {
    id: "interpersonal",
    predefined: true,
    icon: "Users",
    accent: "rose",
    name: { en: "Interpersonal Skills", pl: "Kompetencje interpersonalne" },
    tagline: {
      en: "Communicate, listen and lead with confidence.",
      pl: "Komunikuj się, słuchaj i przewodź z pewnością.",
    },
    description: {
      en: "Practice the everyday social skills — listening, feedback, negotiation — that make you someone people want to work with.",
      pl: "Ćwicz codzienne umiejętności społeczne — słuchanie, feedback, negocjacje — dzięki którym ludzie chcą z Tobą pracować.",
    },
    topics: {
      en: ["Active listening", "Feedback", "Negotiation", "Empathy", "Conflict"],
      pl: ["Aktywne słuchanie", "Feedback", "Negocjacje", "Empatia", "Konflikt"],
    },
  },
  {
    id: "engineering",
    predefined: true,
    icon: "Wrench",
    accent: "sky",
    name: { en: "Engineering", pl: "Inżynieria" },
    tagline: {
      en: "Fundamentals that span every engineering field.",
      pl: "Fundamenty wspólne dla każdej dziedziny inżynierii.",
    },
    description: {
      en: "Strengthen the core principles — mechanics, circuits, algorithms, reliability — behind great engineering work.",
      pl: "Wzmocnij kluczowe zasady — mechanikę, obwody, algorytmy, niezawodność — stojące za dobrą inżynierią.",
    },
    topics: {
      en: ["Mechanics", "Circuits", "Algorithms", "Reliability", "Units"],
      pl: ["Mechanika", "Obwody", "Algorytmy", "Niezawodność", "Jednostki"],
    },
  },
  {
    id: "ai",
    predefined: true,
    icon: "BrainCircuit",
    accent: "violet",
    name: { en: "Artificial Intelligence", pl: "Sztuczna inteligencja" },
    tagline: {
      en: "Understand modern AI — from basics to LLMs.",
      pl: "Zrozum nowoczesną AI — od podstaw po modele językowe.",
    },
    description: {
      en: "Go from core machine-learning ideas to how today's large language models actually work.",
      pl: "Przejdź od podstaw uczenia maszynowego do tego, jak naprawdę działają dzisiejsze duże modele językowe.",
    },
    topics: {
      en: ["Machine learning", "Neural nets", "LLMs", "Prompting", "Evaluation"],
      pl: ["Uczenie maszynowe", "Sieci neuronowe", "LLM-y", "Prompty", "Ewaluacja"],
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
