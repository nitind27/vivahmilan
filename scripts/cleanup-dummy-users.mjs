#!/usr/bin/env node
/**
 * Remove bulk-seeded dummy users (@dummyvivah.test) to free DB space.
 * Hostinger blocks INSERT when database exceeds 3072 MB.
 *
 * Usage:
 *   node scripts/cleanup-dummy-users.mjs --dry-run
 *   node scripts/cleanup-dummy-users.mjs --batch 5000
 */

import { config as loadEnv } from 'dotenv';
import mysql from 'mysql2/promise';

loadEnv({ path: '.env.production' });

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const batchIdx = args.indexOf('--batch');
const batchSize = batchIdx >= 0 ? Math.max(1000, parseInt(args[batchIdx + 1], 10) || 5000) : 5000;

const conn = await mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  port: parseInt(process.env.DATABASE_PORT || '3306', 10),
});

const [[{ dummy_count }]] = await conn.query(
  "SELECT COUNT(*) AS dummy_count FROM `user` WHERE email LIKE '%@dummyvivah.test'"
);
const [[{ real_count }]] = await conn.query(
  "SELECT COUNT(*) AS real_count FROM `user` WHERE email NOT LIKE '%@dummyvivah.test' OR email IS NULL"
);
const [[{ total_mb }]] = await conn.query(`
  SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS total_mb
  FROM information_schema.tables WHERE table_schema = DATABASE()
`);

console.log('═══════════════════════════════════════════════');
console.log('  Vivah Dwar — Dummy User Cleanup');
console.log('═══════════════════════════════════════════════');
console.log(`  Dummy users to delete : ${dummy_count}`);
console.log(`  Real users (kept)     : ${real_count}`);
console.log(`  Current DB size     : ${total_mb} MB (limit 3072 MB)`);
console.log(`  Batch size          : ${batchSize}`);
console.log(`  Mode                : ${dryRun ? 'DRY RUN (no deletes)' : 'DELETE'}`);
console.log('═══════════════════════════════════════════════\n');

if (dryRun) {
  console.log('Run without --dry-run to start deleting.');
  await conn.end();
  process.exit(0);
}

if (dummy_count === 0) {
  console.log('Nothing to delete.');
  await conn.end();
  process.exit(0);
}

let deleted = 0;
const start = Date.now();

while (true) {
  const [result] = await conn.execute(
    "DELETE FROM `user` WHERE email LIKE '%@dummyvivah.test' LIMIT ?",
    [batchSize]
  );
  const n = result.affectedRows;
  if (n === 0) break;
  deleted += n;
  const elapsed = ((Date.now() - start) / 1000).toFixed(0);
  process.stdout.write(`\r  Deleted ${deleted}/${dummy_count} dummy users (${elapsed}s)...`);
}

console.log('\n\nOptimizing tables (reclaim disk space)...');
for (const table of ['photo', 'profile', 'user']) {
  process.stdout.write(`  OPTIMIZE ${table}...`);
  await conn.query(`OPTIMIZE TABLE \`${table}\``);
  console.log(' done');
}

const [[{ final_mb }]] = await conn.query(`
  SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS final_mb
  FROM information_schema.tables WHERE table_schema = DATABASE()
`);

console.log('\n✅ Cleanup complete');
console.log(`  Deleted     : ${deleted} dummy users`);
console.log(`  DB size now : ${final_mb} MB`);
console.log('\nNext: node scripts/test-db-insert-perms.mjs && pm2 restart vivahmil');

await conn.end();
