import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query, queryOne, execute } from '@/lib/db';
import { randomUUID } from 'crypto';

// GET all site config
export async function GET() {
  const configs = await query('SELECT * FROM siteconfig ORDER BY `key` ASC');
  const map = {};
  for (const c of configs) map[c.key] = c.value;
  return NextResponse.json(map);
}

// POST/update a config key
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { key, value } = await req.json();
  if (!key) return NextResponse.json({ error: 'Key required' }, { status: 400 });

  const existing = await queryOne('SELECT id FROM siteconfig WHERE `key` = ?', [key]);
  if (existing) {
    await execute('UPDATE siteconfig SET value = ?, updatedAt = NOW() WHERE `key` = ?', [String(value), key]);
  } else {
    await execute(
      'INSERT INTO siteconfig (id, `key`, value, updatedAt, createdAt) VALUES (?, ?, ?, NOW(), NOW())',
      [randomUUID(), key, String(value)]
    );
  }

  const config = await queryOne('SELECT * FROM siteconfig WHERE `key` = ?', [key]);
  return NextResponse.json(config);
}
