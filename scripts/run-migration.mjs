import pg from "pg";
import { readFileSync } from "fs";

const PROJECT = "xbhptmislpjxzfhhcxbl";
const password = process.env.SUPABASE_DB_PASSWORD;

if (!password) {
  console.error("Missing SUPABASE_DB_PASSWORD");
  process.exit(1);
}

// Use connection string format with sslmode - this negotiates SSL correctly with Supavisor
const connStr = `postgresql://postgres.${PROJECT}:${encodeURIComponent(password)}@aws-0-eu-west-2.pooler.supabase.com:5432/postgres?sslmode=require`;

// Disable TLS verification for self-signed Supabase pooler cert
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const client = new pg.Client({
  connectionString: connStr,
  connectionTimeoutMillis: 10000,
});

try {
  await client.connect();
  console.log("Connected to database!");

  // Run the migration
  const sql = readFileSync("scripts/setup-invites.sql", "utf8");

  // Split by semicolons, skip pure comments
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    const clean = stmt.replace(/--.*$/gm, "").trim();
    if (!clean) continue;
    try {
      await client.query(clean);
      console.log("OK:", clean.slice(0, 70) + (clean.length > 70 ? "..." : ""));
    } catch (e) {
      if (e.message.includes("already exists")) {
        console.log("SKIP (exists):", clean.slice(0, 70));
      } else {
        console.log("ERR:", e.message);
        console.log("  Statement:", clean.slice(0, 100));
      }
    }
  }

  // Verify invites table
  const res = await client.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name = 'invites' ORDER BY ordinal_position"
  );
  console.log(
    "\ninvites table columns:",
    res.rows.map((r) => r.column_name).join(", ")
  );

  // Verify messages.user_id
  const res2 = await client.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'user_id'"
  );
  console.log(
    "messages.user_id:",
    res2.rows.length > 0 ? "EXISTS" : "MISSING"
  );

  await client.end();
  console.log("\nMigration complete!");
} catch (e) {
  console.error("Failed:", e.message);
  process.exit(1);
}
