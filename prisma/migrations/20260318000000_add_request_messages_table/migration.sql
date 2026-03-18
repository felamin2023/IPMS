CREATE TABLE "request_messages" (
  "id" TEXT NOT NULL,
  "request_id" TEXT NOT NULL,
  "sender_id" TEXT NOT NULL,
  "sender_role" "UserRole" NOT NULL,
  "message" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "request_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "request_messages_request_id_created_at_idx"
ON "request_messages"("request_id", "created_at");

ALTER TABLE "request_messages"
ADD CONSTRAINT "request_messages_request_id_fkey"
FOREIGN KEY ("request_id") REFERENCES "requests"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "request_messages"
ADD CONSTRAINT "request_messages_sender_id_fkey"
FOREIGN KEY ("sender_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
