#!/usr/bin/env node
/**
 * Update seed user emails to realistic Gmail-style addresses.
 * Only UPDATES existing users — no new inserts.
 *
 * Usage:
 *   node scripts/fix-seed-emails.mjs
 *   node scripts/fix-seed-emails.mjs --dry-run
 *   node scripts/fix-seed-emails.mjs --limit 100
 */

import { config } from 'dotenv';
import { existsSync } from 'fs';
import mysql from 'mysql2/promise';

const envFile = existsSync('.env.production') ? '.env.production' : '.env';
config({ path: envFile });

function parseArgs(argv) {
  const out = { dryRun: false, batch: 2000, limit: 0 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') out.dryRun = true;
    else if (a === '--batch' && argv[i + 1]) out.batch = Math.max(100, parseInt(argv[++i], 10));
    else if (a === '--limit' && argv[i + 1]) out.limit = Math.max(0, parseInt(argv[++i], 10));
    else if (a === '--help' || a === '-h') out.help = true;
  }
  return out;
}

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function emailSlug(part) {
  return String(part || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 24) || 'user';
}

function buildRealisticEmail(name, userId, usedEmails) {
  const parts = String(name || 'User Profile').trim().split(/\s+/).filter(Boolean);
  const first = emailSlug(parts[0]);
  const last = emailSlug(parts.length > 1 ? parts[parts.length - 1] : parts[0]);
  const num = 100 + (hashStr(userId) % 9899);
  let email = `${first}.${last}.${num}@gmail.com`;
  let suffix = 0;
  while (usedEmails.has(email)) {
    suffix += 1;
    email = `${first}.${last}.${num}${suffix}@gmail.com`;
  }
  usedEmails.add(email);
  return email;
}

async function bulkUpdateEmails(conn, updates) {
  if (!updates.length) return;
  const caseParts = [];
  const params = [];
  const ids = [];
  for (const u of updates) {
    caseParts.push('WHEN ? THEN ?');
    params.push(u.id, u.newEmail);
    ids.push(u.id);
  }
  params.push(...ids);
  const sql = `
    UPDATE \`user\`
    SET email = CASE id ${caseParts.join(' ')} END,
        updatedAt = NOW()
    WHERE id IN (${ids.map(() => '?').join(',')})
  `;
  await conn.query(sql, params);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(`
Fix seed user emails → firstname.lastname.number@gmail.com

Options:
  --dry-run   Preview only, no DB changes
  --batch     Rows per bulk UPDATE (default: 2000)
  --limit     Max users to update (default: all seed users)
`);
    process.exit(0);
  }

  const conn = await mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    port: parseInt(process.env.DATABASE_PORT || '3306', 10),
  });

  console.log(`📧 Seed email updater (${args.dryRun ? 'DRY RUN' : 'LIVE'})`);

  const [existingEmails] = await conn.query('SELECT LOWER(email) AS email FROM `user`');
  const usedEmails = new Set(existingEmails.map(r => r.email));

  const [[{ total }]] = await conn.query(
    "SELECT COUNT(*) AS total FROM `user` WHERE email LIKE '%@seed.vivahdwar.in'"
  );
  console.log(`Found ${total} seed users to update`);

  const limitClause = args.limit > 0 ? `LIMIT ${args.limit}` : '';
  const [rows] = await conn.query(
    `SELECT id, name, email FROM \`user\` WHERE email LIKE '%@seed.vivahdwar.in' ORDER BY createdAt ${limitClause}`
  );

  let updated = 0;
  const samples = [];

  for (let i = 0; i < rows.length; i += args.batch) {
    const batch = rows.slice(i, i + args.batch);
    const updates = [];

    for (const row of batch) {
      usedEmails.delete(String(row.email).toLowerCase());
      const newEmail = buildRealisticEmail(row.name, row.id, usedEmails);
      updates.push({ id: row.id, oldEmail: row.email, newEmail, name: row.name });
    }

    if (!args.dryRun) {
      await bulkUpdateEmails(conn, updates);
    }

    updated += updates.length;
    if (samples.length < 8) samples.push(...updates.slice(0, 8 - samples.length));
    process.stdout.write(`\rUpdated ${updated}/${rows.length}...`);
  }

  console.log('\n\nSample updates:');
  for (const s of samples) {
    console.log(`  ${s.name}`);
    console.log(`    ${s.oldEmail}`);
    console.log(`    → ${s.newEmail}`);
  }

  console.log(`\n✅ Done — ${updated} emails ${args.dryRun ? 'would be' : ''} updated.`);
  await conn.end();
}

main().catch(err => {
  console.error('❌', err.message);
  process.exit(1);
});
