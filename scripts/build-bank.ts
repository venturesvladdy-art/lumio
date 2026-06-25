/**
 * Offline Content Bank builder (Proposal §2.2 / Phase 2).
 *
 *   npx tsx scripts/build-bank.ts            # build all predefined skills
 *   BANK_N=12 npx tsx scripts/build-bank.ts  # 12 questions per subarea×difficulty
 *   BANK_SKILLS=python,chess npx tsx scripts/build-bank.ts
 *
 * Requires ANTHROPIC_API_KEY and DATABASE_URL in the environment. This SPENDS
 * real Claude credits (see the proposal's cost table — roughly $0.003–0.01 per
 * question, so a full build is tens of dollars). The seed in
 * skillsprinter-bank-seed.sql already gives every skill a starter bank at $0;
 * run THIS only to expand coverage. Safe to re-run (it appends approved rows).
 *
 * Pipeline per (skill → subarea → difficulty):
 *   1. generate N questions with Opus (structured output, the app's schema)
 *   2. validate structure + an independent answer-key self-check (cheap Haiku)
 *   3. generate theory per surviving question (Haiku)
 *   4. insert as qualityState="approved" (failures stored "draft", never served)
 *
 * NOTE: cost-halving via the Message Batches API is left as a follow-up — this
 * v1 uses synchronous calls for simplicity and correctness. For large runs,
 * switch generateSet/selfCheck/genTheory to batches.create + polling.
 *
 * Env: set ANTHROPIC_API_KEY and DATABASE_URL in your shell, or run with
 *   node --env-file=.env.local --import tsx scripts/build-bank.ts
 */
import Anthropic from "@anthropic-ai/sdk";
import { PrismaClient } from "@prisma/client";
import { SKILLS } from "../lib/skills";
import { resolveTaxonomy } from "../lib/taxonomy";

const prisma = new PrismaClient();
const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) throw new Error("ANTHROPIC_API_KEY is required");
const client = new Anthropic({ apiKey });

const GEN_MODEL = process.env.BANK_GEN_MODEL || "claude-opus-4-8";
const CHECK_MODEL = process.env.BANK_CHECK_MODEL || "claude-haiku-4-5";
const THEORY_MODEL = process.env.BANK_THEORY_MODEL || "claude-haiku-4-5";
const N = Math.max(1, Math.min(30, Number(process.env.BANK_N) || 8));
const DIFFS = ["beginner", "intermediate", "advanced"] as const;
const XP: Record<string, number> = { beginner: 10, intermediate: 15, advanced: 25 };
const batchId = `build-${new Date().toISOString().slice(0, 19)}`;

const QUESTION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["questions"],
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["type", "concept", "question", "explanation"],
        properties: {
          type: { type: "string", enum: ["mcq", "truefalse", "numeric", "input", "order"] },
          concept: { type: "string" },
          question: { type: "string" },
          explanation: { type: "string" },
          options: { type: "array", items: { type: "string" } },
          correctIndex: { type: "integer" },
          answer: { type: "string" },
          accepted: { type: "array", items: { type: "string" } },
          items: { type: "array", items: { type: "string" } },
          correctOrder: { type: "array", items: { type: "integer" } },
        },
      },
    },
  },
};

const SYSTEM = `You are SkillSprinter's master item-writer. Generate rigorous, unambiguous, self-contained practice questions for ONE subarea at a fixed difficulty. Exactly one defensible correct answer each; plausible distractors (never "all/none of the above"). Prefer mcq (EXACTLY 4 options); truefalse uses ["True","False"]; numeric gives "answer" (plain number); input gives "accepted" (lowercased synonyms); order gives "items" + "correctOrder". Every question carries a kebab-case "concept" id; do not reuse concepts listed as covered. Return strictly the structured format.`;

async function callJson(model: string, system: string, user: string, schema: object): Promise<any> {
  const params = {
    model,
    max_tokens: 8000,
    system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: user }],
    output_config: { format: { type: "json_schema", schema } },
  };
  const msg = (await (client.messages.create as any)(params)) as {
    content: Array<{ type: string; text?: string }>;
  };
  const text = msg.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  return JSON.parse(text);
}

const CHECK_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["correct"],
  properties: { correct: { type: "boolean" } },
};

/** Independent answer-key check: does the keyed answer actually solve the item? */
async function selfCheck(q: any): Promise<boolean> {
  const keyed =
    q.type === "mcq" || q.type === "truefalse"
      ? `Keyed correct option: ${q.options?.[q.correctIndex]}`
      : q.type === "order"
      ? `Keyed order: ${(q.correctOrder ?? []).map((i: number) => q.items?.[i]).join(" → ")}`
      : `Keyed answer: ${q.answer ?? (q.accepted ?? [])[0]}`;
  try {
    const r = await callJson(
      CHECK_MODEL,
      "You verify answer keys. Reply correct=true ONLY if the keyed answer is genuinely correct for the question. Be strict.",
      `Question: ${q.question}\n${keyed}\nIs the keyed answer correct?`,
      CHECK_SCHEMA
    );
    return Boolean(r.correct);
  } catch {
    return false;
  }
}

async function genTheory(skillName: string, q: any): Promise<string | null> {
  try {
    const r = await callJson(
      THEORY_MODEL,
      "Write 2-4 plain sentences of background theory that make the concept click for a learner. No markdown, no preamble.",
      `Skill: ${skillName}\nQuestion: ${q.question}\nWrite the background theory.`,
      { type: "object", additionalProperties: false, required: ["theory"], properties: { theory: { type: "string" } } }
    );
    return typeof r.theory === "string" ? r.theory : null;
  } catch {
    return null;
  }
}

function kebab(s: string): string {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}

function valid(q: any): boolean {
  if (!q.question || !q.explanation) return false;
  if (q.type === "mcq") return Array.isArray(q.options) && q.options.length === 4 && q.correctIndex >= 0 && q.correctIndex < 4;
  if (q.type === "truefalse") return Array.isArray(q.options) && q.options.length === 2 && (q.correctIndex === 0 || q.correctIndex === 1);
  if (q.type === "numeric") return typeof q.answer === "string" && q.answer.length > 0;
  if (q.type === "input") return Array.isArray(q.accepted) && q.accepted.length > 0;
  if (q.type === "order") return Array.isArray(q.items) && Array.isArray(q.correctOrder) && q.items.length === q.correctOrder.length;
  return false;
}

async function main() {
  const want = (process.env.BANK_SKILLS || "").split(",").map((s) => s.trim()).filter(Boolean);
  const skills = SKILLS.filter((s) => s.predefined && (want.length === 0 || want.includes(s.id)));
  let inserted = 0;

  for (const skill of skills) {
    const tax = await resolveTaxonomy(skill);
    if (!tax) continue;
    for (const area of tax.areas) {
      for (const sub of area.subareas) {
        // Concepts already in the bank for this subarea — don't repeat.
        const existing = await prisma.bankQuestion.findMany({
          where: { skillId: skill.id, subareaKey: sub.subareaKey },
          select: { concept: true },
        });
        const covered = new Set(existing.map((e) => e.concept));

        for (const difficulty of DIFFS) {
          const user = `Skill: ${skill.name.en}\nSubarea: ${sub.name}${sub.blurb ? ` — ${sub.blurb}` : ""}\nDifficulty: ${difficulty}\nProduce exactly ${N} questions.\nAlready-covered concepts (do NOT reuse): ${[...covered].join(", ") || "(none)"}`;
          let gen: any;
          try {
            gen = await callJson(GEN_MODEL, SYSTEM, user, QUESTION_SCHEMA);
          } catch (e) {
            console.warn(`  ! gen failed ${skill.id}/${sub.subareaKey}/${difficulty}:`, (e as Error).message);
            continue;
          }
          for (const q of gen.questions ?? []) {
            if (!valid(q)) continue;
            const concept = kebab(q.concept || `${sub.subareaKey}-${difficulty}`);
            if (covered.has(concept)) continue;
            const approved = await selfCheck(q);
            const theory = approved ? await genTheory(skill.name.en, q) : null;
            await prisma.bankQuestion.create({
              data: {
                skillId: skill.id,
                subareaKey: sub.subareaKey,
                concept,
                difficulty,
                type: q.type,
                questionEn: q.question,
                questionPl: q.question,
                optionsEn: q.options ?? [],
                optionsPl: q.options ?? [],
                correctIndex: q.type === "mcq" || q.type === "truefalse" ? q.correctIndex : 0,
                answerText: q.answer ?? (q.accepted ?? [])[0] ?? null,
                acceptedAnswers: (q.accepted ?? []).map((x: string) => String(x).toLowerCase()),
                orderItems: q.items ?? [],
                correctOrder: q.correctOrder ?? [],
                explanationEn: q.explanation,
                explanationPl: q.explanation,
                theoryEn: theory,
                theoryPl: theory,
                xp: XP[difficulty] ?? 10,
                qualityState: approved ? "approved" : "draft",
                model: GEN_MODEL,
                buildBatchId: batchId,
              },
            });
            covered.add(concept);
            if (approved) inserted += 1;
          }
          console.log(`  ${skill.id} / ${sub.subareaKey} / ${difficulty}: done (${inserted} approved so far)`);
        }
      }
    }
  }
  console.log(`\nBuild ${batchId} complete — ${inserted} approved questions inserted.`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
