-- Make PPMP completion-driven fields optional
ALTER TABLE "ppmp_plans"
  ALTER COLUMN "expires_at" DROP NOT NULL,
  ALTER COLUMN "realign_at" DROP NOT NULL;

-- Track completion and realignment events
ALTER TABLE "ppmp_plans"
  ADD COLUMN IF NOT EXISTS "completed_at" timestamptz,
  ADD COLUMN IF NOT EXISTS "completed_by" text;
