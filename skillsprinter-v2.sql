-- SkillSprinter v2 migration (run once in Neon's SQL Editor).
-- Idempotent: safe to re-run. Additive + nullable, so the app keeps working
-- on an un-migrated DB throughout the staged rollout.

-- Reusable skill taxonomy catalogue (area → subarea, generated once, reused)
CREATE TABLE IF NOT EXISTS "SkillTaxonomy" (
  "id"            TEXT PRIMARY KEY,
  "skillSlug"     TEXT NOT NULL UNIQUE,
  "canonicalName" TEXT NOT NULL,
  "matchKey"      TEXT NOT NULL,
  "kind"          TEXT NOT NULL DEFAULT 'standardized',
  "origin"        TEXT NOT NULL DEFAULT 'ai-generated',
  "model"         TEXT,
  "version"       INTEGER NOT NULL DEFAULT 1,
  "areas"         JSONB NOT NULL,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "SkillTaxonomy_matchKey_idx" ON "SkillTaxonomy"("matchKey");

-- Curriculum: the catalogued subarea a drill targets
ALTER TABLE "Curriculum" ADD COLUMN IF NOT EXISTS "subareaKey" TEXT;

-- Question: subarea + concept tag + new question-type payloads + cached theory
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "subareaKey" TEXT;
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "concept" TEXT;
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "acceptedAnswers" TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "orderItems" TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "correctOrder" INTEGER[] NOT NULL DEFAULT '{}';
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "theory" TEXT;
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "theoryIncludesAnswer" BOOLEAN;
CREATE INDEX IF NOT EXISTS "Question_subareaKey_idx" ON "Question"("subareaKey");
CREATE INDEX IF NOT EXISTS "Question_skillId_concept_idx" ON "Question"("skillId","concept");

-- Attempt: subarea + concept (copied from the answered question)
ALTER TABLE "Attempt" ADD COLUMN IF NOT EXISTS "subareaKey" TEXT;
ALTER TABLE "Attempt" ADD COLUMN IF NOT EXISTS "concept" TEXT;
CREATE INDEX IF NOT EXISTS "Attempt_userId_skillId_subareaKey_idx" ON "Attempt"("userId","skillId","subareaKey");
