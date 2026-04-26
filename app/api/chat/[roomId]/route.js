import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query, queryOne, execute } from '@/lib/db';
import { saveFile } from '@/lib/upload';
import { randomUUID } from 'crypto';

export const maxDuration = 30;

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { roomId } = await params;
  const { searchParams } = new URL(req.url);
  const before = searchParams.get('before'); // cursor: load messages before this createdAt
  const limit = 60;

  const room = await queryOne('SELECT * FROM chatroom WHERE id = ?', [roomId]);
  if (!room || (room.userAId !== session.user.id && room.userBId !== session.user.id)) {
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

  // Mark as read
  await execute(
    'UPDATE message SET isRead = 1 WHERE chatRoomId = ? AND receiverId = ? AND isRead = 0',
    [roomId, session.user.id]
  );

  return NextResponse.json(messages.reverse());
}

export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!session.user.isPremium) {
    // Also check free trial in DB directly (in case session is stale)
    const { queryOne } = await import('@/lib/db');
    const dbUser = await queryOne('SELECT freeTrialExpiry FROM `user` WHERE id = ?', [session.user.id]);
    const trialActive = dbUser?.freeTrialExpiry && new Date(dbUser.freeTrialExpiry) > new Date();
    if (!trialActive) {
      return NextResponse.json({ error: 'Chat requires a Premium subscription' }, { status: 403 });
    }
  }
  const { roomId } = await params;

  const room = await queryOne('SELECT * FROM chatroom WHERE id = ?', [roomId]);
  if (!room || (room.userAId !== session.user.id && room.userBId !== session.user.id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const receiverId = room.userAId === session.user.id ? room.userBId : room.userAId;
  const contentType = req.headers.get('content-type') || '';
  const msgId = randomUUID();
  const now = new Date();

  let content, type = 'TEXT', fileUrl = null, fileName = null, fileSize = null;
  let latitude = null, longitude = null, locationType = null, locationExpiry = null;

  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData();
    const file = formData.get('file');
    const base64Data = formData.get('base64');
    type = formData.get('type') || 'IMAGE';

    if (!file && !base64Data) return NextResponse.json({ error: 'No file' }, { status: 400 });

    if (file) {
      if (file.size > 15 * 1024 * 1024) return NextResponse.json({ error: 'Max file size: 15MB' }, { status: 400 });
      const saved = await saveFile(file, 'chat', session.user.id);
      fileUrl = saved.url;
      fileName = file.name;
      fileSize = file.size;
    } else {
      fileUrl = base64Data;
      fileName = formData.get('fileName') || 'image.jpg';
      fileSize = parseInt(formData.get('fileSize') || '0');
    }
    content = fileName;
  } else {
    const body = await req.json();
    type = body.type || 'TEXT';

    if (type === 'LOCATION') {
      latitude = parseFloat(body.latitude);
      longitude = parseFloat(body.longitude);
      locationType = body.locationType || 'current';
      locationExpiry = body.locationExpiry ? new Date(body.locationExpiry) : null;
      content = locationType === 'live' ? 'Shared live location' : 'Shared a location';
    } else {
      if (!body.content?.trim()) return NextResponse.json({ error: 'Empty message' }, { status: 400 });
      content = body.content.trim();
    }
    // Store replyToId in content prefix if provided (simple approach without schema change)
    if (body.replyToId) {
      content = `[replyTo:${body.replyToId}] ${content}`;
    }
  }

  await execute(
    `INSERT INTO message (id, chatRoomId, senderId, receiverId, content, type, fileUrl, fileName, fileSize, latitude, longitude, locationType, locationExpiry, isRead, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
    [msgId, roomId, session.user.id, receiverId, content, type, fileUrl, fileName, fileSize, latitude, longitude, locationType, locationExpiry, now]
  );

  // Notification
  await execute(
    "INSERT INTO notification (id, userId, type, title, message, isRead, link, createdAt) VALUES (?, ?, 'MESSAGE_RECEIVED', 'New Message', ?, 0, ?, NOW())",
    [randomUUID(), receiverId, `${session.user.name} sent you a message.`, `/chat?userId=${session.user.id}`]
  );

  // Web Push notification to receiver
  try {
    const { sendPushToUser } = await import('@/lib/webpush');
    const msgBody = type === 'IMAGE' ? '📷 Photo' : type === 'DOCUMENT' ? '📄 Document' : type === 'LOCATION' ? '📍 Location' : content;
    await sendPushToUser(receiverId, {
      title: `💬 ${session.user.name}`,
      body: msgBody,
      url: `/chat?userId=${session.user.id}`,
    });
  } catch (e) { console.error('Push error:', e.message); }

  const message = await queryOne('SELECT * FROM message WHERE id = ?', [msgId]);

  // Server-side socket emit — reliable real-time delivery
  try {
    const io = global.getIO?.();
    if (io) {
      io.to(roomId).emit('message:receive', { ...message, _senderName: session.user.name });
      // Notify receiver's navbar badge
      io.emit('notification:new', { userId: receiverId });
    }
  } catch (e) { console.error('Socket emit error:', e.message); }

  return NextResponse.json({ ...message, _senderName: session.user.name }, { status: 201 });
}
