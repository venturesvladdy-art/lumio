import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveSkill } from "@/lib/skills";
import { suggestAreas } from "@/lib/areas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const Schema = z.object({
  skillId: z.string().min(1),
  skillName: z.string().optional(),
});

/** AI-suggested practice areas for a skill (with curated-topic fallback). */
export async function POST(req: Request) {
  let body: z.infer<typeof Schema>;
  try {
    body = Schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const skill = resolveSkill(body.skillId, body.skillName);
  const areas = await suggestAreas(skill);
  return NextResponse.json({ areas });
}
