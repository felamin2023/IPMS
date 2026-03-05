// Migrate existing request data from old status values to new ones.
// Run with: npx tsx prisma/migrate-statuses.ts

import "dotenv/config";
import pg from "pg";

const DIRECT_URL = process.env.DATABASE_URL || process.env.DIRECT_URL;
if (!DIRECT_URL) {
  console.error("DATABASE_URL / DIRECT_URL not set");
  process.exit(1);
}

async function main() {
  const client = new pg.Client({ connectionString: DIRECT_URL });
  await client.connect();

  console.log("Adding new enum values…");
  // ADD VALUE must be outside a transaction block
  for (const val of [
    "head_review",
    "budget_review",
    "procurement_processing",
    "purchase_order",
  ]) {
    try {
      await client.query(
        `ALTER TYPE "RequestStatus" ADD VALUE IF NOT EXISTS '${val}'`,
      );
      console.log(`  + ${val}`);
    } catch (err: any) {
      console.log(`  (${val} already exists)`);
    }
  }

  console.log("Migrating existing data in requests…");
  await client.query(
    `UPDATE "requests" SET "status" = 'head_review' WHERE "status" = 'under_review'`,
  );
  await client.query(
    `UPDATE "requests" SET "status" = 'head_review' WHERE "status" = 'received'`,
  );
  await client.query(
    `UPDATE "requests" SET "status" = 'procurement_processing' WHERE "status" = 'approved'`,
  );
  await client.query(
    `UPDATE "requests" SET "status" = 'purchase_order' WHERE "status" = 'completed'`,
  );

  console.log("Migrating existing data in request_status_logs…");
  await client.query(
    `UPDATE "request_status_logs" SET "status" = 'head_review' WHERE "status" = 'under_review'`,
  );
  await client.query(
    `UPDATE "request_status_logs" SET "status" = 'head_review' WHERE "status" = 'received'`,
  );
  await client.query(
    `UPDATE "request_status_logs" SET "status" = 'procurement_processing' WHERE "status" = 'approved'`,
  );
  await client.query(
    `UPDATE "request_status_logs" SET "status" = 'purchase_order' WHERE "status" = 'completed'`,
  );

  console.log("Done ✓");
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
