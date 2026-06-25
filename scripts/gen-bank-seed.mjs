// Generates skillsprinter-bank-seed.sql from the static taste banks
// (lib/taste/raw/*.json) so the BankQuestion table is non-empty immediately,
// at $0 — no offline AI build required. Run: `node scripts/gen-bank-seed.mjs`.
import fs from "fs";

const IDS = [
  "exam", "spanish", "python", "finance", "data",
  "interpersonal", "speaking", "ai", "engineering", "chess",
];
const XP = { beginner: 10, intermediate: 15, advanced: 25 };

const esc = (s) => String(s ?? "").replace(/'/g, "''");
const tarr = (a) => "ARRAY[" + (a ?? []).map((x) => `'${esc(x)}'`).join(",") + "]::text[]";

const out = [
  "-- Seed BankQuestion from the static taste banks (Proposal Phase 2).",
  "-- Run AFTER skillsprinter-phases-2-3-4-6.sql. Idempotent (re-runnable).",
  `DELETE FROM "BankQuestion" WHERE model = 'curated-taste';`,
  "",
];

let count = 0;
for (const id of IDS) {
  const data = JSON.parse(fs.readFileSync(`lib/taste/raw/${id}.json`, "utf8"));
  for (const q of data.questions) {
    const subareaKey = `${id}:${q.areaKey}`;
    const xp = XP[q.difficulty] ?? 10;
    const opts = q.options ?? [];
    out.push(
      `INSERT INTO "BankQuestion" ("id","skillId","subareaKey","concept","difficulty","type",` +
        `"questionEn","questionPl","optionsEn","optionsPl","correctIndex",` +
        `"acceptedAnswers","orderItems","correctOrder","explanationEn","explanationPl",` +
        `"theoryEn","theoryPl","xp","qualityState","model") VALUES (` +
        `'bank-${esc(q.id)}','${id}','${esc(subareaKey)}','${esc(q.id)}','${q.difficulty}','${q.format}',` +
        `'${esc(q.question)}','${esc(q.question)}',${tarr(opts)},${tarr(opts)},${Number(q.correctIndex)},` +
        `ARRAY[]::text[],ARRAY[]::text[],ARRAY[]::int[],` +
        `'${esc(q.explanation)}','${esc(q.explanation)}','${esc(q.theory)}','${esc(q.theory)}',` +
        `${xp},'approved','curated-taste');`
    );
    count += 1;
  }
}

fs.writeFileSync("skillsprinter-bank-seed.sql", out.join("\n") + "\n");
console.log(`wrote skillsprinter-bank-seed.sql (${count} questions)`);
