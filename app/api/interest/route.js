import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query, queryOne, execute } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { receiverId, message } = await req.json();

  const existing = await queryOne(
    'SELECT id FROM interest WHERE senderId = ? AND receiverId = ?',
    [session.user.id, receiverId]
  );
  if (existing) return NextResponse.json({ error: 'Interest already sent' }, { status: 409 });

  const id = randomUUID();
  const now = new Date();
  await execute(
    "INSERT INTO interest (id, senderId, receiverId, message, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, 'PENDING', ?, ?)",
    [id, session.user.id, receiverId, message || null, now, now]
  );

  await execute(
    "INSERT INTO notification (id, userId, type, title, message, isRead, link, createdAt) VALUES (?, ?, 'INTEREST_RECEIVED', 'New Interest Received', ?, 0, ?, NOW())",
    [randomUUID(), receiverId, `${session.user.name} has sent you an interest request.`, `/profile/${session.user.id}`]
  );

  // Web Push
  try {
    const { sendPushToUser } = await import('@/lib/webpush');
    await sendPushToUser(receiverId, {
      title: '💕 New Interest!',
      body: `${session.user.name} has sent you an interest request.`,
      url: `/profile/${session.user.id}`,
    });
  } catch (e) { console.error('Push error:', e.message); }

  return NextResponse.json({ id, senderId: session.user.id, receiverId, status: 'PENDING' }, { status: 201 });
}

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'received';

  const interests = await query(
    type === 'received'
      ? 'SELECT * FROM interest WHERE receiverId = ? ORDER BY createdAt DESC'
      : 'SELECT * FROM interest WHERE senderId = ? ORDER BY createdAt DESC',
    [session.user.id]
  );

  // Attach user info
  const enriched = await Promise.all(interests.map(async (i) => {
    const otherId = type === 'received' ? i.senderId : i.receiverId;
    const user = await queryOne('SELECT id, name, email, image, isPremium, isVerified FROM `user` WHERE id = ?', [otherId]);
    const profile = await queryOne('SELECT gender, dob, religion, city, country, education, profession, profileComplete FROM profile WHERE userId = ?', [otherId]);
    const photo = await queryOne('SELECT url FROM photo WHERE userId = ? AND isMain = 1 LIMIT 1', [otherId]);
    return {
      ...i,
      sender: type === 'received' ? { ...user, profile, photos: photo ? [photo] : [] } : null,
      receiver: type === 'sent' ? { ...user, profile, photos: photo ? [photo] : [] } : null,
    };
  }));

  return NextResponse.json(enriched);
}
