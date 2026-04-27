import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/flutter-jwt';
import { queryOne } from '@/lib/db';

export async function GET(req, { params }) {
  const token = getTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

  const { userId } = await params;
  const kundali = await queryOne('SELECT * FROM kundali WHERE userId = ?', [userId]);
  if (!kundali) return NextResponse.json(null);

  return NextResponse.json({
    ...kundali,
    manglik: !!kundali.manglik,
    planetaryPositions: JSON.parse(kundali.planetaryPositions || '{}'),
    dashaSequence: JSON.parse(kundali.dashaSequence || '[]'),
  });
}
