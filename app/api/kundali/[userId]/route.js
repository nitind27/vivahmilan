import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { queryOne } from '@/lib/db';

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { userId } = await params;

  const kundali = await queryOne('SELECT * FROM kundali WHERE userId = ?', [userId]);
  if (!kundali) {
    return NextResponse.json({ error: 'Kundali not found' }, { status: 404 });
  }

  return NextResponse.json({
    ...kundali,
    manglik: !!kundali.manglik,
    planetaryPositions: JSON.parse(kundali.planetaryPositions),
    dashaSequence: JSON.parse(kundali.dashaSequence),
  });
}
