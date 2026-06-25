import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { assembleDrill, planItemIds } from "@/lib/agent";
import type { Difficulty, QAFormat, QAItem } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Schema = z.object({
  skillId: z.string().min(1),
  subareaKey: z.string().min(1),
});

/**
 * Resume check: if the learner already has a saved drill for this subarea that
 * they haven't fully answered, return it reconstructed (plan + items + the ids
 * they've already completed/got right) so the session can drop them at the next
 * unanswered question. Returns `{ drill: null }` when there's nothing to resume
 * (no drill yet, or the latest one is fully answered) — the caller then builds a
 * fresh plan.
 */
export async function POST(req: Request) {
  if (!prisma) return NextResponse.json({ drill: null });

  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ drill: null });

  let body: z.infer<typeof Schema>;
  try {
    body = Schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Newest drill for this subarea wins (drills are immutable; latest is current).
  let curriculum;
  try {
    curriculum = await prisma.curriculum.findFirst({
      where: {
        userId,
        skillId: body.skillId,
        OR: [{ subareaKey: body.subareaKey }, { areaId: body.subareaKey }],
      },
      orderBy: { createdAt: "desc" },
      include: { questions: { orderBy: { orderIndex: "asc" } } },
    });
  } catch {
    // Un-migrated DB without the subareaKey column: match on areaId only.
    curriculum = await prisma.curriculum.findFirst({
      where: { userId, skillId: body.skillId, areaId: body.subareaKey },
      orderBy: { createdAt: "desc" },
      include: { questions: { orderBy: { orderIndex: "asc" } } },
    });
  }

  if (!curriculum || curriculum.questions.length === 0) {
    return NextResponse.json({ drill: null });
  }

  const items: QAItem[] = curriculum.questions.map((q) => ({
    id: q.clientId,
    skillId: q.skillId,
    subareaKey: q.subareaKey ?? undefined,
    concept: q.concept ?? undefined,
    difficulty: q.difficulty as Difficulty,
    format: (q.type as QAFormat) ?? "mcq",
    question: { en: q.questionEn, pl: q.questionPl },
    options: { en: q.optionsEn, pl: q.optionsPl },
    correctIndex: q.correctIndex,
    answerText: q.answerText ?? undefined,
    acceptedAnswers: q.acceptedAnswers ?? [],
    orderItems: q.orderItems ?? [],
    correctOrder: q.correctOrder ?? [],
    rubric: q.rubric ?? undefined,
    briefClientId: q.briefClientId ?? undefined,
    explanation: { en: q.explanationEn, pl: q.explanationPl },
    xp: q.xp,
  }));

  const plan = assembleDrill({
    skillId: curriculum.skillId,
    level: curriculum.level as Difficulty,
    focusValues: curriculum.focus,
    summary: { en: curriculum.summaryEn, pl: curriculum.summaryPl },
    items,
    areaId: curriculum.areaId ?? body.subareaKey,
    areaName: curriculum.areaName ?? "this subarea",
    createdAt: curriculum.createdAt.getTime(),
  });

  // Which of this drill's questions have already been answered (and got right)?
  const attempts = await prisma.attempt.findMany({
    where: { userId, curriculumId: curriculum.id },
    select: { questionClientId: true, correct: true, xpGained: true },
  });
  const completed = new Set<string>();
  const correct = new Set<string>();
  let xp = 0;
  for (const a of attempts) {
    completed.add(a.questionClientId);
    if (a.correct) correct.add(a.questionClientId);
    xp += a.xpGained;
  }

  const playable = planItemIds(plan);
  const incomplete = playable.some((qid) => !completed.has(qid));
  if (!incomplete) {
    // Nothing left to answer here — let the caller build a fresh drill.
    return NextResponse.json({ drill: null });
  }

  return NextResponse.json({
    drill: {
      plan,
      items,
      completedItemIds: Array.from(completed),
      correctItemIds: Array.from(correct),
      xp,
    },
  });
}
