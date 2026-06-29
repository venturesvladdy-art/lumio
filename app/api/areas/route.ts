import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { resolveSkill } from "@/lib/skills";
import { suggestAreas } from "@/lib/areas";
import { rateLimit } from "@/lib/ratelimit";

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
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  // Burst cap (cost-amplification guard) — generous for real onboarding.
  if (!rateLimit(`areas:${userId}`, 20, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: z.infer<typeof Schema>;
  try {
    body = Schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const skill = resolveSkill(body.skillId, body.skillName);

  // A custom (non-predefined) skill triggers live AI; require a confirmed email
  // for that path so it can't be used as a cost-amplification vector. Predefined
  // skills use curated areas (no AI) and stay open for fast onboarding.
  const verified = Boolean(
    (session?.user as { emailVerified?: boolean } | undefined)?.emailVerified
  );
  if (!skill.predefined && !verified) {
    return NextResponse.json(
      { error: "verify-required", message: "Confirm your email to use custom skills." },
      { status: 403 }
    );
  }

  const areas = await suggestAreas(skill);
  return NextResponse.json({ areas });
}
