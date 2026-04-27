import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/flutter-jwt';
import { query, queryOne, execute } from '@/lib/db';

export async function GET(req) {
  const token = getTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const skip  = parseInt(searchParams.get('skip')  || '0');
  const limit = parseInt(searchParams.get('limit') || '20');

  const notifications = await query(
    "SELECT * FROM notification WHERE userId = ? AND type != 'MESSAGE_RECEIVED' ORDER BY createdAt DESC LIMIT ? OFFSET ?",
    [decoded.id, limit, skip]
  );

  const totalRow = await queryOne(
    "SELECT COUNT(*) as cnt FROM notification WHERE userId = ? AND type != 'MESSAGE_RECEIVED'",
    [decoded.id]
  );
  const total = Number(totalRow?.cnt ?? 0);

  const unreadRow = await queryOne(
    "SELECT COUNT(*) as cnt FROM notification WHERE userId = ? AND type != 'MESSAGE_RECEIVED' AND isRead = 0",
    [decoded.id]
  );
  const unreadCount = Number(unreadRow?.cnt ?? 0);

  return NextResponse.json({ notifications, unreadCount, total, hasMore: skip + limit < total });
}

export async function PATCH(req) {
  const token = getTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  if (body?.id) {
    await execute('UPDATE notification SET isRead = 1 WHERE id = ? AND userId = ?', [body.id, decoded.id]);
  } else {
    await execute('UPDATE notification SET isRead = 1 WHERE userId = ? AND isRead = 0', [decoded.id]);
  }

  return NextResponse.json({ success: true });
}
