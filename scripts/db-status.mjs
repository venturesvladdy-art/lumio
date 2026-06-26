import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

const safe = async (label, fn) => {
  try {
    console.log(label, JSON.stringify(await fn()));
  } catch (e) {
    console.log(label, "ERR", e.message.split("\n")[0]);
  }
};

const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`;
console.log("tables:", tables.map((t) => t.table_name).join(", "));

await safe("BankQuestion by model:", async () =>
  await sql`SELECT model, count(*)::int AS n FROM "BankQuestion" GROUP BY model`
);
await safe("AiUsage rows:", async () => await sql`SELECT count(*)::int AS n FROM "AiUsage"`);
await safe("User new cols:", async () =>
  await sql`SELECT column_name FROM information_schema.columns WHERE table_name='User' AND column_name IN ('claimedAnonIds','pwTokenVersion','pendingTier','subareaLevels')`
);
