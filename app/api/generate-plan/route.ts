import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveSkill } from "@/lib/skills";
import { buildPlanForUser, type GenContext } from "@/lib/planGen";
import { resolveTaxonomy, findSubarea } from "@/lib/taxonomy";
import { deriveProfile } from "@/lib/survey/profile";
import { activeTarget } from "@/lib/mastery";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import type { Difficulty, OnboardingAnswers, PlanTier } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const BodySchema = z.object({
  skillId: z.string().min(1),
  skillName: z.string().optional(),
  answers: z.record(z.string(), z.array(z.string())),
  // The catalogued subarea to drill (passed via the area params).
  areaId: z.string().optional(),
  areaName: z.string().optional(),
  continue: z.boolean().optional(),
  // Dashboard-chosen starting level for the subarea (never "expert").
  levelOverride: z.enum(["beginner", "intermediate", "advanced", "expert"]).optional(),
});

/** A drill's difficulty maxes out at "advanced" — Expert is earned, not generated. */
function clampLevel(l: string | undefined): Difficulty | undefined {
  if (l === "beginner" || l === "intermediate" || l === "advanced") return l;
  if (l === "expert") return "advanced";
  return undefined;
}

export async function POST(req: Request) {
  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const skill = resolveSkill(body.skillId, body.skillName);
  let answers = body.answers as OnboardingAnswers;

  let userId: string | undefined;
  let tier: PlanTier = "basic";
  if (prisma) {
    const session = await auth();
    userId = (session?.user as { id?: string } | undefined)?.id;
    if (userId) {
      const u = await prisma.user.findUnique({ where: { id: userId }, select: { tier: true } });
      if (u?.tier) tier = u.tier as PlanTier;
    }
  }

  // Require auth in DB mode — unauthenticated plan generation triggers live AI
  // (Opus/Sonnet) and is a cost-amplification vector. (Guests use static banks.)
  if (prisma && !userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Server-side limit: the Basic (free) tier may only have ONE skill. Block a
  // second, distinct skill here as the authority (the UI also gates this).
  if (tier === "basic" && userId && prisma) {
    const otherSkill = await prisma.curriculum.findFirst({
      where: { userId, skillId: { not: skill.id } },
      select: { skillId: true },
    });
    if (otherSkill) {
      return NextResponse.json(
        {
          error: "skill-limit",
          reason: "skill-limit",
          message: "The Basic plan includes one skill. Upgrade to add more.",
        },
        { status: 403 }
      );
    }
  }

  const subareaKey = body.areaId;
  const area = subareaKey && body.areaName ? { id: subareaKey, name: body.areaName } : undefined;
  const levelOverride = clampLevel(body.levelOverride);

  const ctx: GenContext = {};
  if (area) {
    // Subarea blurb + full concept target from the catalogue.
    try {
      const tax = await resolveTaxonomy(skill);
      const sub = findSubarea(tax, area.id);
      if (sub) {
        (area as { blurb?: string }).blurb = sub.blurb;
        ctx.subareaTargetFull = sub.conceptTarget;
      }
    } catch {
      /* fall through with defaults */
    }

    if (userId && prisma) {
      // Continuation reuses stored answers + targets the missed concepts.
      if (body.continue) {
        const prev = await prisma.curriculum.findFirst({
          where: { userId, skillId: skill.id, OR: [{ subareaKey: area.id }, { areaId: area.id }] },
          orderBy: { createdAt: "desc" },
          select: { answers: true },
        });
        if (prev?.answers) answers = prev.answers as OnboardingAnswers;

        const wrong = await prisma.attempt.findMany({
          where: { userId, skillId: skill.id, subareaKey: area.id, correct: false },
          select: { questionClientId: true },
        });
        const wrongIds = Array.from(new Set(wrong.map((w) => w.questionClientId)));
        if (wrongIds.length) {
          const qs = await prisma.question.findMany({
            where: { clientId: { in: wrongIds }, curriculum: { userId, skillId: skill.id } },
            select: { questionEn: true },
          });
          ctx.weakness = Array.from(new Set(qs.map((q) => q.questionEn))).slice(0, 10);
        }
      }

      // Concepts the learner has already mastered in this subarea — don't repeat.
      try {
        const mastered = await prisma.attempt.findMany({
          where: { userId, skillId: skill.id, subareaKey: area.id, correct: true, concept: { not: null } },
          select: { concept: true },
          distinct: ["concept"],
        });
        ctx.coveredConcepts = mastered.map((m) => m.concept).filter((c): c is string => !!c);
      } catch {
        /* concept column may be absent on an un-migrated DB */
      }
    }

    // Concept target reflects the FINAL answers + the dashboard-chosen level.
    const effLevel = levelOverride ?? deriveProfile(answers).level;
    ctx.masteryTarget = activeTarget(ctx.subareaTargetFull ?? 200, effLevel);
  }

  const built = await buildPlanForUser({ userId, tier, skill, answers, area, ctx, levelOverride });
  const { plan, items, source, curriculumId } = built;
  return NextResponse.json({ plan, items, briefs: [], source, curriculumId });
}
