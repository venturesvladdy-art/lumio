import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const Schema = z.object({
  skillId: z.string().min(1),
  questionClientId: z.string().min(1),
  selectedIndex: z.number().int(),
  correct: z.boolean(),
  xpGained: z.number().int().min(0),
});

export async function POST(req: Request) {
  if (!prisma) return NextResponse.json({ ok: false }, { status: 503 });

  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 });

  let body: z.infer<typeof Schema>;
  try {
    body = Schema.parse(await req.json());
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    // Link the attempt to the learner's most recent curriculum for this skill.
    const latest = await prisma.curriculum.findFirst({
      where: { userId, skillId: body.skillId },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });

    await prisma.attempt.create({
      data: {
        userId,
        curriculumId: latest?.id ?? null,
        skillId: body.skillId,
        questionClientId: body.questionClientId,
        selectedIndex: body.selectedIndex,
        correct: body.correct,
        xpGained: body.xpGained,
      },
    });
  } catch (e) {
    console.error("[attempt] log failed:", e);
  }

  return NextResponse.json({ ok: true });
}
