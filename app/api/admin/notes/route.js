import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query, execute } from '@/lib/db';
import { ensureFeatureTables } from '@/lib/ensureFeatureTables.js';

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

  await ensureFeatureTables();
  const notes = await query(
    'SELECT id, note, adminId, adminName, createdAt FROM adminnote WHERE targetUserId = ? ORDER BY createdAt DESC LIMIT 50',
    [userId]
  );
  return NextResponse.json({ notes });
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { userId, note } = await req.json();
  if (!userId || !note?.trim()) return NextResponse.json({ error: 'userId and note required' }, { status: 400 });

  await ensureFeatureTables();
  const id = crypto.randomUUID();
  await execute(
    'INSERT INTO adminnote (id, targetUserId, adminId, adminName, note) VALUES (?, ?, ?, ?, ?)',
    [id, userId, session.user.id, session.user.name || session.user.email, note.trim()]
  );
  return NextResponse.json({ id, success: true });
}

export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  await ensureFeatureTables();
  await execute('DELETE FROM adminnote WHERE id = ?', [id]);
  return NextResponse.json({ success: true });
}
