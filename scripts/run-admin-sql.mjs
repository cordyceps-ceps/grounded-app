import { readFileSync } from "fs";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const sql = readFileSync("scripts/setup-admin-stats.sql", "utf8");

// Split on CREATE OR REPLACE to get individual function defs
const statements = sql
  .split(/(?=CREATE OR REPLACE FUNCTION)/)
  .map((s) => s.trim())
  .filter((s) => s.startsWith("CREATE"));

for (const stmt of statements) {
  const funcName = stmt.match(/FUNCTION (\w+)/)?.[1] || "unknown";

  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: stmt }),
  });

  // Try the SQL endpoint instead
  const res2 = await fetch(`${SUPABASE_URL}/pg`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: stmt }),
  });

  if (!res2.ok) {
    // Last resort: use the management API
    console.log(`Need to run ${funcName} via Supabase Dashboard SQL editor`);
  } else {
    console.log(`OK   ${funcName}`);
  }
}

console.log("\nTo run these functions, paste scripts/setup-admin-stats.sql into your Supabase SQL Editor.");
