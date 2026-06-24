import { randomBytes } from "crypto";
import Anthropic from "@anthropic-ai/sdk";
import { deriveLevel, focusLabels } from "@/lib/onboarding";
import { assemblePlan, assembleDrill, buildBankPlan } from "@/lib/agent";
import { modelForTier } from "@/lib/aiModel";
import { prisma } from "@/lib/db";
import type {
  Brief,
  Difficulty,
  LearningPlan,
  OnboardingAnswers,
  PlanTier,
  QAFormat,
  QAItem,
  SkillDef,
} from "@/lib/types";

/**
 * Server-side plan generation engine. Shared by the /api/generate-plan route
 * and the upgrade-time regeneration (lib/regenerate.ts) so both build and
 * persist curricula the exact same way.
 */

/** A skill area to drill (Stage B). */
export interface DrillArea {
  id: string;
  name: string;
}

const QUESTION_COUNT = 8;
/** Stage B: a single-area drill is a focused batch of this many questions. */
const DRILL_COUNT = 20;
const XP_BY_DIFFICULTY: Record<Difficulty, number> = {
  beginner: 10,
  intermediate: 15,
  advanced: 25,
};

/* ---- Structured-output schema for Claude (English-only) ---- */
const PLAN_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string" },
    briefs: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          body: { type: "string" },
        },
        required: ["title", "body"],
      },
    },
    questions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          type: {
            type: "string",
            enum: ["mcq", "truefalse", "numeric", "free"],
          },
          difficulty: {
            type: "string",
            enum: ["beginner", "intermediate", "advanced"],
          },
          briefIndex: { type: "integer" },
          question: { type: "string" },
          options: { type: "array", items: { type: "string" } },
          correctIndex: { type: "integer" },
          answer: { type: "string" },
          rubric: { type: "string" },
          explanation: { type: "string" },
        },
        required: ["type", "difficulty", "briefIndex", "question", "explanation"],
      },
    },
  },
  required: ["summary", "briefs", "questions"],
};

const SYSTEM_PROMPT = `You are SkillSprinter's master tutor and curriculum designer. You teach a single skill area through short learning briefs followed by varied practice questions, tailored to a learner's level and goals.

Write everything in clear, natural English.

BRIEFS
- Break the area into a sequence of small concepts. For each, write a brief: a short "title" and a "body" of 2–4 sentences that teaches just enough to answer the next questions.
- Each brief primes the 2–3 questions that follow it. Aim for one brief per 2–3 questions.

QUESTIONS — vary the "type":
- "mcq": EXACTLY 4 "options"; "correctIndex" is the 0-based index of the correct one.
- "truefalse": "options" is ["True","False"]; "correctIndex" is 0 or 1.
- "numeric": no options. "answer" is the exact numeric answer as a string (plain digits).
- "free": short open response. No options. Provide a model "answer" and a concise "rubric" (1–2 sentences naming what a full-credit answer must include). Keep it answerable in under 200 characters.
- Use mostly mcq, a few truefalse and numeric where they fit naturally, and 2–4 "free" questions across the set.
- Every question sets "briefIndex" to the 0-based index of the brief it belongs to.
- Write a concise "explanation" (1–2 sentences) of the correct answer for every question.
- Order questions so difficulty ramps up gently from the learner's level. Be accurate and unambiguous.

Write a warm 2–3 sentence "summary" addressed to the learner describing the drill you built. Return your answer strictly in the requested structured format.`;

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
  answers: OnboardingAnswers,
  count: number,
  area?: DrillArea,
  weakness?: string[]
): string {
  const goal = GOAL_TEXT[first(answers, "goal") ?? ""] ?? "general improvement";
  const exp = EXP_TEXT[first(answers, "experience") ?? ""] ?? "some experience";
  const style = STYLE_TEXT[first(answers, "style") ?? ""] ?? "a mix";
  const challenge = CHALLENGE_TEXT[first(answers, "challenge") ?? ""] ?? "a balanced challenge";
  const time = first(answers, "time") ?? "15";
  const selfRating = first(answers, "level") ?? "3";
  const focus = focusEn.length ? focusEn.join(", ") : skill.topics.en.join(", ");

  const areaLine = area
    ? `\nDrill area (focus ALL questions tightly on this one area): ${area.name}`
    : `\nFocus areas they care about most: ${focus}`;
  const concentration = area
    ? `concentrated specifically on "${area.name}"`
    : "concentrated on the focus areas above";

  const weaknessBlock =
    weakness && weakness.length
      ? `\n\nThis is a FOLLOW-UP drill. The learner recently missed questions on these points — include several fresh questions (reworded, not copies) that revisit these concepts, then extend with new material:\n${weakness
          .map((w) => `- ${w}`)
          .join("\n")}`
      : "";

  return `Create a personalized practice set for this learner.

Skill: ${skill.name.en}
Derived level: ${level}
Self-rating (1-5): ${selfRating}
Prior experience: ${exp}
Main goal: ${goal}${areaLine}
Preferred learning style: ${style}
Preferred difficulty: ${challenge}
Time available per day: ~${time} minutes${weaknessBlock}

Generate ${count} questions (mixed types, with briefs) tuned to a ${level} learner, ${concentration}, with difficulty ramping up gradually. Return them (and the briefs and summary) in the structured format.`;
}

function normalizeBriefs(raw: unknown): Brief[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((b, i) => {
      const o = b as Record<string, unknown>;
      return {
        clientId: `brief-${i}`,
        title: typeof o.title === "string" ? o.title : `Concept ${i + 1}`,
        body: typeof o.body === "string" ? o.body : "",
        orderIndex: i,
      };
    })
    .filter((b) => b.body.trim().length > 0);
}

function normalizeQuestion(
  raw: unknown,
  skillId: string,
  runId: string,
  index: number
): QAItem | null {
  const q = raw as Record<string, unknown>;
  const type: QAFormat = (["mcq", "truefalse", "numeric", "free"] as const).includes(
    q.type as QAFormat
  )
    ? (q.type as QAFormat)
    : "mcq";

  const question = typeof q.question === "string" ? q.question : "";
  if (!question) return null;
  const explanation = typeof q.explanation === "string" ? q.explanation : "";
  const answer = typeof q.answer === "string" ? q.answer : undefined;
  const rubric = typeof q.rubric === "string" ? q.rubric : undefined;

  const difficulty: Difficulty = (["beginner", "intermediate", "advanced"] as const).includes(
    q.difficulty as Difficulty
  )
    ? (q.difficulty as Difficulty)
    : "intermediate";

  const briefIndex = Number.isInteger(q.briefIndex) ? Number(q.briefIndex) : -1;
  const briefClientId = briefIndex >= 0 ? `brief-${briefIndex}` : undefined;

  let options: string[] = [];
  let correctIndex = 0;
  if (type === "mcq" || type === "truefalse") {
    options = Array.isArray(q.options) ? (q.options as unknown[]).map(String) : [];
    if (type === "truefalse" && options.length < 2) options = ["True", "False"];
    if (options.length < 2) return null;
    options = options.slice(0, type === "truefalse" ? 2 : 4);
    const ci = Number(q.correctIndex);
    correctIndex = Number.isInteger(ci)
      ? Math.min(Math.max(0, ci), options.length - 1)
      : 0;
  } else if ((type === "numeric" || type === "free") && !answer) {
    return null; // numeric/free need a checkable model answer to grade against
  }

  // English-only content. The {en,pl} shape is kept (pl mirrors en) so the
  // existing NOT NULL Pl columns keep working until they're dropped.
  // The runId keeps clientIds unique per drill, so re-drills don't collide.
  return {
    id: `gen-${skillId}-${runId}-${index}`,
    skillId,
    difficulty,
    format: type,
    question: { en: question, pl: question },
    options: { en: options, pl: options },
    correctIndex,
    answerText: answer,
    rubric,
    briefClientId,
    explanation: { en: explanation, pl: explanation },
    xp: XP_BY_DIFFICULTY[difficulty],
  };
}

/** Call Claude to produce a personalized plan/drill + Q&A with the given model. */
export async function generateWithClaude(
  apiKey: string,
  skill: SkillDef,
  answers: OnboardingAnswers,
  model: string,
  opts?: { area?: DrillArea; count?: number; weakness?: string[] }
): Promise<{ plan: LearningPlan; items: QAItem[]; briefs: Brief[] }> {
  const client = new Anthropic({ apiKey });
  const area = opts?.area;
  const count = opts?.count ?? (area ? DRILL_COUNT : QUESTION_COUNT);
  const level = deriveLevel(answers);
  const focusValues = answers["focus"] ?? [];
  const focusList = focusLabels(skill, focusValues);
  const focusEn = focusList.map((f) => f.en);

  // Note: Opus 4.8 rejects temperature/top_p; do not send them. Structured
  // output is requested via output_config.format (json_schema).
  const params = {
    model,
    max_tokens: 16000,
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
        content: buildUserPrompt(skill, level, focusEn, answers, count, area, opts?.weakness),
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
    summary?: string;
    briefs?: unknown[];
    questions?: unknown[];
  };

  const runId = randomBytes(3).toString("hex"); // unique per drill
  const briefs = normalizeBriefs(parsed.briefs);
  const items = (parsed.questions ?? [])
    .map((q, i) => normalizeQuestion(q, skill.id, runId, i))
    .filter((x): x is QAItem => x !== null);

  if (items.length === 0) throw new Error("Claude returned no usable questions");

  const summaryText = typeof parsed.summary === "string" ? parsed.summary : "";
  const summary = { en: summaryText, pl: summaryText };

  const plan = area
    ? assembleDrill({
        skillId: skill.id,
        level,
        focusValues,
        summary,
        items,
        areaId: area.id,
        areaName: area.name,
        createdAt: Date.now(),
      })
    : assemblePlan({
        skillId: skill.id,
        level,
        focusValues,
        summary,
        items,
        createdAt: Date.now(),
      });

  return { plan, items, briefs };
}

/** Persist a curriculum + its Q&A for a user (best-effort; returns its id). */
export async function persistCurriculum(opts: {
  userId: string;
  skill: SkillDef;
  result: { plan: LearningPlan; items: QAItem[]; briefs?: Brief[] };
  source: string;
  model: string | null;
  answers: OnboardingAnswers;
  area?: DrillArea;
}): Promise<string | undefined> {
  if (!prisma) return undefined;
  const { userId, skill, result, source, model, answers, area } = opts;
  const plan = result.plan;
  const briefs = result.briefs ?? [];

  // The pre-Stage-B columns every database has. Used as the last-resort
  // fallback so a curriculum still saves even if newer columns are missing.
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

  // Stage B fields (area, briefs, question type/answer/rubric) on top.
  const baseData = {
    ...legacyData,
    areaId: area?.id ?? null,
    areaName: area?.name ?? null,
    briefs: {
      create: briefs.map((b) => ({
        clientId: b.clientId,
        title: b.title,
        body: b.body,
        orderIndex: b.orderIndex,
      })),
    },
    questions: {
      create: result.items.map((it, i) => ({
        clientId: it.id,
        skillId: it.skillId,
        difficulty: it.difficulty,
        type: it.format,
        briefClientId: it.briefClientId ?? null,
        questionEn: it.question.en,
        questionPl: it.question.pl,
        optionsEn: it.options.en,
        optionsPl: it.options.pl,
        correctIndex: it.correctIndex,
        answerText: it.answerText ?? null,
        rubric: it.rubric ?? null,
        explanationEn: it.explanation.en,
        explanationPl: it.explanation.pl,
        xp: it.xp,
        orderIndex: i,
      })),
    },
  };

  // Persist with progressively fewer optional columns so an un-migrated DB
  // still saves the curriculum rather than dropping it: full → no answers →
  // legacy (pre-Stage-B) shape.
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
        "[planGen] Stage B columns missing; saving in legacy shape. Run skillsprinter-stage-b.sql.",
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
        data: { curriculumId: created.id, skillId: skill.id, source },
      },
    })
    .catch(() => {});

  return created.id;
}

export interface BuildResult {
  plan: LearningPlan;
  items: QAItem[];
  briefs: Brief[];
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
  area?: DrillArea;
  weakness?: string[];
}): Promise<BuildResult> {
  const { userId, tier, skill, answers, area, weakness } = opts;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = modelForTier(tier);

  let result: { plan: LearningPlan; items: QAItem[]; briefs: Brief[] };
  let source: string;

  if (!apiKey) {
    result = { ...buildBankPlan({ skill, answers }), briefs: [] };
    source = "bank";
  } else {
    try {
      result = await generateWithClaude(apiKey, skill, answers, model, { area, weakness });
      source = "claude";
    } catch (err) {
      console.error("[planGen] Claude generation failed; using bank:", err);
      result = { ...buildBankPlan({ skill, answers }), briefs: [] };
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

  return { ...result, source, model: source === "claude" ? model : null, curriculumId };
}
