import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query, queryOne, execute } from '@/lib/db';
import { randomUUID } from 'crypto';
import { buildProfileOptionsSeed } from '@/lib/profileOptionsSeed.js';

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    await execute(`
      CREATE TABLE IF NOT EXISTS profileoption (
        id varchar(191) NOT NULL PRIMARY KEY,
        category varchar(191) NOT NULL,
        value varchar(191) NOT NULL,
        label varchar(191) NOT NULL,
        \`group\` varchar(191) DEFAULT NULL,
        sortOrder int(11) NOT NULL DEFAULT 0,
        isActive tinyint(1) NOT NULL DEFAULT 1,
        createdAt datetime(3) NOT NULL DEFAULT current_timestamp(3),
        UNIQUE KEY ProfileOption_category_value_key (category, value),
        KEY ProfileOption_category_isActive_idx (category, isActive)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    const OPTIONS = buildProfileOptionsSeed();
    let inserted = 0;
    let skipped = 0;

    for (const opt of OPTIONS) {
      const existing = await queryOne(
        'SELECT id FROM profileoption WHERE category = ? AND value = ?',
        [opt.category, opt.value]
      );
      if (existing) {
        skipped++;
        continue;
      }
      await execute(
        'INSERT INTO profileoption (id, category, value, label, `group`, sortOrder, isActive, createdAt) VALUES (?, ?, ?, ?, ?, ?, 1, NOW(3))',
        [randomUUID(), opt.category, opt.value, opt.label, opt.group || null, opt.sortOrder ?? 0]
      );
      inserted++;
    }

    const counts = await query(
      'SELECT category, COUNT(*) AS cnt FROM profileoption GROUP BY category ORDER BY category'
    );

    return NextResponse.json({
      success: true,
      inserted,
      skipped,
      totalInSeed: OPTIONS.length,
      counts,
      message: `Added ${inserted} new options (${skipped} already existed)`,
    });
  } catch (e) {
    console.error('[profile-options/seed]', e);
    return NextResponse.json({ error: e.message || 'Seed failed' }, { status: 500 });
  }
}
