import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveSkill } from "@/lib/skills";
import { buildPlanForUser } from "@/lib/planGen";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import type { OnboardingAnswers, PlanTier } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Drill generation can take a while; request the max the plan allows. (Vercel
// caps this at the account's limit — 60s on Hobby, up to 300s on Pro.)
export const maxDuration = 300;

const BodySchema = z.object({
  skillId: z.string().min(1),
  skillName: z.string().optional(),
  topicsEn: z.array(z.string()).optional(),
  topicsPl: z.array(z.string()).optional(),
  answers: z.record(z.string(), z.array(z.string())),
  // Stage B: drill a single area (20 focused questions) when provided.
  areaId: z.string().optional(),
  areaName: z.string().optional(),
  // Stage B: a follow-up drill on the same area (re-drill misses + new).
  continue: z.boolean().optional(),
});

export async function POST(req: Request) {
  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const skill = resolveSkill(body.skillId, body.skillName);
  let answers = body.answers as OnboardingAnswers;

  // Resolve the signed-in user + their authoritative tier (drives model choice).
  let userId: string | undefined;
  let tier: PlanTier = "basic";
  if (prisma) {
    const session = await auth();
    userId = (session?.user as { id?: string } | undefined)?.id;
    if (userId) {
      const u = await prisma.user.findUnique({
        where: { id: userId },
        select: { tier: true },
      });
      if (u?.tier) tier = u.tier as PlanTier;
    }
  }

  const area =
    body.areaId && body.areaName
      ? { id: body.areaId, name: body.areaName }
      : undefined;

  // Continuation: reuse the stored answers and target the questions the
  // learner previously got wrong, so the next drill revisits weak spots.
  let weakness: string[] | undefined;
  if (body.continue && area && userId && prisma) {
    const prev = await prisma.curriculum.findFirst({
      where: { userId, skillId: skill.id, areaId: area.id },
      orderBy: { createdAt: "desc" },
      select: { answers: true },
    });
    if (prev?.answers) answers = prev.answers as OnboardingAnswers;

    const wrong = await prisma.attempt.findMany({
      where: { userId, skillId: skill.id, areaId: area.id, correct: false },
      select: { questionClientId: true },
    });
    const wrongIds = Array.from(new Set(wrong.map((w) => w.questionClientId)));
    if (wrongIds.length) {
      const qs = await prisma.question.findMany({
        where: {
          clientId: { in: wrongIds },
          curriculum: { userId, skillId: skill.id, areaId: area.id },
        },
        select: { questionEn: true },
      });
      weakness = Array.from(new Set(qs.map((q) => q.questionEn))).slice(0, 12);
    }
  }

  const built = await buildPlanForUser({ userId, tier, skill, answers, area, weakness });
  const { plan, items, briefs, source, curriculumId } = built;
  return NextResponse.json({ plan, items, briefs, source, curriculumId });
}
