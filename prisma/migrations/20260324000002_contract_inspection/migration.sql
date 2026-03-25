ALTER TABLE "requests"
  ADD COLUMN IF NOT EXISTS "contract_amount" numeric(12, 2),
  ADD COLUMN IF NOT EXISTS "contract_file_url" text;

ALTER TABLE "request_items"
  ADD COLUMN IF NOT EXISTS "inspection_notes" text,
  ADD COLUMN IF NOT EXISTS "inspection_file_url" text;
