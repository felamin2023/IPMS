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

  const types = await client.query(
    "SELECT t.typname, e.enumlabel FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname IN ('RequestStatus','RequestStatus_old') ORDER BY t.typname, e.enumsortorder",
  );
  const columns = await client.query(
    "SELECT table_name, column_name, udt_name FROM information_schema.columns WHERE table_schema='public' AND column_name='status' ORDER BY table_name",
  );
  const policies = await client.query(
    "SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check FROM pg_policies WHERE schemaname='public'",
  );

  console.log("ENUMS:", types.rows);
  console.log("STATUS COLUMNS:", columns.rows);
  console.log("POLICIES:", policies.rows);

  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
