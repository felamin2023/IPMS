// Migrate existing request data from old status values to the new 21-step flow.
// Run with: npx tsx prisma/migrate-statuses.ts

import "dotenv/config";
import pg from "pg";

const DIRECT_URL = process.env.DATABASE_URL || process.env.DIRECT_URL;
if (!DIRECT_URL) {
  console.error("DATABASE_URL / DIRECT_URL not set");
  process.exit(1);
}

const NEW_ROLE_VALUES = ["twg", "procurement_admin", "supply_admin"];

const NEW_STATUS_VALUES = [
  "request_sent",
  "request_reviewed",
  "pr_number_assigned",
  "notice_of_meeting",
  "endorsed_to_bac",
  "resolution_approved",
  "under_supplier_quotation",
  "quotations_received",
  "under_quotation_evaluation",
  "hope_approval",
  "abstract_prepared",
  "contract_awarded",
  "po_issued",
  "ntp_issued",
  "noa_po_ntp_posted",
  "po_delivered",
  "po_received_supply",
  "items_for_inspection",
  "under_inspection",
  "under_warehousing",
  "completed",
  "returned_for_revision",
  "returned_for_action",
];

// Old → New status mapping
const STATUS_MAP: Record<string, string> = {
  submitted: "request_sent",
  head_review: "request_reviewed",
  budget_review: "endorsed_to_bac",
  procurement_processing: "under_supplier_quotation",
  purchase_order: "po_issued",
  rejected: "returned_for_revision",
  // Also map legacy values
  received: "request_reviewed",
  under_review: "request_reviewed",
  approved: "under_supplier_quotation",
  completed: "completed",
};

async function main() {
  const client = new pg.Client({ connectionString: DIRECT_URL });
  await client.connect();

  console.log("Adding new UserRole enum values…");
  for (const val of NEW_ROLE_VALUES) {
    try {
      await client.query(
        `ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS '${val}'`,
      );
      console.log(`  + ${val}`);
    } catch {
      console.log(`  (${val} already exists)`);
    }
  }

  console.log("Adding new RequestStatus enum values…");
  for (const val of NEW_STATUS_VALUES) {
    try {
      await client.query(
        `ALTER TYPE "RequestStatus" ADD VALUE IF NOT EXISTS '${val}'`,
      );
      console.log(`  + ${val}`);
    } catch {
      console.log(`  (${val} already exists)`);
    }
  }

  console.log("Migrating existing data in requests…");
  for (const [oldVal, newVal] of Object.entries(STATUS_MAP)) {
    const res = await client.query(
      `UPDATE "requests" SET "status" = $1 WHERE "status" = $2`,
      [newVal, oldVal],
    );
    if (res.rowCount && res.rowCount > 0) {
      console.log(`  requests: ${oldVal} → ${newVal} (${res.rowCount} rows)`);
    }
  }

  console.log("Migrating existing data in request_status_logs…");
  for (const [oldVal, newVal] of Object.entries(STATUS_MAP)) {
    const res = await client.query(
      `UPDATE "request_status_logs" SET "status" = $1 WHERE "status" = $2`,
      [newVal, oldVal],
    );
    if (res.rowCount && res.rowCount > 0) {
      console.log(`  logs: ${oldVal} → ${newVal} (${res.rowCount} rows)`);
    }
  }

  console.log("Done ✓");
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
