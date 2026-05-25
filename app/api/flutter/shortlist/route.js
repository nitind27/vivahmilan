import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/flutter-jwt';
import { query, queryOne, execute } from '@/lib/db';
import { getInteractionMaps, attachInteractionFlags } from '@/lib/flutter-interactions';
import { randomUUID } from 'crypto';

export async function GET(req) {
  const token = getTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page   = parseInt(searchParams.get('page')  || '1');
  const limit  = parseInt(searchParams.get('limit') || '20');
  const offset = (page - 1) * limit;

  const totalRow = await queryOne('SELECT COUNT(*) AS cnt FROM shortlist WHERE ownerId = ?', [decoded.id]);
  const total = totalRow?.cnt || 0;

  const rows = await query(
    `SELECT s.id, s.ownerId, s.targetId, s.createdAt,
            u.id AS u_id, u.name AS u_name, u.isPremium AS u_isPremium,
            p.gender, p.dob, p.religion, p.city, p.country, p.education, p.profession, p.profileComplete,
            ph.url AS photo_url
     FROM shortlist s
     JOIN \`user\` u ON u.id = s.targetId
     LEFT JOIN profile p ON p.userId = s.targetId
     LEFT JOIN photo ph ON ph.userId = s.targetId AND ph.isMain = 1
     WHERE s.ownerId = ?
     ORDER BY s.createdAt DESC
     LIMIT ? OFFSET ?`,
    [decoded.id, limit, offset]
  );

  const userIds = rows.map(r => r.u_id);
  const maps = userIds.length ? await getInteractionMaps(decoded.id, userIds) : {
    interestSentMap: {},
    interestReceivedMap: {},
    shortlistSet: new Set(),
    blockSet: new Set(),
  };

  const enriched = rows.map((r) => ({
    id: r.id, ownerId: r.ownerId, targetId: r.targetId, createdAt: r.createdAt,
    target: {
      id: r.u_id, name: r.u_name, isPremium: !!r.u_isPremium,
      profile: { gender: r.gender, dob: r.dob, religion: r.religion, city: r.city, country: r.country, education: r.education, profession: r.profession, profileComplete: r.profileComplete },
      photos: r.photo_url ? [{ url: r.photo_url }] : [],
      ...attachInteractionFlags(r.u_id, maps),
      isShortlisted: true,
    },
  }));

  return NextResponse.json({ data: enriched, total, page, limit, hasMore: offset + enriched.length < total });
}

export async function POST(req) {
  const token = getTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

  const { targetId } = await req.json();
  if (!targetId) return NextResponse.json({ error: 'targetId required' }, { status: 400 });

  const existing = await queryOne('SELECT id FROM shortlist WHERE ownerId = ? AND targetId = ?', [decoded.id, targetId]);
  if (existing) {
    await execute('DELETE FROM shortlist WHERE ownerId = ? AND targetId = ?', [decoded.id, targetId]);
    return NextResponse.json({ shortlisted: false });
  }

  await execute('INSERT INTO shortlist (id, ownerId, targetId, createdAt) VALUES (?, ?, ?, NOW())', [randomUUID(), decoded.id, targetId]);
  return NextResponse.json({ shortlisted: true }, { status: 201 });
}
