// Clear legacy PR numbers from requests that are still in request_sent status.
// Run with: npx tsx prisma/clear-request-sent-pr-numbers.ts

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

  console.log("Checking request_sent rows with existing PR number...");

  const preview = await client.query(
    `SELECT COUNT(*)::int AS count
     FROM "requests"
     WHERE "status" = 'request_sent'
       AND "pr_no" IS NOT NULL`,
  );

  const toClear = preview.rows[0]?.count ?? 0;
  console.log(`Found ${toClear} request_sent row(s) with PR number.`);

  if (toClear === 0) {
    console.log("No cleanup needed. Done ✓");
    await client.end();
    return;
  }

  const result = await client.query(
    `UPDATE "requests"
     SET "pr_no" = NULL,
         "updated_at" = NOW()
     WHERE "status" = 'request_sent'
       AND "pr_no" IS NOT NULL`,
  );

  console.log(`Cleared PR numbers for ${result.rowCount ?? 0} row(s).`);
  console.log("Done ✓");

  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
