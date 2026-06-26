// Emits bank-sql/part1..4.sql — the COMPLETE Content Bank (taste + generated)
// split into chunks each well under Neon's ~219k query-history limit. Each file
// is idempotent for its skills. Run: `node scripts/gen-bank-split.mjs`.
import fs from "fs";

const GROUPS = [
  ["exam", "spanish", "python"],
  ["finance", "data", "interpersonal"],
  ["speaking", "ai", "engineering"],
  ["chess"],
];
const XP = { beginner: 10, intermediate: 15, advanced: 25 };
const esc = (s) => String(s ?? "").replace(/'/g, "''");
const tarr = (a) => "ARRAY[" + (a ?? []).map((x) => `'${esc(x)}'`).join(",") + "]::text[]";

function insert(id, skillId, q, model) {
  let options = q.options ?? [];
  let correctIndex = Number(q.correctIndex);
  if (q.format === "truefalse") {
    const v = options[correctIndex];
    options = ["True", "False"];
    correctIndex = v === "True" ? 0 : 1;
  }
  const xp = XP[q.difficulty] ?? 10;
  return (
    `INSERT INTO "BankQuestion" ("id","skillId","subareaKey","concept","difficulty","type",` +
    `"questionEn","questionPl","optionsEn","optionsPl","correctIndex",` +
    `"acceptedAnswers","orderItems","correctOrder","explanationEn","explanationPl",` +
    `"theoryEn","theoryPl","xp","qualityState","model") VALUES (` +
    `'${id}','${skillId}','${esc(skillId)}:${esc(q.areaKey)}','${esc(q.id)}','${q.difficulty}','${q.format}',` +
    `'${esc(q.question)}','${esc(q.question)}',${tarr(options)},${tarr(options)},${correctIndex},` +
    `ARRAY[]::text[],ARRAY[]::text[],ARRAY[]::int[],` +
    `'${esc(q.explanation)}','${esc(q.explanation)}','${esc(q.theory)}','${esc(q.theory)}',` +
    `${xp},'approved','${model}');`
  );
}

fs.mkdirSync("bank-sql", { recursive: true });
let grand = 0;
GROUPS.forEach((skills, gi) => {
  const out = [
    `-- Content Bank seed part ${gi + 1}/${GROUPS.length}: ${skills.join(", ")}.`,
    "-- Run AFTER skillsprinter-phases-2-3-4-6.sql. Idempotent (re-runnable).",
    `DELETE FROM "BankQuestion" WHERE "skillId" IN (${skills.map((s) => `'${s}'`).join(",")})` +
      ` AND "model" IN ('curated-taste','curated-bank');`,
    "",
  ];
  let n = 0;
  for (const skill of skills) {
    const taste = JSON.parse(fs.readFileSync(`lib/taste/raw/${skill}.json`, "utf8"));
    for (const q of taste.questions) {
      out.push(insert(`bank-${esc(q.id)}`, skill, q, "curated-taste"));
      n += 1;
    }
    const full = JSON.parse(fs.readFileSync(`lib/bank/raw/${skill}.json`, "utf8"));
    for (const q of full.questions) {
      out.push(insert(`bankq-${esc(q.id)}`, skill, q, "curated-bank"));
      n += 1;
    }
  }
  const file = `bank-sql/part${gi + 1}.sql`;
  fs.writeFileSync(file, out.join("\n") + "\n");
  const bytes = fs.statSync(file).size;
  console.log(`${file}: ${n} questions, ${Math.round(bytes / 1024)}KB`);
  grand += n;
});
console.log(`Total: ${grand} questions across ${GROUPS.length} files.`);
