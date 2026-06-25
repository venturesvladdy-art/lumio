import type { Difficulty } from "@/lib/types";

import exam from "./raw/exam.json";
import spanish from "./raw/spanish.json";
import python from "./raw/python.json";
import finance from "./raw/finance.json";
import data from "./raw/data.json";
import interpersonal from "./raw/interpersonal.json";
import speaking from "./raw/speaking.json";
import ai from "./raw/ai.json";
import engineering from "./raw/engineering.json";
import chess from "./raw/chess.json";

/**
 * Static, hand-built "taste" question banks — one per pre-selected skill. These
 * power the logged-out guest experience (/try) so a visitor can sample the
 * product with ZERO AI usage and ZERO database writes. Each question ships with
 * a pre-stored `theory` blurb the guest can reveal on demand.
 */

export type TasteFormat = "mcq" | "truefalse";

export interface TasteArea {
  key: string;
  name: string;
}

export interface TasteQuestion {
  id: string;
  areaKey: string;
  difficulty: Difficulty;
  format: TasteFormat;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  /** Pre-stored background the guest can reveal — never AI-generated at runtime. */
  theory: string;
}

export interface TasteBank {
  skillId: string;
  areas: TasteArea[];
  questions: TasteQuestion[];
}

// JSON imports widen string-literal unions to `string`; assert the authored shape.
const RAW = [
  exam,
  spanish,
  python,
  finance,
  data,
  interpersonal,
  speaking,
  ai,
  engineering,
  chess,
] as unknown as TasteBank[];

export const TASTE_BANKS: Record<string, TasteBank> = Object.fromEntries(
  RAW.map((b) => [b.skillId, b])
);

/** Skill ids that have a guest taste bank (drives which skills offer "Try free"). */
export const TASTE_SKILL_IDS: string[] = RAW.map((b) => b.skillId);

export function getTasteBank(skillId: string): TasteBank | undefined {
  return TASTE_BANKS[skillId];
}

export function hasTasteBank(skillId: string): boolean {
  return skillId in TASTE_BANKS;
}

const LEVEL_RANK: Record<Difficulty, number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
};

/**
 * Deterministically pick `count` taste questions for the guest survey: the
 * chosen area comes first, then the nearest-level questions from other areas
 * fill the rest. Authored order breaks ties, so it's stable across renders.
 */
export function selectTasteQuestions(
  bank: TasteBank,
  opts: { areaKey?: string; level?: Difficulty; count?: number } = {}
): TasteQuestion[] {
  const count = opts.count ?? 5;
  const lr = LEVEL_RANK[opts.level ?? "beginner"];
  const scored = bank.questions.map((q, i) => ({
    q,
    score:
      (opts.areaKey && q.areaKey === opts.areaKey ? 0 : 10) +
      Math.abs(LEVEL_RANK[q.difficulty] - lr) +
      i * 0.001,
  }));
  scored.sort((a, b) => a.score - b.score);
  return scored.slice(0, count).map((s) => s.q);
}
