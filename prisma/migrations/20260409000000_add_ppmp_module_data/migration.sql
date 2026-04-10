ALTER TABLE ppmp_plans
  ADD COLUMN IF NOT EXISTS module2_data jsonb,
  ADD COLUMN IF NOT EXISTS module3_rows jsonb;
