// Merge legacy po_received_supply status into po_delivered.
// Run with: npx tsx prisma/migrate-po-received-to-delivered.ts

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

  const preview = await client.query(
    `SELECT COUNT(*)::int AS count
     FROM "requests"
     WHERE "status" = 'po_received_supply'`,
  );

  const toUpdate = preview.rows[0]?.count ?? 0;
  console.log(`Found ${toUpdate} request(s) with po_received_supply status.`);

  if (toUpdate === 0) {
    console.log("No updates needed. Done");
    await client.end();
    return;
  }

  const reqResult = await client.query(
    `UPDATE "requests"
     SET "status" = 'po_delivered',
         "updated_at" = NOW()
     WHERE "status" = 'po_received_supply'`,
  );

  const logResult = await client.query(
    `UPDATE "request_status_logs"
     SET "status" = 'po_delivered'
     WHERE "status" = 'po_received_supply'`,
  );

  console.log(
    `Updated ${reqResult.rowCount ?? 0} request(s) and ${logResult.rowCount ?? 0} status log(s).`,
  );
  console.log("Done");

  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
