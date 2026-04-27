import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/flutter-jwt';
import { query, queryOne, execute } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function POST(req) {
  const token = getTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

  const { blockedId } = await req.json();
  if (!blockedId) return NextResponse.json({ error: 'blockedId required' }, { status: 400 });

  const existing = await queryOne(
    'SELECT id FROM block WHERE blockerId = ? AND blockedId = ?',
    [decoded.id, blockedId]
  );

  if (existing) {
    await execute('DELETE FROM block WHERE blockerId = ? AND blockedId = ?', [decoded.id, blockedId]);
    return NextResponse.json({ blocked: false });
  }

  await execute(
    'INSERT INTO block (id, blockerId, blockedId, createdAt) VALUES (?, ?, ?, NOW())',
    [randomUUID(), decoded.id, blockedId]
  );
  return NextResponse.json({ blocked: true });
}

export async function GET(req) {
  const token = getTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const targetId = searchParams.get('userId');

  if (targetId) {
    const row = await queryOne(
      'SELECT id FROM block WHERE blockerId = ? AND blockedId = ?',
      [decoded.id, targetId]
    );
    return NextResponse.json({ blocked: !!row });
  }

  const rows = await query(
    `SELECT b.id as blockId, b.createdAt as blockedAt,
            u.id, u.name, p.gender, p.city, p.state, p.country, p.religion, p.profession, p.dob
     FROM block b
     JOIN \`user\` u ON u.id = b.blockedId
     LEFT JOIN profile p ON p.userId = u.id
     WHERE b.blockerId = ?
     ORDER BY b.createdAt DESC`,
    [decoded.id]
  );
  return NextResponse.json(rows);
}
