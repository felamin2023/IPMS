import "dotenv/config";
import pg from "pg";

const DIRECT_URL = process.env.DATABASE_URL || process.env.DIRECT_URL;

if (!DIRECT_URL) {
  console.error("DATABASE_URL / DIRECT_URL not set");
  process.exit(1);
}

const SQL = `
BEGIN;

DROP POLICY IF EXISTS "Allowed participants can insert request messages"
ON "request_messages";

ALTER TABLE "requests" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "requests"
  ALTER COLUMN "status" TYPE "RequestStatus"
  USING "status"::text::"RequestStatus";

ALTER TABLE "requests"
  ALTER COLUMN "status" SET DEFAULT 'request_sent';

DROP TYPE "RequestStatus_old";

CREATE POLICY "Allowed participants can insert request messages"
ON "request_messages"
FOR INSERT
WITH CHECK (
  auth.uid()::text = "sender_id"
  AND EXISTS (
    SELECT 1
    FROM "requests" r
    JOIN "users" u ON u."id" = auth.uid()::text
    WHERE r."id" = "request_messages"."request_id"
      AND (
        r."created_by" = auth.uid()::text
        OR (
          r."status" NOT IN (
            'completed',
            'returned_for_revision',
            'returned_for_action',
            'issuance'
          )
          AND (
            (r."status" = 'request_sent' AND u."role" = ANY (ARRAY['department_user'::"UserRole", 'accounting_admin'::"UserRole"]))
            OR (
              r."status" IN (
                'request_reviewed',
                'pr_number_assigned',
                'notice_of_meeting',
                'endorsed_to_bac',
                'resolution_approved',
                'under_supplier_quotation',
                'quotations_received',
                'under_quotation_evaluation',
                'hope_approval',
                'abstract_prepared',
                'contract_awarded',
                'noa_po_ntp_posted',
                'po_issued',
                'ntp_issued'
              )
              AND u."role" = 'procurement_admin'
            )
            OR (
              r."status" IN (
                'po_delivered',
                'items_for_inspection',
                'under_inspection',
                'under_warehousing'
              )
              AND u."role" = 'supply_admin'
            )
          )
        )
      )
  )
);

COMMIT;
`;

async function main() {
  const client = new pg.Client({ connectionString: DIRECT_URL });
  await client.connect();

  try {
    await client.query(SQL);
    console.log("RequestStatus enum fixed and policy updated.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
