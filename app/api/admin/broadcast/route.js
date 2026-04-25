import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query, execute } from '@/lib/db';
import { randomUUID } from 'crypto';

// POST — send broadcast notification to filtered users
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { title, message, link, filter } = await req.json();
  // filter: 'all' | 'premium' | 'free' | 'verified' | 'unverified' | 'male' | 'female'

  if (!title || !message) return NextResponse.json({ error: 'Title and message required' }, { status: 400 });

  let where = "u.role = 'USER' AND u.isActive = 1";
  const params = [];

  if (filter === 'premium')    where += ' AND u.isPremium = 1';
  if (filter === 'free')       where += ' AND u.isPremium = 0';
  if (filter === 'verified')   where += ' AND u.adminVerified = 1';
  if (filter === 'unverified') where += ' AND u.adminVerified = 0';
  if (filter === 'male')       where += " AND p.gender = 'MALE'";
  if (filter === 'female')     where += " AND p.gender = 'FEMALE'";

  const users = await query(
    `SELECT u.id FROM \`user\` u LEFT JOIN profile p ON p.userId = u.id WHERE ${where}`,
    params
  );

  if (users.length === 0) return NextResponse.json({ error: 'No users match this filter', sent: 0 });

  // Batch insert notifications
  const now = new Date();
  const values = users.map(u => `('${randomUUID()}', '${u.id}', 'SYSTEM', ${JSON.stringify(title)}, ${JSON.stringify(message)}, 0, ${link ? JSON.stringify(link) : 'NULL'}, NOW())`).join(',');
  await execute(`INSERT INTO notification (id, userId, type, title, message, isRead, link, createdAt) VALUES ${values}`);

  // Web push to all
  try {
    const { sendPushToUser } = await import('@/lib/webpush');
    const pushPromises = users.slice(0, 500).map(u =>
      sendPushToUser(u.id, { title, body: message.slice(0, 100), url: link || '/notifications' }).catch(() => {})
    );
    await Promise.allSettled(pushPromises);
  } catch {}

  return NextResponse.json({ success: true, sent: users.length });
}

// GET — broadcast history (last 20)
export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Return recent system notifications as broadcast history
  const rows = await query(
    `SELECT title, message, link, createdAt, COUNT(*) as recipients
     FROM notification WHERE type = 'SYSTEM'
     GROUP BY title, message, link, createdAt
     ORDER BY createdAt DESC LIMIT 20`
  );
  return NextResponse.json(rows);
}
