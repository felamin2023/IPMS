-- Rename TWG role to Accounting Administrator (if present)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'UserRole' AND e.enumlabel = 'twg'
  ) THEN
    ALTER TYPE "UserRole" RENAME VALUE 'twg' TO 'accounting_admin';
  END IF;
END $$;

-- Add requested/reviewed names to requests
ALTER TABLE "requests"
  ADD COLUMN IF NOT EXISTS "requested_by" text,
  ADD COLUMN IF NOT EXISTS "reviewed_by" text;

-- Add category + preferred brand to request items
ALTER TABLE "request_items"
  ADD COLUMN IF NOT EXISTS "category" text,
  ADD COLUMN IF NOT EXISTS "preferred_brand" text;

-- Create PR groups table for per-category PR numbers
CREATE TABLE IF NOT EXISTS "request_pr_groups" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "request_id" text NOT NULL REFERENCES "requests" ("id") ON DELETE CASCADE,
  "category" text NOT NULL,
  "pr_no" text NOT NULL UNIQUE,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

-- PPMP plans
CREATE TABLE IF NOT EXISTS "ppmp_plans" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "created_by" text NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
  "college_id" text NOT NULL REFERENCES "colleges" ("id") ON DELETE CASCADE,
  "program_id" text NOT NULL REFERENCES "programs" ("id") ON DELETE CASCADE,
  "expires_at" timestamptz NOT NULL,
  "realign_at" timestamptz NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "ppmp_items" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "plan_id" text NOT NULL REFERENCES "ppmp_plans" ("id") ON DELETE CASCADE,
  "category" text NOT NULL,
  "item_description" text NOT NULL,
  "qty" integer NOT NULL,
  "uom" text NOT NULL,
  "unit_price" numeric,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
