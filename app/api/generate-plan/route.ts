import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveSkill } from "@/lib/skills";
import { buildPlanForUser } from "@/lib/planGen";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import type { OnboardingAnswers, PlanTier } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Opus generation can take a while; give the function room on Vercel.
export const maxDuration = 60;

const BodySchema = z.object({
  skillId: z.string().min(1),
  skillName: z.string().optional(),
  topicsEn: z.array(z.string()).optional(),
  topicsPl: z.array(z.string()).optional(),
  answers: z.record(z.string(), z.array(z.string())),
  // Stage B: drill a single area (20 focused questions) when provided.
  areaId: z.string().optional(),
  areaName: z.string().optional(),
});

export async function POST(req: Request) {
  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const skill = resolveSkill(body.skillId, body.skillName);
  const answers = body.answers as OnboardingAnswers;

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

  const built = await buildPlanForUser({ userId, tier, skill, answers, area });
  const { plan, items, source, curriculumId } = built;
  return NextResponse.json({ plan, items, source, curriculumId });
}
