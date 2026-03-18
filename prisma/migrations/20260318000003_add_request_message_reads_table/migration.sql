CREATE TABLE "request_message_reads" (
  "user_id" TEXT NOT NULL,
  "request_id" TEXT NOT NULL,
  "last_read_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "request_message_reads_pkey" PRIMARY KEY ("user_id", "request_id")
);

CREATE INDEX "request_message_reads_request_id_idx"
ON "request_message_reads"("request_id");

ALTER TABLE "request_message_reads"
ADD CONSTRAINT "request_message_reads_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "request_message_reads"
ADD CONSTRAINT "request_message_reads_request_id_fkey"
FOREIGN KEY ("request_id") REFERENCES "requests"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "request_message_reads" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own message read states"
ON "request_message_reads";

DROP POLICY IF EXISTS "Users can insert own message read states"
ON "request_message_reads";

DROP POLICY IF EXISTS "Users can update own message read states"
ON "request_message_reads";

CREATE POLICY "Users can read own message read states"
ON "request_message_reads"
FOR SELECT
USING (auth.uid()::text = "user_id");

CREATE POLICY "Users can insert own message read states"
ON "request_message_reads"
FOR INSERT
WITH CHECK (auth.uid()::text = "user_id");

CREATE POLICY "Users can update own message read states"
ON "request_message_reads"
FOR UPDATE
USING (auth.uid()::text = "user_id")
WITH CHECK (auth.uid()::text = "user_id");
