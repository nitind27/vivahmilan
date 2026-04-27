import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/flutter-jwt';
import { query, queryOne } from '@/lib/db';

export async function GET(req) {
  const token = getTokenFromRequest(req);
  if (!token) return NextResponse.json({ total: 0, perRoom: {} });
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ total: 0, perRoom: {} });

  const row = await queryOne(
    'SELECT COUNT(*) as cnt FROM message WHERE receiverId = ? AND isRead = 0',
    [decoded.id]
  );
  const total = Number(row?.cnt ?? 0);

  const perRoomRows = await query(
    'SELECT chatRoomId, COUNT(*) as cnt FROM message WHERE receiverId = ? AND isRead = 0 GROUP BY chatRoomId',
    [decoded.id]
  );
  const perRoom = Object.fromEntries(perRoomRows.map(r => [r.chatRoomId, Number(r.cnt)]));

  return NextResponse.json({ total, perRoom });
}
