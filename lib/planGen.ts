import { randomBytes } from "crypto";
import Anthropic from "@anthropic-ai/sdk";
import { assembleDrill, buildBankPlan } from "@/lib/agent";
import { modelForTier, effortForTier } from "@/lib/aiModel";
import { deriveProfile } from "@/lib/survey/profile";
import { prisma } from "@/lib/db";
import type {
  Difficulty,
  LearningPlan,
  OnboardingAnswers,
  PlanTier,
  QAFormat,
  QAItem,
  SkillDef,
} from "@/lib/types";
import type { LearnerProfile } from "@/lib/survey/types";

/**
 * v2 question-generation engine. Builds a focused 10-question drill for one
 * catalogued subarea, tuned to the learner's profile, with mixed question types
 * (mcq / truefalse / numeric / input / order / free) — free-text only when the
 * model judges it warranted. Every question is tagged with a canonical
 * `concept` so the mastery system can dedup rephrasings.
 */

export interface DrillArea {
  id: string; // subareaKey
  name: string;
  blurb?: string;
}

/** Generation context the route assembles (mastery targets, covered concepts). */
export interface GenContext {
  coveredConcepts?: string[];
  subareaTargetFull?: number;
  masteryTarget?: number;
  weakness?: string[];
}

const COUNT = Math.max(
  4,
  Math.min(15, Number(process.env.SKILLSPRINTER_DRILL_COUNT) || 10)
);

const XP_BY_DIFFICULTY: Record<Difficulty, number> = {
  beginner: 10,
  intermediate: 15,
  advanced: 25,
};

/** Representative proficiency for a manually-chosen starting band (keeps the
 *  generator's "level" and "proficiency" signals consistent). */
const PROF_BY_LEVEL: Record<Difficulty, number> = {
  beginner: 0.2,
  intermediate: 0.55,
  advanced: 0.85,
};

/* ---- Structured-output schema (six question types) ---- */
const QUESTION_SET_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "questions"],
  properties: {
    summary: { type: "string" },
    questions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["type", "concept", "difficulty", "question", "explanation"],
        properties: {
          type: { type: "string", enum: ["mcq", "truefalse", "numeric", "input", "order", "free"] },
          concept: { type: "string" },
          difficulty: { type: "string", enum: ["beginner", "intermediate", "advanced"] },
          question: { type: "string" },
          explanation: { type: "string" },
          options: { type: "array", items: { type: "string" } },
          correctIndex: { type: "integer" },
          answer: { type: "string" },
          accepted: { type: "array", items: { type: "string" } },
          items: { type: "array", items: { type: "string" } },
          correctOrder: { type: "array", items: { type: "integer" } },
          modelAnswer: { type: "string" },
          rubric: { type: "string" },
        },
      },
    },
  },
};

const SYSTEM_PROMPT = `You are SkillSprinter's master item-writer. You generate short, high-quality practice questions that assess one subarea of a skill, tuned to a specific learner profile and difficulty. Write rigorous, unambiguous items in clear, natural English.

OUTPUT
- Produce exactly the requested number of questions — no briefs, no theory, no preamble. Questions only, in the requested structured format.
- Every question is self-contained and answerable without external context. Never reference "the passage above", an image, or anything not in the question text.

QUESTION TYPES — choose the BEST type per question, do not default to one:
- "mcq": a stem plus EXACTLY 4 "options"; "correctIndex" is the 0-based index of the single correct option. Distractors must be plausible and target common misconceptions — never obviously wrong, never "all/none of the above".
- "truefalse": "options" is exactly ["True","False"]; "correctIndex" is 0 (True) or 1 (False). Use sparingly, only for genuinely binary claims.
- "numeric": no options. "answer" is the exact numeric result as a plain string (digits, optional leading minus, optional decimal point — no units, no thousands separators, no words).
- "input": no options. The learner types a short exact answer (a term, name, symbol, or 1-3 words). Provide "accepted": every acceptable spelling/synonym, lowercased and trimmed. Use when there is a small closed set of correct short answers.
- "order": "items" is 3-6 short strings shown shuffled; "correctOrder" is the 0-based indices of "items" in the correct sequence (a permutation). Use for sequencing, ranking, ordering steps, or chronology.
- "free": an open written response graded by AI. No options. Provide "modelAnswer" (a concise full-credit exemplar) and "rubric" (1-2 sentences naming what a full-credit answer must contain). Keep the expected answer under ~120 words.

THE FREE-TEXT RULE — use "free" ONLY WHEN WARRANTED:
- Use "free" when correctness is judgment-based or the learner must PRODUCE prose: empathy/communication (e.g. "respond in one paragraph to someone who says 'my dog is sick and I'm sad'"), explanation/justification, critique, summarizing in their own words.
- Do NOT use "free" for a fact, term, computation, single value, sequence, or choice among known options — those grade instantly as input/numeric/order/mcq.
- Heuristic: if you can list exact acceptable answers, it is NOT free. If a fair grader must read a paragraph and judge it, it IS.

CONCEPT TAGGING — every question carries "concept": a short canonical lowercase kebab-case id naming the single underlying idea (e.g. "linear-equations-one-variable", "active-listening-reflection"). Two questions testing the same idea with different numbers/wording MUST share the same "concept". When the user message lists already-covered concepts, do NOT reuse them — pick fresh, uncovered concepts in the subarea.

DIFFICULTY — "difficulty" is beginner/intermediate/advanced; center on the learner's level and ramp gently. Advanced learners already know the basics: skip foundational recall, weight toward harder items and edge cases.

QUALITY — exactly one defensible correct answer per non-free item; one-sentence "explanation" of the correct answer for every question. Write a warm 2-3 sentence "summary" to the learner about the drill.

Return strictly the requested structured format and nothing else.`;

const GOAL_TEXT: Record<string, string> = {
  exam: "pass an exam",
  career: "level up for work",
  school: "do better in a class",
  growth: "grow a personal skill",
  curiosity: "explore out of curiosity",
};

function freeGuidance(tolerance: number): string {
  if (tolerance < 0.3)
    return "Prefer auto-gradable types; use free-text questions only when truly necessary (often zero).";
  if (tolerance > 0.7)
    return "The learner welcomes written practice — include 2-4 free-text items where they genuinely add value.";
  return "Use free-text only for genuinely open/subjective items (typically 0-2).";
}

function buildUserPrompt(
  skill: SkillDef,
  profile: LearnerProfile,
  area: DrillArea,
  count: number,
  ctx: GenContext
): string {
  const goal = GOAL_TEXT[profile.goal] ?? "general improvement";
  const covered = (ctx.coveredConcepts ?? []).slice(0, 120);
  const coveredBlock = covered.length
    ? covered.map((c) => `- ${c}`).join("\n")
    : "- (none yet — this is the first set in this subarea)";
  const targetFull = ctx.subareaTargetFull ?? 200;
  const target = ctx.masteryTarget ?? targetFull;
  const deadlineLine =
    profile.deadline && profile.deadline !== "unset"
      ? `\n- Deadline: ${profile.deadline}`
      : "";
  const weaknessBlock =
    ctx.weakness && ctx.weakness.length
      ? `\n\nFOLLOW-UP: the learner recently missed these — include fresh (reworded) questions that revisit them, then extend with new concepts:\n${ctx.weakness.map((w) => `- ${w}`).join("\n")}`
      : "";

  return `Generate ${count} practice questions for this learner.

LEARNER PROFILE
- Skill: ${skill.name.en}
- Level: ${profile.level} (proficiency ${profile.proficiency.toFixed(2)})
- Desired depth: ${profile.depth}
- Goal: ${goal}${profile.examName ? ` (${profile.examName})` : ""}${deadlineLine}
- Total time they'll invest: ~${profile.totalHours} hours

SUBAREA TO COVER (focus every question tightly here): ${area.name}${area.blurb ? ` — ${area.blurb}` : ""}

MASTERY CONTEXT
- Full mastery of this subarea is ~${targetFull} distinct concepts.
- For this learner the active target is ~${target} concepts (advanced learners skip the basics).
- Move the learner toward mastery without repeating concepts they've seen.

ALREADY-COVERED CONCEPTS — do NOT generate questions for any of these; choose fresh concepts:
${coveredBlock}

QUESTION-TYPE POLICY
${freeGuidance(profile.freeTextTolerance)}${weaknessBlock}

Produce exactly ${count} questions, ramping difficulty up gently, choosing the best type per question, each with a canonical "concept" tag. Return them and the summary in the structured format.`;
}

function kebab(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function normalizeQuestion(
  raw: unknown,
  skillId: string,
  subareaKey: string,
  runId: string,
  index: number
): QAItem | null {
  const q = raw as Record<string, unknown>;
  const type: QAFormat = (
    ["mcq", "truefalse", "numeric", "input", "order", "free"] as const
  ).includes(q.type as QAFormat)
    ? (q.type as QAFormat)
    : "mcq";

  const question = typeof q.question === "string" ? q.question : "";
  if (!question) return null;
  const explanation = typeof q.explanation === "string" ? q.explanation : "";
  const concept = typeof q.concept === "string" && q.concept ? kebab(q.concept) : `q-${index}`;
  const difficulty: Difficulty = (["beginner", "intermediate", "advanced"] as const).includes(
    q.difficulty as Difficulty
  )
    ? (q.difficulty as Difficulty)
    : "intermediate";

  let options: string[] = [];
  let correctIndex = 0;
  let answerText: string | undefined;
  let acceptedAnswers: string[] = [];
  let orderItems: string[] = [];
  let correctOrder: number[] = [];
  let rubric: string | undefined;

  if (type === "mcq" || type === "truefalse") {
    options = Array.isArray(q.options) ? (q.options as unknown[]).map(String) : [];
    if (type === "truefalse" && options.length < 2) options = ["True", "False"];
    if (options.length < 2) return null;
    options = options.slice(0, type === "truefalse" ? 2 : 4);
    const ci = Number(q.correctIndex);
    correctIndex = Number.isInteger(ci) ? Math.min(Math.max(0, ci), options.length - 1) : 0;
  } else if (type === "numeric") {
    answerText = typeof q.answer === "string" ? q.answer : undefined;
    if (!answerText) return null;
  } else if (type === "input") {
    acceptedAnswers = Array.isArray(q.accepted)
      ? (q.accepted as unknown[]).map((x) => String(x).toLowerCase().trim()).filter(Boolean)
      : [];
    if (!acceptedAnswers.length) return null;
    answerText = acceptedAnswers[0];
  } else if (type === "order") {
    orderItems = Array.isArray(q.items) ? (q.items as unknown[]).map(String) : [];
    correctOrder = Array.isArray(q.correctOrder)
      ? (q.correctOrder as unknown[]).map((n) => Number(n)).filter((n) => Number.isInteger(n))
      : [];
    if (orderItems.length < 2 || correctOrder.length !== orderItems.length) return null;
  } else {
    // free
    answerText = typeof q.modelAnswer === "string" ? q.modelAnswer : undefined;
    rubric = typeof q.rubric === "string" ? q.rubric : undefined;
    if (!answerText && !rubric) return null;
  }

  return {
    id: `gen-${skillId}-${runId}-${index}`,
    skillId,
    subareaKey,
    concept,
    difficulty,
    format: type,
    question: { en: question, pl: question },
    options: { en: options, pl: options },
    correctIndex,
    answerText,
    acceptedAnswers,
    orderItems,
    correctOrder,
    rubric,
    explanation: { en: explanation, pl: explanation },
    xp: XP_BY_DIFFICULTY[difficulty],
  };
}

/** Call Claude to produce a profile-tuned subarea drill. */
export async function generateWithClaude(
  apiKey: string,
  skill: SkillDef,
  profile: LearnerProfile,
  model: string,
  tier: PlanTier,
  area: DrillArea,
  ctx: GenContext
): Promise<{ plan: LearningPlan; items: QAItem[] }> {
  const client = new Anthropic({ apiKey });

  const params = {
    model,
    max_tokens: 8000,
    system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: buildUserPrompt(skill, profile, area, COUNT, ctx) }],
    output_config: {
      format: { type: "json_schema", schema: QUESTION_SET_SCHEMA },
      effort: effortForTier(tier),
    },
  };

  const message = await (client.messages.create as unknown as (
    p: typeof params
  ) => Promise<{ content: Array<{ type: string; text?: string }> }>)(params);

  const text = message.content
    .filter((b) => b.type === "text" && typeof b.text === "string")
    .map((b) => b.text as string)
    .join("");
  const parsed = JSON.parse(text) as { summary?: string; questions?: unknown[] };

  const runId = randomBytes(3).toString("hex");
  const items = (parsed.questions ?? [])
    .map((q, i) => normalizeQuestion(q, skill.id, area.id, runId, i))
    .filter((x): x is QAItem => x !== null);
  if (items.length === 0) throw new Error("Claude returned no usable questions");

  const summaryText = typeof parsed.summary === "string" ? parsed.summary : "";
  const plan = assembleDrill({
    skillId: skill.id,
    level: profile.level,
    focusValues: profile.subareaKeys,
    summary: { en: summaryText, pl: summaryText },
    items,
    areaId: area.id,
    areaName: area.name,
    createdAt: Date.now(),
  });

  return { plan, items };
}

/** Persist a curriculum + its Q&A for a user (tiered fallback for old DBs). */
export async function persistCurriculum(opts: {
  userId: string;
  skill: SkillDef;
  result: { plan: LearningPlan; items: QAItem[] };
  source: string;
  model: string | null;
  answers: OnboardingAnswers;
  area?: DrillArea;
}): Promise<string | undefined> {
  if (!prisma) return undefined;
  const { userId, skill, result, source, model, answers, area } = opts;
  const plan = result.plan;

  const legacyData = {
    userId,
    skillId: skill.id,
    skillName: skill.name.en,
    level: plan.level,
    focus: plan.focus,
    summaryEn: plan.summary.en,
    summaryPl: plan.summary.pl,
    totalPlanned: plan.totalPlanned,
    source,
    model: source === "claude" ? model : null,
    questions: {
      create: result.items.map((it, i) => ({
        clientId: it.id,
        skillId: it.skillId,
        difficulty: it.difficulty,
        questionEn: it.question.en,
        questionPl: it.question.pl,
        optionsEn: it.options.en,
        optionsPl: it.options.pl,
        correctIndex: it.correctIndex,
        explanationEn: it.explanation.en,
        explanationPl: it.explanation.pl,
        xp: it.xp,
        orderIndex: i,
      })),
    },
  };

  // v2 fields (subarea, concept, new payload columns) on top of the legacy shape.
  const baseData = {
    ...legacyData,
    areaId: area?.id ?? null,
    areaName: area?.name ?? null,
    subareaKey: area?.id ?? null,
    questions: {
      create: result.items.map((it, i) => ({
        clientId: it.id,
        skillId: it.skillId,
        difficulty: it.difficulty,
        type: it.format,
        subareaKey: it.subareaKey ?? null,
        concept: it.concept ?? null,
        questionEn: it.question.en,
        questionPl: it.question.pl,
        optionsEn: it.options.en,
        optionsPl: it.options.pl,
        correctIndex: it.correctIndex,
        answerText: it.answerText ?? null,
        acceptedAnswers: it.acceptedAnswers ?? [],
        orderItems: it.orderItems ?? [],
        correctOrder: it.correctOrder ?? [],
        rubric: it.rubric ?? null,
        explanationEn: it.explanation.en,
        explanationPl: it.explanation.pl,
        xp: it.xp,
        orderIndex: i,
      })),
    },
  };

  const create = (data: object) =>
    prisma!.curriculum.create({ data: data as never, select: { id: true } });

  let created: { id: string };
  try {
    created = await create({ ...baseData, answers: answers as object });
  } catch {
    try {
      created = await create(baseData); // `answers` column missing
    } catch (e2) {
      console.warn(
        "[planGen] v2 columns missing; saving in legacy shape. Run skillsprinter-v2.sql.",
        e2
      );
      created = await create(legacyData);
    }
  }

  await prisma.auditEvent
    .create({
      data: {
        userId,
        type: "curriculum.created",
        data: { curriculumId: created.id, skillId: skill.id, source, subareaKey: area?.id ?? null },
      },
    })
    .catch(() => {});

  return created.id;
}

export interface BuildResult {
  plan: LearningPlan;
  items: QAItem[];
  briefs: never[]; // v2: briefs removed (theory is on-demand); kept empty for compat
  source: string;
  model: string | null;
  curriculumId?: string;
}

/**
 * Build a subarea drill for a learner using the model their tier deserves, then
 * persist it. Falls back to the curated bank if no API key / Claude fails.
 */
export async function buildPlanForUser(opts: {
  userId?: string;
  tier: PlanTier;
  skill: SkillDef;
  answers: OnboardingAnswers;
  area?: DrillArea;
  ctx?: GenContext;
  /** Dashboard-chosen starting level — overrides the survey-derived level. */
  levelOverride?: Difficulty;
  /** When false, skip live AI and serve from the bank (e.g. unverified users). */
  live?: boolean;
}): Promise<BuildResult> {
  const { userId, tier, skill, answers, area, ctx = {}, levelOverride, live = true } = opts;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = modelForTier(tier);
  const profile = deriveProfile(answers);
  if (levelOverride) {
    profile.level = levelOverride;
    profile.proficiency = PROF_BY_LEVEL[levelOverride];
  }

  let result: { plan: LearningPlan; items: QAItem[] };
  let source: string;

  if (!apiKey || !area || !live) {
    result = buildBankPlan({ skill, answers });
    source = "bank";
  } else {
    try {
      result = await generateWithClaude(apiKey, skill, profile, model, tier, area, ctx);
      source = "claude";
    } catch (err) {
      console.error("[planGen] generation failed; using bank:", err);
      result = buildBankPlan({ skill, answers });
      source = "bank-fallback";
    }
  }

  let curriculumId: string | undefined;
  if (userId) {
    curriculumId = await persistCurriculum({
      userId,
      skill,
      result,
      source,
      model: source === "claude" ? model : null,
      answers,
      area,
    }).catch((e) => {
      console.error("[planGen] persist failed:", e);
      return undefined;
    });
  }

  return {
    plan: result.plan,
    items: result.items,
    briefs: [],
    source,
    model: source === "claude" ? model : null,
    curriculumId,
  };
}
