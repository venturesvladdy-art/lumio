import { prisma } from "@/lib/db";
import type { Difficulty, QAFormat, QAItem } from "@/lib/types";

/**
 * Content Bank serving (Proposal §2.2 / Phase 2). Selects pre-built, approved
 * questions for a (skill, subarea, level) — concept-deduped, level-ramped — and
 * converts them to the in-app QAItem shape. Backs anonymous, unverified, Basic,
 * and the budget-exhausted state of paid tiers, all at ~$0 (a Postgres read).
 * Degrades to an empty result if the BankQuestion table doesn't exist yet.
 */

export interface BankRow {
  id: string;
  skillId: string;
  subareaKey: string;
  concept: string;
  difficulty: string;
  type: string;
  questionEn: string;
  questionPl: string;
  optionsEn: string[];
  optionsPl: string[];
  correctIndex: number;
  answerText: string | null;
  acceptedAnswers: string[];
  orderItems: string[];
  correctOrder: number[];
  explanationEn: string;
  explanationPl: string;
  theoryEn: string | null;
  theoryPl: string | null;
  xp: number;
}

const LEVEL_RANK: Record<string, number> = { beginner: 0, intermediate: 1, advanced: 2 };

/** Pick up to `n` approved bank questions, concept-deduped and level-ramped. */
export async function selectBankQuestions(
  skillId: string,
  opts: { subareaKey?: string; level?: Difficulty; n?: number; excludeConcepts?: string[] } = {}
): Promise<BankRow[]> {
  if (!prisma) return [];
  const n = opts.n ?? 10;
  try {
    const base = { skillId, qualityState: "approved" as const };
    let rows = (await prisma.bankQuestion.findMany({
      where: opts.subareaKey ? { ...base, subareaKey: opts.subareaKey } : base,
      take: 80,
    })) as unknown as BankRow[];
    // Fall back to skill-level selection if the subarea has nothing yet.
    if (rows.length === 0 && opts.subareaKey) {
      rows = (await prisma.bankQuestion.findMany({ where: base, take: 80 })) as unknown as BankRow[];
    }

    const exclude = new Set(opts.excludeConcepts ?? []);
    const seen = new Set<string>();
    const deduped = rows.filter((r) => {
      if (exclude.has(r.concept) || seen.has(r.concept)) return false;
      seen.add(r.concept);
      return true;
    });

    const lr = LEVEL_RANK[opts.level ?? "beginner"] ?? 0;
    deduped.sort(
      (a, b) =>
        Math.abs((LEVEL_RANK[a.difficulty] ?? 0) - lr) -
        Math.abs((LEVEL_RANK[b.difficulty] ?? 0) - lr)
    );
    return deduped.slice(0, n);
  } catch {
    return [];
  }
}

/** Convert bank rows to playable QAItems (+ a clientId→theory map to pre-cache). */
export function bankRowsToItems(
  rows: BankRow[],
  skillId: string,
  runId: string
): { items: QAItem[]; theoryByClientId: Record<string, string> } {
  const items: QAItem[] = [];
  const theoryByClientId: Record<string, string> = {};
  rows.forEach((r, i) => {
    const id = `bank-${skillId}-${runId}-${i}`;
    if (r.theoryEn) theoryByClientId[id] = r.theoryEn;
    items.push({
      id,
      skillId,
      subareaKey: r.subareaKey,
      concept: r.concept,
      difficulty: (r.difficulty as Difficulty) ?? "intermediate",
      format: (r.type as QAFormat) ?? "mcq",
      question: { en: r.questionEn, pl: r.questionPl || r.questionEn },
      options: { en: r.optionsEn, pl: r.optionsPl?.length ? r.optionsPl : r.optionsEn },
      correctIndex: r.correctIndex,
      answerText: r.answerText ?? undefined,
      acceptedAnswers: r.acceptedAnswers ?? [],
      orderItems: r.orderItems ?? [],
      correctOrder: r.correctOrder ?? [],
      explanation: { en: r.explanationEn, pl: r.explanationPl || r.explanationEn },
      xp: r.xp,
    });
  });
  return { items, theoryByClientId };
}
