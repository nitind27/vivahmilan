import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/flutter-jwt';
import { query, queryOne, execute } from '@/lib/db';
import { randomUUID } from 'crypto';

// GET - all chat rooms
export async function GET(req) {
  const token = getTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

  const uid = decoded.id;
  const rooms = await query(
    `SELECT
       cr.id, cr.userAId, cr.userBId, cr.createdAt,
       uA.id AS uA_id, uA.name AS uA_name, uA.isPremium AS uA_isPremium, uA.lastSeen AS uA_lastSeen,
       pA.gender AS pA_gender, pA.city AS pA_city, pA.country AS pA_country,
       phA.url AS phA_url,
       uB.id AS uB_id, uB.name AS uB_name, uB.isPremium AS uB_isPremium, uB.lastSeen AS uB_lastSeen,
       pB.gender AS pB_gender, pB.city AS pB_city, pB.country AS pB_country,
       phB.url AS phB_url,
       lm.id AS lm_id, lm.content AS lm_content, lm.createdAt AS lm_createdAt,
       lm.senderId AS lm_senderId, lm.type AS lm_type, lm.isRead AS lm_isRead
     FROM chatroom cr
     JOIN \`user\` uA ON uA.id = cr.userAId
     JOIN \`user\` uB ON uB.id = cr.userBId
     LEFT JOIN profile pA ON pA.userId = cr.userAId
     LEFT JOIN profile pB ON pB.userId = cr.userBId
     LEFT JOIN photo phA ON phA.userId = cr.userAId AND phA.isMain = 1
     LEFT JOIN photo phB ON phB.userId = cr.userBId AND phB.isMain = 1
     LEFT JOIN message lm ON lm.id = (
       SELECT id FROM message WHERE chatRoomId = cr.id ORDER BY createdAt DESC LIMIT 1
     )
     WHERE cr.userAId = ? OR cr.userBId = ?
     ORDER BY COALESCE(lm.createdAt, cr.createdAt) DESC`,
    [uid, uid]
  );

  const enriched = rooms.map((r) => ({
    id: r.id, userAId: r.userAId, userBId: r.userBId, createdAt: r.createdAt,
    userA: { id: r.uA_id, name: r.uA_name, isPremium: !!r.uA_isPremium, lastSeen: r.uA_lastSeen, profile: { gender: r.pA_gender, city: r.pA_city, country: r.pA_country }, photos: r.phA_url ? [{ url: r.phA_url }] : [] },
    userB: { id: r.uB_id, name: r.uB_name, isPremium: !!r.uB_isPremium, lastSeen: r.uB_lastSeen, profile: { gender: r.pB_gender, city: r.pB_city, country: r.pB_country }, photos: r.phB_url ? [{ url: r.phB_url }] : [] },
    messages: r.lm_id ? [{ id: r.lm_id, content: r.lm_content, createdAt: r.lm_createdAt, senderId: r.lm_senderId, type: r.lm_type, isRead: !!r.lm_isRead }] : [],
  }));

  return NextResponse.json(enriched);
}

// POST - send message (creates room if not exists)
export async function POST(req) {
  const token = getTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

  // Premium check
  const dbUser = await queryOne('SELECT isPremium, freeTrialExpiry FROM `user` WHERE id = ?', [decoded.id]);
  const trialActive = dbUser?.freeTrialExpiry && new Date(dbUser.freeTrialExpiry) > new Date();
  if (!dbUser?.isPremium && !trialActive) {
    return NextResponse.json({ error: 'Chat requires a Premium subscription' }, { status: 403 });
  }

  const { receiverId, content, type = 'TEXT' } = await req.json();
  if (!receiverId || !content?.trim()) return NextResponse.json({ error: 'receiverId and content required' }, { status: 400 });

  const [a, b] = [decoded.id, receiverId].sort();
  let room = await queryOne('SELECT id FROM chatroom WHERE userAId = ? AND userBId = ?', [a, b]);
  if (!room) {
    const roomId = randomUUID();
    await execute('INSERT INTO chatroom (id, userAId, userBId, createdAt) VALUES (?, ?, ?, NOW())', [roomId, a, b]);
    room = { id: roomId };
  }

  const msgId = randomUUID();
  const now = new Date();
  await execute(
    'INSERT INTO message (id, chatRoomId, senderId, receiverId, content, type, isRead, createdAt) VALUES (?, ?, ?, ?, ?, ?, 0, ?)',
    [msgId, room.id, decoded.id, receiverId, content.trim(), type, now]
  );

  const sender = await queryOne('SELECT name FROM `user` WHERE id = ?', [decoded.id]);
  await execute(
    "INSERT INTO notification (id, userId, type, title, message, isRead, link, createdAt) VALUES (?, ?, 'MESSAGE_RECEIVED', 'New Message', ?, 0, ?, NOW())",
    [randomUUID(), receiverId, `${sender?.name} sent you a message.`, `/chat?userId=${decoded.id}`]
  );

  const message = await queryOne('SELECT * FROM message WHERE id = ?', [msgId]);
  return NextResponse.json({ ...message, roomId: room.id }, { status: 201 });
}
