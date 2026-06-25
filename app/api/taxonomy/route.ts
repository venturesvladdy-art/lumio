import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveSkill } from "@/lib/skills";
import { resolveTaxonomy } from "@/lib/taxonomy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Generation only on a cold catalogue (custom skills); curated/cached are instant.
export const maxDuration = 60;

const Schema = z.object({
  skillId: z.string().min(1),
  skillName: z.string().optional(),
});

/** The reusable area → subarea catalogue for a skill (curated / cached / AI). */
export async function POST(req: Request) {
  let body: z.infer<typeof Schema>;
  try {
    body = Schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const skill = resolveSkill(body.skillId, body.skillName);
  const taxonomy = await resolveTaxonomy(skill);
  return NextResponse.json({ taxonomy });
}
