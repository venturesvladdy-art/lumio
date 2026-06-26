// Generates skillsprinter-bank-full.sql from the generated Content Bank
// (lib/bank/raw/*.json) — 240 questions across 10 skills. Run AFTER the schema
// migration; idempotent (clears its own 'curated-bank' rows, then re-inserts).
// Run: `node scripts/gen-bank-full-seed.mjs`.
import fs from "fs";

const IDS = [
  "exam", "spanish", "python", "finance", "data",
  "interpersonal", "speaking", "ai", "engineering", "chess",
];
const XP = { beginner: 10, intermediate: 15, advanced: 25 };

const esc = (s) => String(s ?? "").replace(/'/g, "''");
const tarr = (a) => "ARRAY[" + (a ?? []).map((x) => `'${esc(x)}'`).join(",") + "]::text[]";

const out = [
  "-- Generated Content Bank seed (240 questions). Proposal Phase 2.",
  "-- Run AFTER skillsprinter-phases-2-3-4-6.sql. Idempotent (re-runnable).",
  `DELETE FROM "BankQuestion" WHERE model = 'curated-bank';`,
  "",
];

let count = 0;
for (const id of IDS) {
  const data = JSON.parse(fs.readFileSync(`lib/bank/raw/${id}.json`, "utf8"));
  for (const q of data.questions) {
    let options = q.options ?? [];
    let correctIndex = Number(q.correctIndex);
    // Normalize truefalse to the canonical ["True","False"] order.
    if (q.format === "truefalse") {
      const correctValue = options[correctIndex];
      options = ["True", "False"];
      correctIndex = correctValue === "True" ? 0 : 1;
    }
    const subareaKey = `${id}:${q.areaKey}`;
    const xp = XP[q.difficulty] ?? 10;
    out.push(
      `INSERT INTO "BankQuestion" ("id","skillId","subareaKey","concept","difficulty","type",` +
        `"questionEn","questionPl","optionsEn","optionsPl","correctIndex",` +
        `"acceptedAnswers","orderItems","correctOrder","explanationEn","explanationPl",` +
        `"theoryEn","theoryPl","xp","qualityState","model") VALUES (` +
        `'bankq-${esc(q.id)}','${id}','${esc(subareaKey)}','${esc(q.id)}','${q.difficulty}','${q.format}',` +
        `'${esc(q.question)}','${esc(q.question)}',${tarr(options)},${tarr(options)},${correctIndex},` +
        `ARRAY[]::text[],ARRAY[]::text[],ARRAY[]::int[],` +
        `'${esc(q.explanation)}','${esc(q.explanation)}','${esc(q.theory)}','${esc(q.theory)}',` +
        `${xp},'approved','curated-bank');`
    );
    count += 1;
  }
}

fs.writeFileSync("skillsprinter-bank-full.sql", out.join("\n") + "\n");
console.log(`wrote skillsprinter-bank-full.sql (${count} questions)`);
