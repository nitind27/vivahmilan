import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { execute, queryOne } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { endpoint, keys } = await req.json();
  if (!endpoint || !keys?.p256dh || !keys?.auth)
    return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });

  // Upsert — replace existing subscription for this endpoint
  const existing = await queryOne(
    'SELECT id FROM pushsubscription WHERE userId = ? AND endpoint = ?',
    [session.user.id, endpoint]
  );

  if (existing) {
    await execute(
      'UPDATE pushsubscription SET p256dh = ?, auth = ? WHERE id = ?',
      [keys.p256dh, keys.auth, existing.id]
    );
  } else {
    await execute(
      'INSERT INTO pushsubscription (id, userId, endpoint, p256dh, auth, createdAt) VALUES (?, ?, ?, ?, ?, NOW())',
      [randomUUID(), session.user.id, endpoint, keys.p256dh, keys.auth]
    );
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { endpoint } = await req.json();
  await execute(
    'DELETE FROM pushsubscription WHERE userId = ? AND endpoint = ?',
    [session.user.id, endpoint]
  );
  return NextResponse.json({ success: true });
}
