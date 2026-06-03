// Run SQL migrations against Supabase via the service role key
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Execute SQL via the Supabase SQL endpoint
async function runSQL(sql) {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/`;

  // Try executing individual statements via the management API
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/pg/query`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
      body: JSON.stringify({ query: sql }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    console.error(`HTTP ${response.status}: ${text}`);
    return null;
  }

  return await response.json();
}

// Split and execute statements
const sqlFile = process.argv[2] || 'scripts/setup-auth.sql';
const sql = readFileSync(sqlFile, 'utf-8');

// Split on semicolons, filter empty
const statements = sql
  .split(/;\s*$/m)
  .map(s => s.trim())
  .filter(s => s && !s.startsWith('--'));

console.log(`Running ${statements.length} statements from ${sqlFile}...`);

for (let i = 0; i < statements.length; i++) {
  const stmt = statements[i];
  const preview = stmt.slice(0, 80).replace(/\n/g, ' ');
  process.stdout.write(`[${i + 1}/${statements.length}] ${preview}... `);

  const result = await runSQL(stmt);
  if (result) {
    console.log('OK');
  } else {
    console.log('FAILED (see error above)');
  }
}

console.log('Done.');
