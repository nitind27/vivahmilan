import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query, queryOne, execute } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const user = await queryOne('SELECT * FROM `user` WHERE id = ?', [id]);
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Check if blocked
  const blocked = await queryOne(
    'SELECT id FROM block WHERE (blockerId = ? AND blockedId = ?) OR (blockerId = ? AND blockedId = ?)',
    [session.user.id, id, id, session.user.id]
  );
  if (blocked) return NextResponse.json({ error: 'Profile unavailable' }, { status: 403 });

  const profile = await queryOne('SELECT * FROM profile WHERE userId = ?', [id]);
  const photos = await query('SELECT * FROM photo WHERE userId = ? AND isMain = 0', [id]);

  // Record profile view
  if (session.user.id !== id) {
    const existing = await queryOne(
      'SELECT id FROM profileview WHERE viewerId = ? AND viewedId = ?',
      [session.user.id, id]
    );
    if (existing) {
      await execute('UPDATE profileview SET createdAt = NOW() WHERE id = ?', [existing.id]);
    } else {
      await execute(
        'INSERT INTO profileview (id, viewerId, viewedId, createdAt) VALUES (?, ?, ?, NOW())',
        [randomUUID(), session.user.id, id]
      );
    }
  }

  // Interest status
  const interest = await queryOne(
    'SELECT * FROM interest WHERE (senderId = ? AND receiverId = ?) OR (senderId = ? AND receiverId = ?)',
    [session.user.id, id, id, session.user.id]
  );

  // Shortlist status
  const shortlisted = await queryOne(
    'SELECT id FROM shortlist WHERE ownerId = ? AND targetId = ?',
    [session.user.id, id]
  );

  // Hide sensitive data
  const safeUser = { ...user };
  if (profile?.hidePhone) safeUser.phone = null;
  if (profile?.hidePhoto && !session.user.isPremium) photos.length = 0;

  return NextResponse.json({
    ...safeUser,
    profile,
    photos,
    interestStatus: interest?.status || null,
    interestDirection: interest ? (interest.senderId === session.user.id ? 'sent' : 'received') : null,
    interestId: interest?.id || null,
    isShortlisted: !!shortlisted,
  });
}
