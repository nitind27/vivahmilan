import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { execute, queryOne } from '@/lib/db';
import bcrypt from 'bcryptjs';

// Auto-add needsPassword column if missing
async function ensureColumn() {
  try {
    await execute(`ALTER TABLE \`user\` ADD COLUMN IF NOT EXISTS needsPassword TINYINT(1) DEFAULT 0`);
  } catch {}
}

let migrated = false;

export async function POST(req) {
  if (!migrated) { await ensureColumn(); migrated = true; }

  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { password, confirmPassword } = await req.json();

  if (!password || password.length < 8)
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  if (password !== confirmPassword)
    return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 });

  const hashed = await bcrypt.hash(password, 12);
  await execute(
    'UPDATE `user` SET password = ?, needsPassword = 0, updatedAt = NOW() WHERE id = ?',
    [hashed, session.user.id]
  );

  return NextResponse.json({ ok: true });
}
