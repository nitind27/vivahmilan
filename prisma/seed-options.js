/**
 * Seed profileoption table from lib/profileOptionsSeed.js
 * Run: node prisma/seed-options.js
 */
import { config as loadEnv } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import { randomUUID } from 'crypto';
import { buildProfileOptionsSeed } from '../lib/profileOptionsSeed.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: join(__dirname, '../.env') });
if (!process.env.DATABASE_HOST) {
  loadEnv({ path: join(__dirname, '../.env.production') });
}

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    port: parseInt(process.env.DATABASE_PORT || '3306', 10),
  });

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS profileoption (
      id varchar(191) NOT NULL,
      category varchar(191) NOT NULL,
      value varchar(191) NOT NULL,
      label varchar(191) NOT NULL,
      \`group\` varchar(191) DEFAULT NULL,
      sortOrder int(11) NOT NULL DEFAULT 0,
      isActive tinyint(1) NOT NULL DEFAULT 1,
      createdAt datetime(3) NOT NULL DEFAULT current_timestamp(3),
      PRIMARY KEY (id),
      UNIQUE KEY ProfileOption_category_value_key (category, value),
      KEY ProfileOption_category_isActive_idx (category, isActive)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const OPTIONS = buildProfileOptionsSeed();
  console.log('🌱 Seeding profile options...', OPTIONS.length, 'rows');
  let inserted = 0;
  let skipped = 0;

  for (const opt of OPTIONS) {
    const [ex] = await conn.execute(
      'SELECT id FROM profileoption WHERE category = ? AND value = ?',
      [opt.category, opt.value]
    );
    if (ex.length > 0) {
      skipped++;
      continue;
    }
    await conn.execute(
      'INSERT INTO profileoption (id, category, value, label, `group`, sortOrder, isActive, createdAt) VALUES (?, ?, ?, ?, ?, ?, 1, NOW(3))',
      [randomUUID(), opt.category, opt.value, opt.label, opt.group || null, opt.sortOrder ?? 0]
    );
    inserted++;
  }

  const [counts] = await conn.execute(
    'SELECT category, COUNT(*) AS cnt FROM profileoption GROUP BY category ORDER BY category'
  );
  await conn.end();

  console.log(`✅ Done! Inserted: ${inserted}, Skipped (already exist): ${skipped}`);
  console.log('📊 By category:');
  counts.forEach((r) => console.log(`   ${r.category}: ${r.cnt}`));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
