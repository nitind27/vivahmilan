import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/flutter-jwt';
import { query, queryOne, execute } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function POST(req) {
  const token = getTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

  const { receiverId, message } = await req.json();
  if (!receiverId) return NextResponse.json({ error: 'receiverId required' }, { status: 400 });

  const existing = await queryOne(
    'SELECT id FROM interest WHERE senderId = ? AND receiverId = ?',
    [decoded.id, receiverId]
  );
  if (existing) return NextResponse.json({ error: 'Interest already sent' }, { status: 409 });

  const id = randomUUID();
  const now = new Date();
  await execute(
    "INSERT INTO interest (id, senderId, receiverId, message, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, 'PENDING', ?, ?)",
    [id, decoded.id, receiverId, message || null, now, now]
  );

  const sender = await queryOne('SELECT name FROM `user` WHERE id = ?', [decoded.id]);
  await execute(
    "INSERT INTO notification (id, userId, type, title, message, isRead, link, createdAt) VALUES (?, ?, 'INTEREST_RECEIVED', 'New Interest Received', ?, 0, ?, NOW())",
    [randomUUID(), receiverId, `${sender?.name} has sent you an interest request.`, `/profile/${decoded.id}`]
  );

  return NextResponse.json({ id, senderId: decoded.id, receiverId, status: 'PENDING' }, { status: 201 });
}

export async function GET(req) {
  const token = getTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type   = searchParams.get('type') || 'received';
  const limit  = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  const col = type === 'received' ? 'i.senderId' : 'i.receiverId';
  const rows = await query(
    `SELECT
       i.id, i.senderId, i.receiverId, i.message, i.status, i.createdAt, i.updatedAt,
       u.id AS u_id, u.name AS u_name, u.isPremium AS u_isPremium, u.isVerified AS u_isVerified,
       p.gender, p.dob, p.religion, p.city, p.country, p.education, p.profession, p.profileComplete,
       ph.url AS photo_url
     FROM interest i
     JOIN \`user\` u ON u.id = ${col}
     LEFT JOIN profile p ON p.userId = ${col}
     LEFT JOIN photo ph ON ph.userId = ${col} AND ph.isMain = 1
     WHERE ${type === 'received' ? 'i.receiverId' : 'i.senderId'} = ?
     ORDER BY i.createdAt DESC
     LIMIT ? OFFSET ?`,
    [decoded.id, limit, offset]
  );

  const enriched = rows.map((r) => {
    const user = {
      id: r.u_id, name: r.u_name, isPremium: !!r.u_isPremium, isVerified: !!r.u_isVerified,
      profile: { gender: r.gender, dob: r.dob, religion: r.religion, city: r.city, country: r.country, education: r.education, profession: r.profession, profileComplete: r.profileComplete },
      photos: r.photo_url ? [{ url: r.photo_url }] : [],
    };
    return {
      id: r.id, senderId: r.senderId, receiverId: r.receiverId,
      message: r.message, status: r.status, createdAt: r.createdAt, updatedAt: r.updatedAt,
      sender:   type === 'received' ? user : null,
      receiver: type === 'sent'     ? user : null,
    };
  });

  return NextResponse.json(enriched);
}
