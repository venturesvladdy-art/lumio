import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
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
  // Require auth: suggestAreas can trigger live AI generation, so leaving this
  // open is an unauthenticated AI cost-amplification vector.
  const session = await auth();
  if (!(session?.user as { id?: string } | undefined)?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

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
