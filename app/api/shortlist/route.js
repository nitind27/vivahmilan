import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query, queryOne, execute } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const list = await query(
    'SELECT * FROM shortlist WHERE ownerId = ? ORDER BY createdAt DESC',
    [session.user.id]
  );

  const enriched = await Promise.all(list.map(async (s) => {
    const user = await queryOne('SELECT id, name, email, image, isPremium, isVerified FROM `user` WHERE id = ?', [s.targetId]);
    const profile = await queryOne('SELECT gender, dob, religion, city, country, education, profession, profileComplete FROM profile WHERE userId = ?', [s.targetId]);
    const photo = await queryOne('SELECT url FROM photo WHERE userId = ? AND isMain = 1 LIMIT 1', [s.targetId]);
    return { ...s, target: { ...user, profile, photos: photo ? [photo] : [] } };
  }));

  return NextResponse.json(enriched);
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { targetId } = await req.json();

  const existing = await queryOne(
    'SELECT id FROM shortlist WHERE ownerId = ? AND targetId = ?',
    [session.user.id, targetId]
  );

  if (existing) {
    await execute('DELETE FROM shortlist WHERE ownerId = ? AND targetId = ?', [session.user.id, targetId]);
    return NextResponse.json({ shortlisted: false });
  }

  await execute(
    'INSERT INTO shortlist (id, ownerId, targetId, createdAt) VALUES (?, ?, ?, NOW())',
    [randomUUID(), session.user.id, targetId]
  );
  return NextResponse.json({ shortlisted: true }, { status: 201 });
}
