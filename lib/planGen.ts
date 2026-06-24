import Anthropic from "@anthropic-ai/sdk";
import { deriveLevel, focusLabels } from "@/lib/onboarding";
import { assemblePlan, buildBankPlan } from "@/lib/agent";
import { modelForTier } from "@/lib/aiModel";
import { prisma } from "@/lib/db";
import type {
  Difficulty,
  LearningPlan,
  OnboardingAnswers,
  PlanTier,
  QAItem,
  SkillDef,
} from "@/lib/types";

/**
 * Server-side plan generation engine. Shared by the /api/generate-plan route
 * and the upgrade-time regeneration (lib/regenerate.ts) so both build and
 * persist curricula the exact same way.
 */

const QUESTION_COUNT = 8;
const XP_BY_DIFFICULTY: Record<Difficulty, number> = {
  beginner: 10,
  intermediate: 15,
  advanced: 25,
};

/* ---- Structured-output schema for Claude ---- */
const I18N = {
  type: "object",
  additionalProperties: false,
  properties: { en: { type: "string" }, pl: { type: "string" } },
  required: ["en", "pl"],
};

const PLAN_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: I18N,
    questions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          difficulty: {
            type: "string",
            enum: ["beginner", "intermediate", "advanced"],
          },
          question: I18N,
          optionsEn: { type: "array", items: { type: "string" } },
          optionsPl: { type: "array", items: { type: "string" } },
          correctIndex: { type: "integer" },
          explanation: I18N,
        },
        required: [
          "difficulty",
          "question",
          "optionsEn",
          "optionsPl",
          "correctIndex",
          "explanation",
        ],
      },
    },
  },
  required: ["summary", "questions"],
};

const SYSTEM_PROMPT = `You are SkillSprinter's master tutor and curriculum designer. You create short, high-quality multiple-choice practice questions tailored to a learner's skill, level, and interests.

Rules:
- Produce questions in BOTH English and Polish. The Polish must be a natural, fluent translation — not literal. Keep meaning and the correct answer identical across languages.
- Every question has EXACTLY 4 options. "optionsEn" and "optionsPl" are parallel arrays in the same order; "correctIndex" is the 0-based index of the correct option (same index in both languages).
- For numeric/math options, the same digits may be used in both languages.
- Write a concise, helpful "explanation" (1–2 sentences) for why the correct answer is right, in both languages.
- Order questions so difficulty ramps up gently from the learner's level.
- Keep questions accurate, unambiguous, and genuinely useful. No trick questions.
- Write a warm 2–3 sentence "summary" addressed to the learner (in both languages) describing the plan you built.
Return your answer strictly in the requested structured format.`;

const GOAL_TEXT: Record<string, string> = {
  exam: "pass an exam or test",
  career: "grow their career",
  school: "do better at school",
  growth: "personal growth",
  curiosity: "curiosity",
};
const EXP_TEXT: Record<string, string> = {
  none: "brand new to this",
  little: "a little experience",
  some: "quite a bit of experience",
  lots: "a lot of experience",
};
const STYLE_TEXT: Record<string, string> = {
  drills: "quick drills",
  deep: "deep dives",
  mix: "a mix of both",
};
const CHALLENGE_TEXT: Record<string, string> = {
  gentle: "ease in gently",
  balanced: "a balanced challenge",
  push: "push hard",
};

function first(answers: OnboardingAnswers, key: string): string | undefined {
  return answers[key]?.[0];
}

function buildUserPrompt(
  skill: SkillDef,
  level: Difficulty,
  focusEn: string[],
  answers: OnboardingAnswers
): string {
  const goal = GOAL_TEXT[first(answers, "goal") ?? ""] ?? "general improvement";
  const exp = EXP_TEXT[first(answers, "experience") ?? ""] ?? "some experience";
  const style = STYLE_TEXT[first(answers, "style") ?? ""] ?? "a mix";
  const challenge = CHALLENGE_TEXT[first(answers, "challenge") ?? ""] ?? "a balanced challenge";
  const time = first(answers, "time") ?? "15";
  const selfRating = first(answers, "level") ?? "3";
  const focus = focusEn.length ? focusEn.join(", ") : skill.topics.en.join(", ");

  return `Create a personalized practice set for this learner.

Skill: ${skill.name.en}
Derived level: ${level}
Self-rating (1-5): ${selfRating}
Prior experience: ${exp}
Main goal: ${goal}
Focus areas they care about most: ${focus}
Preferred learning style: ${style}
Preferred difficulty: ${challenge}
Time available per day: ~${time} minutes

Generate ${QUESTION_COUNT} multiple-choice questions tuned to a ${level} learner, concentrated on the focus areas above, with difficulty ramping up gradually. Return them (and the summary) in the structured format.`;
}

function normalizeQuestion(
  raw: unknown,
  skillId: string,
  index: number
): QAItem | null {
  const q = raw as Record<string, unknown>;
  const en = Array.isArray(q.optionsEn)
    ? (q.optionsEn as unknown[]).map(String).slice(0, 4)
    : [];
  let pl = Array.isArray(q.optionsPl)
    ? (q.optionsPl as unknown[]).map(String).slice(0, 4)
    : [];
  if (en.length < 2) return null;
  if (pl.length !== en.length) pl = [...en];

  const difficulty: Difficulty = (["beginner", "intermediate", "advanced"] as const).includes(
    q.difficulty as Difficulty
  )
    ? (q.difficulty as Difficulty)
    : "intermediate";

  const ci = Number(q.correctIndex);
  const correctIndex = Number.isInteger(ci)
    ? Math.min(Math.max(0, ci), en.length - 1)
    : 0;

  const question = q.question as { en?: string; pl?: string } | undefined;
  const explanation = q.explanation as { en?: string; pl?: string } | undefined;

  return {
    id: `gen-${skillId}-${index}`,
    skillId,
    difficulty,
    format: "mcq",
    question: { en: question?.en ?? "", pl: question?.pl ?? question?.en ?? "" },
    options: { en, pl },
    correctIndex,
    explanation: {
      en: explanation?.en ?? "",
      pl: explanation?.pl ?? explanation?.en ?? "",
    },
    xp: XP_BY_DIFFICULTY[difficulty],
  };
}

/** Call Claude to produce a personalized plan + Q&A with the given model. */
export async function generateWithClaude(
  apiKey: string,
  skill: SkillDef,
  answers: OnboardingAnswers,
  model: string
): Promise<{ plan: LearningPlan; items: QAItem[] }> {
  const client = new Anthropic({ apiKey });
  const level = deriveLevel(answers);
  const focusValues = answers["focus"] ?? [];
  const focusList = focusLabels(skill, focusValues);
  const focusEn = focusList.map((f) => f.en);

  // Note: Opus 4.8 rejects temperature/top_p; do not send them. Structured
  // output is requested via output_config.format (json_schema).
  const params = {
    model,
    max_tokens: 8000,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: buildUserPrompt(skill, level, focusEn, answers),
      },
    ],
    output_config: {
      format: { type: "json_schema", schema: PLAN_JSON_SCHEMA },
    },
  };

  // Cast to satisfy SDK typings across versions; runtime shape follows the docs.
  const message = await (client.messages.create as unknown as (
    p: typeof params
  ) => Promise<{ content: Array<{ type: string; text?: string }> }>)(params);

  const text = message.content
    .filter((b) => b.type === "text" && typeof b.text === "string")
    .map((b) => b.text as string)
    .join("");

  const parsed = JSON.parse(text) as {
    summary?: { en?: string; pl?: string };
    questions?: unknown[];
  };

  const items = (parsed.questions ?? [])
    .map((q, i) => normalizeQuestion(q, skill.id, i))
    .filter((x): x is QAItem => x !== null);

  if (items.length === 0) throw new Error("Claude returned no usable questions");

  const summary = {
    en: parsed.summary?.en ?? "",
    pl: parsed.summary?.pl ?? parsed.summary?.en ?? "",
  };

  const plan = assemblePlan({
    skillId: skill.id,
    level,
    focusValues,
    summary,
    items,
    createdAt: Date.now(),
  });

  return { plan, items };
}

/** Persist a curriculum + its Q&A for a user (best-effort; returns its id). */
export async function persistCurriculum(opts: {
  userId: string;
  skill: SkillDef;
  result: { plan: LearningPlan; items: QAItem[] };
  source: string;
  model: string | null;
  answers: OnboardingAnswers;
}): Promise<string | undefined> {
  if (!prisma) return undefined;
  const { userId, skill, result, source, model, answers } = opts;
  const plan = result.plan;

  // Built without `answers` so we can retry without it if that column is
  // missing from an older database (otherwise a single missing column would
  // drop the whole curriculum and the skill would never reach the dashboard).
  const baseData = {
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

  let created: { id: string };
  try {
    created = await prisma.curriculum.create({
      data: { ...baseData, answers: answers as object },
      select: { id: true },
    });
  } catch (e) {
    // Most likely the `answers` column doesn't exist yet on this DB. Persist
    // the curriculum anyway (upgrade-regeneration just can't use stored answers
    // until you run: ALTER TABLE "Curriculum" ADD COLUMN "answers" JSONB;).
    console.warn(
      "[planGen] curriculum insert with answers failed; retrying without it:",
      e
    );
    created = await prisma.curriculum.create({
      data: baseData,
      select: { id: true },
    });
  }

  await prisma.auditEvent
    .create({
      data: {
        userId,
        type: "curriculum.created",
        data: { curriculumId: created.id, skillId: skill.id, source },
      },
    })
    .catch(() => {});

  return created.id;
}

export interface BuildResult {
  plan: LearningPlan;
  items: QAItem[];
  source: string;
  model: string | null;
  curriculumId?: string;
}

/**
 * Build a plan for a learner using the model their tier deserves, then persist
 * it (when a userId + DB are available). Falls back to the curated bank if no
 * API key is set or Claude fails, so the flow never dead-ends.
 */
export async function buildPlanForUser(opts: {
  userId?: string;
  tier: PlanTier;
  skill: SkillDef;
  answers: OnboardingAnswers;
}): Promise<BuildResult> {
  const { userId, tier, skill, answers } = opts;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = modelForTier(tier);

  let result: { plan: LearningPlan; items: QAItem[] };
  let source: string;

  if (!apiKey) {
    result = buildBankPlan({ skill, answers });
    source = "bank";
  } else {
    try {
      result = await generateWithClaude(apiKey, skill, answers, model);
      source = "claude";
    } catch (err) {
      console.error("[planGen] Claude generation failed; using bank:", err);
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
    }).catch((e) => {
      console.error("[planGen] persist failed:", e);
      return undefined;
    });
  }

  return { ...result, source, model: source === "claude" ? model : null, curriculumId };
}
