import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query, queryOne, execute } from '@/lib/db';
import { randomUUID } from 'crypto';

// GET /api/admin/direct-chat?userId=xxx  — get or create chat room + messages
export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

  const adminId = session.user.id;
  const [a, b] = [adminId, userId].sort();

  let room = await queryOne('SELECT id FROM chatroom WHERE userAId = ? AND userBId = ?', [a, b]);
  if (!room) {
    const roomId = randomUUID();
    await execute('INSERT INTO chatroom (id, userAId, userBId, createdAt) VALUES (?, ?, ?, NOW())', [roomId, a, b]);
    room = { id: roomId };
  }

  const messages = await query(
    'SELECT * FROM message WHERE chatRoomId = ? ORDER BY createdAt ASC LIMIT 100',
    [room.id]
  );

  // Mark as read
  await execute(
    'UPDATE message SET isRead = 1 WHERE chatRoomId = ? AND receiverId = ? AND isRead = 0',
    [room.id, adminId]
  );

  const user = await queryOne(
    `SELECT u.id, u.name, u.email, u.phone, u.image, u.isPremium, u.isVerified,
            p.gender, p.city, p.country, ph.url AS mainPhoto
     FROM \`user\` u
     LEFT JOIN profile p ON p.userId = u.id
     LEFT JOIN photo ph ON ph.userId = u.id AND ph.isMain = 1
     WHERE u.id = ?`,
    [userId]
  );

  return NextResponse.json({ roomId: room.id, messages, user });
}

// POST /api/admin/direct-chat — send message
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { userId, content } = await req.json();
  if (!userId || !content?.trim())
    return NextResponse.json({ error: 'userId and content required' }, { status: 400 });

  const adminId = session.user.id;
  const [a, b] = [adminId, userId].sort();

  let room = await queryOne('SELECT id FROM chatroom WHERE userAId = ? AND userBId = ?', [a, b]);
  if (!room) {
    const roomId = randomUUID();
    await execute('INSERT INTO chatroom (id, userAId, userBId, createdAt) VALUES (?, ?, ?, NOW())', [roomId, a, b]);
    room = { id: roomId };
  }

  const msgId = randomUUID();
  await execute(
    "INSERT INTO message (id, chatRoomId, senderId, receiverId, content, type, isRead, createdAt) VALUES (?, ?, ?, ?, ?, 'TEXT', 0, NOW())",
    [msgId, room.id, adminId, userId, content.trim()]
  );

  // Emit via socket
  try {
    const io = global.getIO?.();
    if (io) io.to(room.id).emit('message:receive', { id: msgId, chatRoomId: room.id, senderId: adminId, receiverId: userId, content: content.trim(), type: 'TEXT', isRead: false, createdAt: new Date() });
  } catch {}

  // Push notification
  try {
    const { sendPushToUser } = await import('@/lib/webpush');
    await sendPushToUser(userId, { title: '💬 New message from Support', body: content.trim().slice(0, 80), url: '/chat' });
  } catch {}

  return NextResponse.json({ success: true, msgId });
}
