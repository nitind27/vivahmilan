import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/flutter-jwt';
import { query, queryOne, execute } from '@/lib/db';
import { randomUUID } from 'crypto';

// GET - messages in a room
export async function GET(req, { params }) {
  const token = getTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

  const { roomId } = await params;
  const { searchParams } = new URL(req.url);
  const before = searchParams.get('before');
  const limit  = parseInt(searchParams.get('limit') || '50');

  const room = await queryOne('SELECT * FROM chatroom WHERE id = ?', [roomId]);
  if (!room || (room.userAId !== decoded.id && room.userBId !== decoded.id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let messages;
  if (before) {
    messages = await query(
      'SELECT * FROM message WHERE chatRoomId = ? AND createdAt < ? ORDER BY createdAt DESC LIMIT ?',
      [roomId, before, limit]
    );
  } else {
    messages = await query(
      'SELECT * FROM message WHERE chatRoomId = ? ORDER BY createdAt DESC LIMIT ?',
      [roomId, limit]
    );
  }

  await execute(
    'UPDATE message SET isRead = 1 WHERE chatRoomId = ? AND receiverId = ? AND isRead = 0',
    [roomId, decoded.id]
  );

  return NextResponse.json(messages.reverse());
}

// POST - send message in existing room
export async function POST(req, { params }) {
  const token = getTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

  const dbUser = await queryOne('SELECT isPremium, freeTrialExpiry FROM `user` WHERE id = ?', [decoded.id]);
  const trialActive = dbUser?.freeTrialExpiry && new Date(dbUser.freeTrialExpiry) > new Date();
  if (!dbUser?.isPremium && !trialActive) {
    return NextResponse.json({ error: 'Chat requires a Premium subscription' }, { status: 403 });
  }

  const { roomId } = await params;
  const room = await queryOne('SELECT * FROM chatroom WHERE id = ?', [roomId]);
  if (!room || (room.userAId !== decoded.id && room.userBId !== decoded.id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const receiverId = room.userAId === decoded.id ? room.userBId : room.userAId;
  const { content, type = 'TEXT' } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: 'Empty message' }, { status: 400 });

  const msgId = randomUUID();
  const now = new Date();
  await execute(
    'INSERT INTO message (id, chatRoomId, senderId, receiverId, content, type, isRead, createdAt) VALUES (?, ?, ?, ?, ?, ?, 0, ?)',
    [msgId, roomId, decoded.id, receiverId, content.trim(), type, now]
  );

  const sender = await queryOne('SELECT name FROM `user` WHERE id = ?', [decoded.id]);
  await execute(
    "INSERT INTO notification (id, userId, type, title, message, isRead, link, createdAt) VALUES (?, ?, 'MESSAGE_RECEIVED', 'New Message', ?, 0, ?, NOW())",
    [randomUUID(), receiverId, `${sender?.name} sent you a message.`, `/chat?userId=${decoded.id}`]
  );

  const message = await queryOne('SELECT * FROM message WHERE id = ?', [msgId]);
  return NextResponse.json(message, { status: 201 });
}
