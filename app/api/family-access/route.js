import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query, queryOne, execute } from '@/lib/db';
import { ensureFeatureTables } from '@/lib/ensureFeatureTables.js';
import bcrypt from 'bcryptjs';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role === 'FAMILY') {
    return NextResponse.json({ error: 'Family members cannot manage access' }, { status: 403 });
  }

  await ensureFeatureTables();
  const members = await query(
    `SELECT id, memberName, email, relationship, isActive, createdAt FROM familyaccess WHERE ownerUserId = ? ORDER BY createdAt DESC`,
    [session.user.id]
  );
  return NextResponse.json({ members });
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role === 'FAMILY') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { memberName, email, password, relationship } = await req.json();
  if (!memberName?.trim() || !email?.trim() || !password?.trim()) {
    return NextResponse.json({ error: 'Name, email and password required' }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
  }

  await ensureFeatureTables();
  const existing = await queryOne('SELECT id FROM familyaccess WHERE email = ?', [email.trim().toLowerCase()]);
  if (existing) return NextResponse.json({ error: 'Email already used for family access' }, { status: 409 });

  const count = await queryOne('SELECT COUNT(*) AS cnt FROM familyaccess WHERE ownerUserId = ?', [session.user.id]);
  if (Number(count?.cnt) >= 3) {
    return NextResponse.json({ error: 'Maximum 3 family logins allowed' }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const hash = await bcrypt.hash(password, 10);
  await execute(
    `INSERT INTO familyaccess (id, ownerUserId, memberName, email, password, relationship) VALUES (?, ?, ?, ?, ?, ?)`,
    [id, session.user.id, memberName.trim(), email.trim().toLowerCase(), hash, relationship || 'Parent']
  );

  return NextResponse.json({ id, success: true }, { status: 201 });
}

export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  await ensureFeatureTables();
  await execute('DELETE FROM familyaccess WHERE id = ? AND ownerUserId = ?', [id, session.user.id]);
  return NextResponse.json({ success: true });
}
