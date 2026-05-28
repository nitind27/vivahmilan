import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query, execute, queryOne } from '@/lib/db';

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const skip = parseInt(searchParams.get('skip') || '0');
  const limit = parseInt(searchParams.get('limit') || '15');

  const notifications = await query(
    `SELECT id, type, title, message, isRead, link, createdAt
     FROM notification
     WHERE userId = ? AND type = 'SYSTEM'
     ORDER BY createdAt DESC
     LIMIT ? OFFSET ?`,
    [session.user.id, limit, skip]
  );

  const totalRow = await queryOne(
    "SELECT COUNT(*) AS cnt FROM notification WHERE userId = ? AND type = 'SYSTEM'",
    [session.user.id]
  );
  const unreadRow = await queryOne(
    "SELECT COUNT(*) AS cnt FROM notification WHERE userId = ? AND type = 'SYSTEM' AND isRead = 0",
    [session.user.id]
  );

  const total = Number(totalRow?.cnt ?? 0);
  const unreadCount = Number(unreadRow?.cnt ?? 0);

  return NextResponse.json({
    notifications,
    unreadCount,
    total,
    hasMore: skip + limit < total,
  });
}

export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => ({}));

  if (body.id) {
    await execute(
      "UPDATE notification SET isRead = 1 WHERE id = ? AND userId = ? AND type = 'SYSTEM'",
      [body.id, session.user.id]
    );
  } else {
    await execute(
      "UPDATE notification SET isRead = 1 WHERE userId = ? AND type = 'SYSTEM' AND isRead = 0",
      [session.user.id]
    );
  }

  return NextResponse.json({ success: true });
}
