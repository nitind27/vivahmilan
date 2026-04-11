import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { queryOne, execute } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { blockedId } = await req.json();
  if (!blockedId) return NextResponse.json({ error: 'blockedId required' }, { status: 400 });

  const existing = await queryOne(
    'SELECT id FROM block WHERE blockerId = ? AND blockedId = ?',
    [session.user.id, blockedId]
  );

  if (existing) {
    await execute('DELETE FROM block WHERE blockerId = ? AND blockedId = ?', [session.user.id, blockedId]);
    return NextResponse.json({ blocked: false });
  }

  await execute(
    'INSERT INTO block (id, blockerId, blockedId, createdAt) VALUES (?, ?, ?, NOW())',
    [randomUUID(), session.user.id, blockedId]
  );
  return NextResponse.json({ blocked: true });
}

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const targetId = searchParams.get('userId');

  if (targetId) {
    const row = await queryOne(
      'SELECT id FROM block WHERE blockerId = ? AND blockedId = ?',
      [session.user.id, targetId]
    );
    return NextResponse.json({ blocked: !!row });
  }

  // Return all blocked user IDs
  const rows = await queryOne(
    'SELECT blockedId FROM block WHERE blockerId = ?',
    [session.user.id]
  );
  return NextResponse.json({ blockedIds: rows ? [rows.blockedId] : [] });
}
