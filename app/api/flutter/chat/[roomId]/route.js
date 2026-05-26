import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/flutter-jwt';
import { query, queryOne, execute } from '@/lib/db';
import { saveFile } from '@/lib/upload';
import { parseLocationBody } from '@/lib/chatLocation';
import { resolveChatAccess } from '@/lib/chatAccess';
import { randomUUID } from 'crypto';

async function requireChatAccess(userId) {
  const dbUser = await queryOne(
    'SELECT isPremium, premiumPlan, premiumExpiry, freeTrialExpiry FROM `user` WHERE id = ?',
    [userId]
  );
  const access = resolveChatAccess(dbUser);
  if (!access.hasAccess) return { ok: false, access };
  return { ok: true };
}

// GET - messages in a room (paginated)
// Query params:
//   page   (default 1)
//   limit  (default 20)
//   before (optional cursor — ISO datetime, for cursor-based older-message loading)
export async function GET(req, { params }) {
  const token = getTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

  const gate = await requireChatAccess(decoded.id);
  if (!gate.ok) {
    return NextResponse.json({ error: 'Chat access required', ...gate.access }, { status: 403 });
  }

  const { roomId } = await params;
  const { searchParams } = new URL(req.url);
  const page   = parseInt(searchParams.get('page')  || '1');
  const limit  = parseInt(searchParams.get('limit') || '20');
  const before = searchParams.get('before'); // cursor: load messages older than this datetime
  const offset = (page - 1) * limit;

  const room = await queryOne('SELECT * FROM chatroom WHERE id = ?', [roomId]);
  if (!room || (room.userAId !== decoded.id && room.userBId !== decoded.id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Total count (with or without cursor)
  const totalRow = before
    ? await queryOne('SELECT COUNT(*) AS cnt FROM message WHERE chatRoomId = ? AND createdAt < ?', [roomId, before])
    : await queryOne('SELECT COUNT(*) AS cnt FROM message WHERE chatRoomId = ?', [roomId]);
  const total = totalRow?.cnt || 0;

  const messages = before
    ? await query(
        'SELECT * FROM message WHERE chatRoomId = ? AND createdAt < ? ORDER BY createdAt DESC LIMIT ? OFFSET ?',
        [roomId, before, limit, offset]
      )
    : await query(
        'SELECT * FROM message WHERE chatRoomId = ? ORDER BY createdAt DESC LIMIT ? OFFSET ?',
        [roomId, limit, offset]
      );

  // Mark received messages as read
  await execute(
    'UPDATE message SET isRead = 1 WHERE chatRoomId = ? AND receiverId = ? AND isRead = 0',
    [roomId, decoded.id]
  );

  return NextResponse.json({
    data: messages.reverse(), // oldest first for chat UI
    total,
    page,
    limit,
    hasMore: offset + messages.length < total,
  });
}

// POST - send message in existing room
export async function POST(req, { params }) {
  const token = getTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

  const gate = await requireChatAccess(decoded.id);
  if (!gate.ok) {
    return NextResponse.json({ error: 'Chat access required', ...gate.access }, { status: 403 });
  }

  const { roomId } = await params;
  const room = await queryOne('SELECT * FROM chatroom WHERE id = ?', [roomId]);
  if (!room || (room.userAId !== decoded.id && room.userBId !== decoded.id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const receiverId = room.userAId === decoded.id ? room.userBId : room.userAId;
  const contentType = req.headers.get('content-type') || '';

  let content, type = 'TEXT', fileUrl = null, fileName = null, fileSize = null;
  let latitude = null, longitude = null, locationType = null, locationExpiry = null;

  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData();
    const file = formData.get('file');
    type = formData.get('type') || 'IMAGE';

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    if (file.size > 15 * 1024 * 1024) return NextResponse.json({ error: 'Max file size: 15MB' }, { status: 400 });

    // Image type: allow common image formats only
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    // Document type: only PDF allowed
    if (type === 'IMAGE' && !allowedImageTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Only JPG, PNG, WEBP, GIF images are allowed' }, { status: 400 });
    }
    if (type === 'DOCUMENT' && file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF documents are allowed' }, { status: 400 });
    }

    const saved = await saveFile(file, 'chat', decoded.id);
    fileUrl = saved.url;
    fileName = file.name;
    fileSize = file.size;
    content = fileName;
  } else {
    const body = await req.json();
    type = body.type || 'TEXT';
    content = body.content;
    
    if (type === 'LOCATION') {
      const loc = parseLocationBody(body);
      latitude = loc.latitude;
      longitude = loc.longitude;
      locationType = loc.locationType;
      locationExpiry = loc.locationExpiry;
      content = loc.content;
      if (latitude === undefined || longitude === undefined || Number.isNaN(latitude) || Number.isNaN(longitude)) {
        return NextResponse.json({ error: 'latitude and longitude required for location' }, { status: 400 });
      }
    } else {
      if (!content?.trim()) return NextResponse.json({ error: 'Empty message' }, { status: 400 });
      content = content.trim();
    }
  }

  const msgId = randomUUID();
  const now = new Date();
  await execute(
    'INSERT INTO message (id, chatRoomId, senderId, receiverId, content, type, fileUrl, fileName, fileSize, latitude, longitude, locationType, locationExpiry, isRead, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)',
    [msgId, roomId, decoded.id, receiverId, content, type, fileUrl, fileName, fileSize, latitude, longitude, locationType, locationExpiry, now]
  );

  const sender = await queryOne('SELECT name FROM `user` WHERE id = ?', [decoded.id]);
  const title = 'New Message';
  const notificationMsg = `${sender?.name} sent you a message.`;
  await execute(
    "INSERT INTO notification (id, userId, type, title, message, isRead, link, createdAt) VALUES (?, ?, 'MESSAGE_RECEIVED', ?, ?, 0, ?, NOW())",
    [randomUUID(), receiverId, title, notificationMsg, `/chat?userId=${decoded.id}`]
  );
  const message = await queryOne('SELECT * FROM message WHERE id = ?', [msgId]);

  try {
    const { sendChatNotifications } = await import('@/lib/notificationHelper');
    await sendChatNotifications({
      receiverId,
      senderId: decoded.id,
      senderName: sender?.name || 'User',
      roomId,
      messageObj: message,
      type,
      content
    });
  } catch (err) {
    console.error('Unified Notification Error:', err);
  }


  return NextResponse.json(message, { status: 201 });
}
