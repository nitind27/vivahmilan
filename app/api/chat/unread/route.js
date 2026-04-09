import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query, queryOne } from '@/lib/db';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ total: 0, perRoom: {} });

  const row = await queryOne(
    'SELECT COUNT(*) as cnt FROM message WHERE receiverId = ? AND isRead = 0',
    [session.user.id]
  );
  const total = Number(row?.cnt ?? 0);

  const perRoomRows = await query(
    'SELECT chatRoomId, COUNT(*) as cnt FROM message WHERE receiverId = ? AND isRead = 0 GROUP BY chatRoomId',
    [session.user.id]
  );
  const perRoom = Object.fromEntries(perRoomRows.map(r => [r.chatRoomId, Number(r.cnt)]));

  return NextResponse.json({ total, perRoom });
}
