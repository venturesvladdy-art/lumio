import Anthropic from "@anthropic-ai/sdk";
import type { SkillDef } from "@/lib/types";

/**
 * AI-suggested practice areas for a skill (Stage B). Uses the fast Haiku model;
 * falls back to the skill's curated topics when the API key is missing or the
 * call fails, so the area picker always has options.
 */

const AREAS_MODEL =
  process.env.SKILLSPRINTER_AREAS_MODEL || "claude-haiku-4-5-20251001";

export interface SuggestedArea {
  id: string;
  name: string;
}

/** Stable, name-based id so coverage groups the same area across drills. */
export function slugArea(name: string): string {
  const s = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `area-${s || "x"}`;
}

export async function suggestAreas(skill: SkillDef): Promise<SuggestedArea[]> {
  const fallback = skill.topics.en.map((name) => ({ id: slugArea(name), name }));
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return fallback;

  try {
    const client = new Anthropic({ apiKey });
    const schema = {
      type: "object",
      additionalProperties: false,
      properties: { areas: { type: "array", items: { type: "string" } } },
      required: ["areas"],
    };
    const params = {
      model: AREAS_MODEL,
      max_tokens: 500,
      system:
        "You break a skill into the key practice areas a learner can drill. Return 5–8 concise area names (2–4 words each), ordered foundational → advanced. No numbering, no descriptions.",
      messages: [
        {
          role: "user",
          content: `Skill: ${skill.name.en}\n${skill.description.en}\n\nList its main practice areas.`,
        },
      ],
      output_config: { format: { type: "json_schema", schema } },
    };

    const message = await (client.messages.create as unknown as (
      p: typeof params
    ) => Promise<{ content: Array<{ type: string; text?: string }> }>)(params);

    const text = message.content
      .filter((b) => b.type === "text" && typeof b.text === "string")
      .map((b) => b.text as string)
      .join("");
    const parsed = JSON.parse(text) as { areas?: string[] };
    const names = Array.from(
      new Set((parsed.areas ?? []).map((s) => String(s).trim()).filter(Boolean))
    ).slice(0, 8);
    if (names.length < 2) return fallback;
    return names.map((name) => ({ id: slugArea(name), name }));
  } catch (e) {
    console.error("[areas] suggest failed:", e);
    return fallback;
  }
}
