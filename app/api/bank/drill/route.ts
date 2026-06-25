import { NextResponse } from "next/server";
import { selectBankQuestions } from "@/lib/bank";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import type { Difficulty } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Anonymous-allowed bank drill (Proposal §2.2). Serves pre-built, approved
 * questions for a (skill, subarea, level) with NO live AI and NO auth — just a
 * Postgres read. IP-rate-limited to stop scraping of the bank.
 */
export async function GET(req: Request) {
  const ip = clientIp(req);
  if (!rateLimit(`bank:${ip}`, 60, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const url = new URL(req.url);
  const skillId = url.searchParams.get("skillId");
  if (!skillId) {
    return NextResponse.json({ error: "skillId required" }, { status: 400 });
  }
  const subareaKey = url.searchParams.get("areaId") ?? undefined;
  const levelRaw = url.searchParams.get("level");
  const level =
    levelRaw === "beginner" || levelRaw === "intermediate" || levelRaw === "advanced"
      ? (levelRaw as Difficulty)
      : "beginner";
  const n = Math.min(20, Math.max(1, Number(url.searchParams.get("n")) || 5));

  const rows = await selectBankQuestions(skillId, { subareaKey, level, n });

  // Public, playable shape (this is a free "taste", so the answer + theory ship).
  const questions = rows.map((r) => ({
    id: r.id,
    areaKey: r.subareaKey,
    difficulty: r.difficulty,
    format: r.type,
    question: r.questionEn,
    options: r.optionsEn,
    correctIndex: r.correctIndex,
    explanation: r.explanationEn,
    theory: r.theoryEn ?? "",
  }));

  return NextResponse.json({ skillId, count: questions.length, questions });
}
