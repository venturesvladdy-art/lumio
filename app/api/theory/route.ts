import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { generateTheory } from "@/lib/theory";

export const runtime = "nodejs";
export const maxDuration = 30;

const Schema = z.object({
  skillId: z.string().min(1),
  questionClientId: z.string().min(1),
  escalate: z.boolean().optional(),
});

/** On-demand 2-paragraph background/theory for a question (cached on the row). */
export async function POST(req: Request) {
  if (!prisma) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: z.infer<typeof Schema>;
  try {
    body = Schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Load the learner's question server-side (answer never leaves the server raw).
  const q = await prisma.question.findFirst({
    where: { clientId: body.questionClientId, curriculum: { userId, skillId: body.skillId } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      type: true,
      difficulty: true,
      questionEn: true,
      optionsEn: true,
      correctIndex: true,
      answerText: true,
      subareaKey: true,
      explanationEn: true,
      theory: true,
      theoryIncludesAnswer: true,
    },
  });
  if (!q) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  // Cache hit (generated once per question, re-read on re-tap).
  if (q.theory && !body.escalate) {
    return NextResponse.json({
      theory: q.theory,
      includesAnswer: q.theoryIncludesAnswer ?? true,
      cached: true,
      model: null,
    });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const gen = apiKey
    ? await generateTheory(
        apiKey,
        {
          skillName: body.skillId,
          subareaName: q.subareaKey ?? undefined,
          difficulty: q.difficulty,
          type: q.type,
          questionEn: q.questionEn,
          options: q.optionsEn,
          correctIndex: q.correctIndex,
          answerText: q.answerText,
        },
        body.escalate
      )
    : null;

  if (!gen) {
    // Degraded fallback so the learner is never stuck.
    return NextResponse.json({
      theory: q.explanationEn || "Theory isn't available for this question right now.",
      includesAnswer: true,
      cached: false,
      model: null,
    });
  }

  // Cache on the question row (best-effort).
  await prisma.question
    .update({
      where: { id: q.id },
      data: { theory: gen.theory, theoryIncludesAnswer: gen.includesAnswer },
    })
    .catch(() => {});

  return NextResponse.json({
    theory: gen.theory,
    includesAnswer: gen.includesAnswer,
    cached: false,
    model: gen.model,
  });
}
