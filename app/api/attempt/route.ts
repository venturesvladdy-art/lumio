import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  getEntitlement,
  dailyAttemptCount,
  dailyLimitFor,
  gradeAnswer,
} from "@/lib/entitlement";

export const runtime = "nodejs";

const Schema = z.object({
  skillId: z.string().min(1),
  questionClientId: z.string().min(1),
  type: z.enum(["mcq", "truefalse", "numeric", "input", "order", "free"]).default("mcq"),
  subareaKey: z.string().optional(),
  concept: z.string().optional(),
  selectedIndex: z.number().int().optional(),
  responseText: z.string().max(1000).optional(),
  score: z.number().int().min(0).max(5).optional(),
  // Accepted for backward-compat but IGNORED — the server is authoritative.
  correct: z.boolean(),
  xpGained: z.number().int().min(0),
});

export async function POST(req: Request) {
  if (!prisma) return NextResponse.json({ ok: false }, { status: 503 });

  const ent = await getEntitlement();
  if (!ent) return NextResponse.json({ ok: false }, { status: 401 });

  let body: z.infer<typeof Schema>;
  try {
    body = Schema.parse(await req.json());
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // Server-enforced daily cap (every finite tier — Basic 5, Smart 20; Guru ∞).
  const limit = dailyLimitFor(ent.tier);
  if (Number.isFinite(limit)) {
    const used = await dailyAttemptCount(ent.userId);
    if (used >= limit) {
      return NextResponse.json({ ok: false, limit: "daily" }, { status: 200 });
    }
  }

  try {
    // Look up the answer key + curriculum linkage for THIS user's question.
    const q = await prisma.question.findFirst({
      where: {
        clientId: body.questionClientId,
        curriculum: { userId: ent.userId, skillId: body.skillId },
      },
      orderBy: { createdAt: "desc" },
      select: {
        type: true,
        correctIndex: true,
        answerText: true,
        acceptedAnswers: true,
        correctOrder: true,
        xp: true,
        concept: true,
        subareaKey: true,
        curriculum: { select: { id: true, areaId: true, subareaKey: true } },
      },
    });

    // Authoritative grade — client `correct`/`xpGained` are ignored.
    const serverCorrect = q
      ? gradeAnswer(
          {
            type: q.type,
            correctIndex: q.correctIndex,
            answerText: q.answerText,
            acceptedAnswers: q.acceptedAnswers ?? [],
            correctOrder: q.correctOrder ?? [],
          },
          body
        )
      : false;

    // XP only for a first-time, genuinely-correct answer (no farming by replay).
    const prior = await prisma.attempt.findFirst({
      where: { userId: ent.userId, questionClientId: body.questionClientId },
      select: { id: true },
    });
    const xpGained = q && serverCorrect && !prior ? q.xp : 0;

    // Curriculum linkage: prefer the answered question's, else the latest drill.
    let curriculumId = q?.curriculum?.id ?? null;
    let areaId = q?.curriculum?.areaId ?? null;
    let subareaKey = body.subareaKey ?? q?.subareaKey ?? q?.curriculum?.subareaKey ?? null;
    if (!curriculumId) {
      const latest = await prisma.curriculum.findFirst({
        where: { userId: ent.userId, skillId: body.skillId },
        orderBy: { createdAt: "desc" },
        select: { id: true, areaId: true, subareaKey: true },
      });
      curriculumId = latest?.id ?? null;
      areaId = areaId ?? latest?.areaId ?? null;
      subareaKey = subareaKey ?? latest?.subareaKey ?? latest?.areaId ?? null;
    }

    await prisma.attempt.create({
      data: {
        userId: ent.userId,
        curriculumId,
        skillId: body.skillId,
        areaId,
        subareaKey,
        concept: q?.concept ?? body.concept ?? null,
        questionClientId: body.questionClientId,
        type: q?.type ?? body.type,
        selectedIndex: body.selectedIndex ?? null,
        responseText: body.responseText ?? null,
        score: body.score ?? null,
        correct: serverCorrect,
        xpGained,
      },
    });

    // Return the authoritative values so the client can reconcile its optimistic UI.
    return NextResponse.json({ ok: true, correct: serverCorrect, xpGained });
  } catch (e) {
    console.error("[attempt] log failed:", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
