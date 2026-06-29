import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { resolveSkill } from "@/lib/skills";
import { resolveTaxonomy } from "@/lib/taxonomy";
import { rateLimit } from "@/lib/ratelimit";

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
  // Require auth: a cold/custom skill triggers live Opus generation, so leaving
  // this open is an unauthenticated AI cost-amplification vector. (Guests use
  // the static taste banks, which never hit this route.)
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  // Burst cap (cost-amplification guard) — generous for real onboarding.
  if (!rateLimit(`taxonomy:${userId}`, 20, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: z.infer<typeof Schema>;
  try {
    body = Schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const skill = resolveSkill(body.skillId, body.skillName);

  // A custom (non-predefined) skill triggers live Opus generation; require a
  // confirmed email for that path. Predefined skills are curated/cached (no AI)
  // and stay open for fast onboarding.
  const verified = Boolean(
    (session?.user as { emailVerified?: boolean } | undefined)?.emailVerified
  );
  if (!skill.predefined && !verified) {
    return NextResponse.json(
      { error: "verify-required", message: "Confirm your email to use custom skills." },
      { status: 403 }
    );
  }

  const taxonomy = await resolveTaxonomy(skill);
  return NextResponse.json({ taxonomy });
}
