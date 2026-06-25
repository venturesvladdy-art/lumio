-- SkillSprinter — scheduled plan-change tracking (run once in Neon).
-- Stores a pending downgrade/cancel that applies at the end of the billing period.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "pendingTier" TEXT;
