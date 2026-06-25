import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db";
import { TAXONOMY_MODEL } from "@/lib/aiModel";
import { clampTarget } from "@/lib/mastery";
import type { SkillDef } from "@/lib/types";

/**
 * Reusable skill taxonomy catalogue. A skill is broken into areas → subareas
 * once and reused by every learner: curated for the predefined skills (instant,
 * high-quality), the SkillTaxonomy table cache for everything generated, and an
 * Opus generation for brand-new custom skills (with a topic-derived fallback so
 * the flow never blocks).
 */

export interface TaxSubarea {
  subareaKey: string;
  name: string;
  blurb: string;
  conceptTarget: number;
}
export interface TaxArea {
  areaKey: string;
  name: string;
  blurb: string;
  subareas: TaxSubarea[];
}
export interface Taxonomy {
  skillId: string;
  kind: "standardized" | "subjective";
  areas: TaxArea[];
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

/** Normalized dedupe key for matching a skill to a catalogued taxonomy. */
export function normalizeMatchKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

const BREADTH_TARGET: Record<string, number> = { narrow: 120, medium: 200, broad: 300 };

/** Assemble a Taxonomy from a compact spec, computing stable keys. */
function make(
  skillSlug: string,
  kind: Taxonomy["kind"],
  areas: {
    name: string;
    blurb: string;
    subs: { name: string; blurb: string; target?: number }[];
  }[]
): Taxonomy {
  return {
    skillId: skillSlug,
    kind,
    areas: areas.map((a) => {
      const areaKey = `${skillSlug}:${slugify(a.name)}`;
      return {
        areaKey,
        name: a.name,
        blurb: a.blurb,
        subareas: a.subs.map((s) => ({
          subareaKey: `${areaKey}:${slugify(s.name)}`,
          name: s.name,
          blurb: s.blurb,
          conceptTarget: clampTarget(s.target ?? 200),
        })),
      };
    }),
  };
}

/* ───────────────── Curated taxonomies (predefined skills) ───────────────── */

const CURATED: Record<string, Taxonomy> = {
  sat: make("sat", "standardized", [
    {
      name: "Reading & Writing",
      blurb: "The SAT's verbal section — comprehension, expression, and conventions.",
      subs: [
        { name: "Craft and Structure", blurb: "Vocabulary in context, text structure, purpose, and cross-text connections.", target: 240 },
        { name: "Information and Ideas", blurb: "Central ideas, command of evidence, and inferences from texts and data.", target: 260 },
        { name: "Standard English Conventions", blurb: "Sentence structure, punctuation, and usage.", target: 220 },
        { name: "Expression of Ideas", blurb: "Rhetorical synthesis and transitions to improve writing.", target: 180 },
      ],
    },
    {
      name: "Math",
      blurb: "The SAT's quantitative section across four reporting categories.",
      subs: [
        { name: "Algebra", blurb: "Linear equations, inequalities, and systems in one and two variables.", target: 280 },
        { name: "Advanced Math", blurb: "Nonlinear equations, functions, and polynomial expressions.", target: 300 },
        { name: "Problem-Solving and Data Analysis", blurb: "Ratios, rates, percentages, and quantitative data interpretation.", target: 240 },
        { name: "Geometry and Trigonometry", blurb: "Lines, angles, triangles, circles, area/volume, and right-triangle trig.", target: 220 },
      ],
    },
  ]),
  gmat: make("gmat", "standardized", [
    {
      name: "Quantitative Reasoning",
      blurb: "Problem solving with arithmetic and algebra.",
      subs: [
        { name: "Arithmetic", blurb: "Number properties, fractions, percentages, and ratios.", target: 240 },
        { name: "Algebra", blurb: "Equations, inequalities, exponents, and functions.", target: 260 },
        { name: "Word Problems", blurb: "Rates, work, mixtures, and translating prose to equations.", target: 240 },
      ],
    },
    {
      name: "Verbal Reasoning",
      blurb: "Reading and reasoning with arguments and prose.",
      subs: [
        { name: "Critical Reasoning", blurb: "Evaluate, strengthen, and weaken arguments.", target: 240 },
        { name: "Reading Comprehension", blurb: "Main idea, inference, and detail across passages.", target: 220 },
      ],
    },
    {
      name: "Data Insights",
      blurb: "Reasoning with data across multiple formats.",
      subs: [
        { name: "Data Sufficiency", blurb: "Decide whether given data is enough to answer.", target: 200 },
        { name: "Graphics & Tables", blurb: "Interpret charts, tables, and multi-source data.", target: 180 },
      ],
    },
  ]),
  interpersonal: make("interpersonal", "subjective", [
    {
      name: "Communication",
      blurb: "Conveying and receiving messages effectively.",
      subs: [
        { name: "Active Listening", blurb: "Attending, reflecting, and clarifying to understand others.", target: 140 },
        { name: "Clear Expression", blurb: "Saying what you mean with empathy and precision.", target: 140 },
        { name: "Giving & Receiving Feedback", blurb: "Specific, kind, actionable feedback both ways.", target: 140 },
      ],
    },
    {
      name: "Relationship Building",
      blurb: "Trust, rapport, and working with others.",
      subs: [
        { name: "Empathy", blurb: "Recognizing and responding to others' emotions.", target: 120 },
        { name: "Conflict Resolution", blurb: "De-escalating and finding shared solutions.", target: 140 },
        { name: "Negotiation", blurb: "Reaching agreements that work for everyone.", target: 160 },
      ],
    },
  ]),
  engineering: make("engineering", "standardized", [
    {
      name: "Foundations",
      blurb: "Core physical and mathematical principles.",
      subs: [
        { name: "Mechanics", blurb: "Forces, motion, energy, and equilibrium.", target: 260 },
        { name: "Circuits", blurb: "Voltage, current, resistance, and basic networks.", target: 240 },
        { name: "Units & Measurement", blurb: "Dimensional analysis and significant figures.", target: 120 },
      ],
    },
    {
      name: "Systems",
      blurb: "Designing and reasoning about engineered systems.",
      subs: [
        { name: "Algorithms", blurb: "Complexity, data structures, and problem decomposition.", target: 280 },
        { name: "Reliability", blurb: "Failure modes, redundancy, and safety factors.", target: 180 },
      ],
    },
  ]),
  ai: make("ai", "standardized", [
    {
      name: "Machine Learning",
      blurb: "How models learn from data.",
      subs: [
        { name: "Core Concepts", blurb: "Supervised vs unsupervised, training, and generalization.", target: 220 },
        { name: "Neural Networks", blurb: "Layers, activations, and backpropagation.", target: 240 },
        { name: "Evaluation", blurb: "Metrics, validation, overfitting, and bias.", target: 200 },
      ],
    },
    {
      name: "Large Language Models",
      blurb: "Modern LLMs and how to use them.",
      subs: [
        { name: "How LLMs Work", blurb: "Tokens, transformers, and pretraining.", target: 220 },
        { name: "Prompting", blurb: "Instructions, context, and structured outputs.", target: 180 },
      ],
    },
  ]),
};

/* ───────────────── AI generation (custom skills) ───────────────── */

const TAXONOMY_SYSTEM_PROMPT = `You are a curriculum architect. Break ONE skill into a clean, two-level map of expertise: AREAS, each split into SUBAREAS. This map is catalogued once and reused by every learner, so it must be canonical, stable, and complete — not a personal study plan.

FIRST decide the kind of skill:
- STANDARDIZED: a well-known body of knowledge with a widely-accepted structure (standardized tests, academic subjects, certifications, formal disciplines). Reproduce the established, recognized breakdown practitioners actually use — not an invented one. Set "structured": true and name the source in "sourceNote".
- OPEN-ENDED: a subjective/fuzzy skill with no single canonical structure (interpersonal skills, creativity, leadership). Design the most natural, widely-defensible breakdown a thoughtful expert would agree with. Set "structured": false.

RULES:
- 3-6 AREAS; each AREA has 2-6 SUBAREAS; 12-30 subareas total.
- AREAS are broad pillars; SUBAREAS are concrete things a learner drills and is tested on — specific enough to write practice questions against and measure mastery within.
- Order foundational -> advanced. Names are short noun phrases (2-5 words), Title Case, no numbering, distinct within their parent, no overlap.
- "breadth" estimates how much distinct material a subarea contains (narrow / medium / broad) — it sets how many questions full mastery requires. Be honest.
- Each "blurb" is ONE plain sentence describing what the area/subarea covers.

Return ONLY the structured object — no study advice, levels, or time estimates.`;

const TAXONOMY_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["structured", "sourceNote", "areas"],
  properties: {
    structured: { type: "boolean" },
    sourceNote: { type: "string" },
    areas: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "blurb", "subareas"],
        properties: {
          name: { type: "string" },
          blurb: { type: "string" },
          subareas: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["name", "blurb", "breadth"],
              properties: {
                name: { type: "string" },
                blurb: { type: "string" },
                breadth: { type: "string", enum: ["narrow", "medium", "broad"] },
              },
            },
          },
        },
      },
    },
  },
};

async function generateTaxonomy(skill: SkillDef): Promise<Taxonomy | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  try {
    const client = new Anthropic({ apiKey });
    const params = {
      model: TAXONOMY_MODEL,
      max_tokens: 2500,
      system: [{ type: "text", text: TAXONOMY_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      messages: [
        {
          role: "user",
          content: `Skill: ${skill.name.en}\n${skill.description.en}\n\nProduce the canonical AREA -> SUBAREA map. If a well-accepted structure exists, reproduce it faithfully.`,
        },
      ],
      output_config: { format: { type: "json_schema", schema: TAXONOMY_JSON_SCHEMA } },
    };
    const message = await (client.messages.create as unknown as (
      p: typeof params
    ) => Promise<{ content: Array<{ type: string; text?: string }> }>)(params);
    const text = message.content
      .filter((b) => b.type === "text" && typeof b.text === "string")
      .map((b) => b.text as string)
      .join("");
    const parsed = JSON.parse(text) as {
      structured?: boolean;
      areas?: { name: string; blurb: string; subareas: { name: string; blurb: string; breadth: string }[] }[];
    };
    const areas = (parsed.areas ?? []).filter((a) => a?.name && Array.isArray(a.subareas) && a.subareas.length);
    if (areas.length < 2) return null;
    return make(
      skill.id,
      parsed.structured ? "standardized" : "subjective",
      areas.map((a) => ({
        name: a.name,
        blurb: a.blurb ?? "",
        subs: a.subareas
          .filter((s) => s?.name)
          .map((s) => ({ name: s.name, blurb: s.blurb ?? "", target: BREADTH_TARGET[s.breadth] ?? 200 })),
      }))
    );
  } catch (e) {
    console.error("[taxonomy] generation failed:", e);
    return null;
  }
}

/** Last-resort taxonomy from a skill's topics (one area, each topic a subarea). */
function fallbackTaxonomy(skill: SkillDef): Taxonomy {
  return make(skill.id, "subjective", [
    {
      name: "Core Areas",
      blurb: `Key areas of ${skill.name.en}.`,
      subs: skill.topics.en.map((t) => ({ name: t, blurb: `Practice ${t}.`, target: 180 })),
    },
  ]);
}

/**
 * Resolve a skill's taxonomy: curated → DB cache → Opus generation → topic
 * fallback. Generated taxonomies are cached in SkillTaxonomy for reuse.
 */
export async function resolveTaxonomy(skill: SkillDef): Promise<Taxonomy> {
  const curated = CURATED[skill.id];
  if (curated) return curated;

  const skillSlug = skill.id;
  const matchKey = normalizeMatchKey(skill.name.en);

  if (prisma) {
    try {
      const cached = await prisma.skillTaxonomy.findFirst({
        where: { OR: [{ skillSlug }, { matchKey }] },
      });
      if (cached) {
        return { skillId: skillSlug, kind: cached.kind as Taxonomy["kind"], areas: cached.areas as unknown as TaxArea[] };
      }
    } catch (e) {
      console.error("[taxonomy] cache read failed:", e);
    }
  }

  const generated = (await generateTaxonomy(skill)) ?? fallbackTaxonomy(skill);

  if (prisma && generated.areas.length >= 2) {
    try {
      await prisma.skillTaxonomy.upsert({
        where: { skillSlug },
        create: {
          skillSlug,
          canonicalName: skill.name.en,
          matchKey,
          kind: generated.kind,
          origin: "ai-generated",
          model: TAXONOMY_MODEL,
          areas: generated.areas as unknown as object,
        },
        update: { areas: generated.areas as unknown as object, kind: generated.kind },
      });
    } catch (e) {
      console.error("[taxonomy] cache write failed:", e);
    }
  }

  return generated;
}

/** Flat list of all subareas in a taxonomy (for pickers/mastery). */
export function allSubareas(tax: Taxonomy): TaxSubarea[] {
  return tax.areas.flatMap((a) => a.subareas);
}

export function findSubarea(tax: Taxonomy, subareaKey: string): TaxSubarea | undefined {
  return allSubareas(tax).find((s) => s.subareaKey === subareaKey);
}
