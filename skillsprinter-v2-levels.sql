-- SkillSprinter v2 — per-user subarea level overrides (run once in Neon).
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subareaLevels" JSONB;
