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

  const result = await client.query(
    'SELECT status, COUNT(*)::int AS count FROM "requests" GROUP BY status ORDER BY status',
  );

  console.log(result.rows);
  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
