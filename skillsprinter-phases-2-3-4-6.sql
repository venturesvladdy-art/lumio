-- SkillSprinter — Proposal Phases 2 (Content Bank), 3 (Anon claim),
-- 4 (AI budget ledger), 6 (security). Additive only; run once in Neon.

-- Phase 3 + 6: User columns
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "claimedAnonIds" TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "pwTokenVersion" INTEGER NOT NULL DEFAULT 0;

-- Phase 2: shared Content Bank
CREATE TABLE IF NOT EXISTS "BankQuestion" (
  "id"              TEXT PRIMARY KEY,
  "skillId"         TEXT NOT NULL,
  "subareaKey"      TEXT NOT NULL,
  "concept"         TEXT NOT NULL,
  "difficulty"      TEXT NOT NULL,
  "type"            TEXT NOT NULL DEFAULT 'mcq',
  "questionEn"      TEXT NOT NULL,
  "questionPl"      TEXT NOT NULL,
  "optionsEn"       TEXT[] NOT NULL DEFAULT '{}',
  "optionsPl"       TEXT[] NOT NULL DEFAULT '{}',
  "correctIndex"    INTEGER NOT NULL,
  "answerText"      TEXT,
  "acceptedAnswers" TEXT[] NOT NULL DEFAULT '{}',
  "orderItems"      TEXT[] NOT NULL DEFAULT '{}',
  "correctOrder"    INTEGER[] NOT NULL DEFAULT '{}',
  "explanationEn"   TEXT NOT NULL,
  "explanationPl"   TEXT NOT NULL,
  "theoryEn"        TEXT,
  "theoryPl"        TEXT,
  "xp"              INTEGER NOT NULL DEFAULT 10,
  "qualityState"    TEXT NOT NULL DEFAULT 'approved',
  "model"           TEXT,
  "buildBatchId"    TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "BankQuestion_skillId_subareaKey_difficulty_idx"
  ON "BankQuestion" ("skillId", "subareaKey", "difficulty");
CREATE INDEX IF NOT EXISTS "BankQuestion_skillId_concept_idx"
  ON "BankQuestion" ("skillId", "concept");
CREATE INDEX IF NOT EXISTS "BankQuestion_qualityState_idx"
  ON "BankQuestion" ("qualityState");

-- Phase 4: AI spend ledger
CREATE TABLE IF NOT EXISTS "AiUsage" (
  "id"                TEXT PRIMARY KEY,
  "userId"            TEXT,
  "kind"              TEXT NOT NULL,
  "model"             TEXT NOT NULL,
  "inputTokens"       INTEGER NOT NULL,
  "outputTokens"      INTEGER NOT NULL,
  "cachedInputTokens" INTEGER NOT NULL DEFAULT 0,
  "costUsd"           DOUBLE PRECISION NOT NULL,
  "period"            TEXT NOT NULL,
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "AiUsage_userId_period_idx" ON "AiUsage" ("userId", "period");
CREATE INDEX IF NOT EXISTS "AiUsage_period_kind_idx" ON "AiUsage" ("period", "kind");
