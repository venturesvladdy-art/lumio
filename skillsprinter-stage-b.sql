-- SkillSprinter — Stage B migration (run once in Neon's SQL Editor).
-- Idempotent: safe to run whether or not earlier ALTERs were applied.
-- Covers areas, drills, learning briefs, question types, and free-text grading,
-- so no further migration is needed for the rest of Stage B.

-- Curriculum: onboarding answers + the drilled area
ALTER TABLE "Curriculum" ADD COLUMN IF NOT EXISTS "answers" JSONB;
ALTER TABLE "Curriculum" ADD COLUMN IF NOT EXISTS "areaId" TEXT;
ALTER TABLE "Curriculum" ADD COLUMN IF NOT EXISTS "areaName" TEXT;
CREATE INDEX IF NOT EXISTS "Curriculum_userId_skillId_areaId_idx"
  ON "Curriculum" ("userId", "skillId", "areaId");

-- Question: type + free-text/numeric answer + rubric + brief link
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL DEFAULT 'mcq';
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "briefClientId" TEXT;
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "answerText" TEXT;
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "rubric" TEXT;

-- Attempt: area, type, free-text response + AI score; index may be null now
ALTER TABLE "Attempt" ADD COLUMN IF NOT EXISTS "areaId" TEXT;
ALTER TABLE "Attempt" ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL DEFAULT 'mcq';
ALTER TABLE "Attempt" ADD COLUMN IF NOT EXISTS "responseText" TEXT;
ALTER TABLE "Attempt" ADD COLUMN IF NOT EXISTS "score" INTEGER;
ALTER TABLE "Attempt" ALTER COLUMN "selectedIndex" DROP NOT NULL;

-- Brief: short learning material that primes 2–3 questions
CREATE TABLE IF NOT EXISTS "Brief" (
  "id"           TEXT NOT NULL,
  "curriculumId" TEXT NOT NULL,
  "clientId"     TEXT NOT NULL,
  "title"        TEXT NOT NULL,
  "body"         TEXT NOT NULL,
  "orderIndex"   INTEGER NOT NULL,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Brief_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Brief_curriculumId_idx" ON "Brief" ("curriculumId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Brief_curriculumId_fkey'
  ) THEN
    ALTER TABLE "Brief"
      ADD CONSTRAINT "Brief_curriculumId_fkey"
      FOREIGN KEY ("curriculumId") REFERENCES "Curriculum"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
