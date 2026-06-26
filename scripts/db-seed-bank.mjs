// Seed the 240 generated Content Bank questions into Neon via the HTTP driver
// (port 443). Idempotent: clears its own 'curated-bank' rows, then inserts.
import { neon } from "@neondatabase/serverless";
import fs from "fs";

const sql = neon(process.env.DATABASE_URL);
const IDS = ["exam", "spanish", "python", "finance", "data", "interpersonal", "speaking", "ai", "engineering", "chess"];
const XP = { beginner: 10, intermediate: 15, advanced: 25 };

function row(id, skill, q, model) {
  let options = q.options ?? [];
  let ci = Number(q.correctIndex);
  if (q.format === "truefalse") {
    const v = options[ci];
    options = ["True", "False"];
    ci = v === "True" ? 0 : 1;
  }
  return [
    id, skill, `${skill}:${q.areaKey}`, q.id, q.difficulty, q.format,
    q.question, q.question, options, options, ci,
    [], [], [], q.explanation, q.explanation, q.theory, q.theory,
    XP[q.difficulty] ?? 10, "approved", model,
  ];
}

const INSERT =
  `INSERT INTO "BankQuestion" ("id","skillId","subareaKey","concept","difficulty","type",` +
  `"questionEn","questionPl","optionsEn","optionsPl","correctIndex","acceptedAnswers",` +
  `"orderItems","correctOrder","explanationEn","explanationPl","theoryEn","theoryPl",` +
  `"xp","qualityState","model") VALUES ` +
  `($1,$2,$3,$4,$5,$6,$7,$8,$9::text[],$10::text[],$11,$12::text[],$13::text[],$14::int[],$15,$16,$17,$18,$19,$20,$21)`;

const rows = [];
for (const skill of IDS) {
  const bank = JSON.parse(fs.readFileSync(`lib/bank/raw/${skill}.json`, "utf8"));
  for (const q of bank.questions) rows.push(row(`bankq-${q.id}`, skill, q, "curated-bank"));
}

console.log(`Seeding ${rows.length} 'curated-bank' questions…`);
await sql.query(`DELETE FROM "BankQuestion" WHERE model = 'curated-bank'`);

let done = 0;
for (let i = 0; i < rows.length; i += 20) {
  const batch = rows.slice(i, i + 20);
  await Promise.all(batch.map((r) => sql.query(INSERT, r)));
  done += batch.length;
  process.stdout.write(`\r  inserted ${done}/${rows.length}`);
}
process.stdout.write("\n");

const counts = await sql`SELECT model, count(*)::int AS n FROM "BankQuestion" GROUP BY model ORDER BY model`;
console.log("BankQuestion by model:", JSON.stringify(counts));
const total = await sql`SELECT count(*)::int AS n FROM "BankQuestion"`;
console.log("Total bank questions:", total[0].n);
