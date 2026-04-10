import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query } from '@/lib/db';

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const subs = await query('SELECT id, endpoint FROM pushsubscription WHERE userId = ?', [session.user.id]);

  return NextResponse.json({
    vapidPublicKey: process.env.VAPID_PUBLIC_KEY ? 'SET' : 'MISSING',
    vapidPrivateKey: process.env.VAPID_PRIVATE_KEY ? 'SET' : 'MISSING',
    subscriptions: subs?.length || 0,
    subEndpoints: subs?.map(s => s.endpoint?.slice(0, 50) + '...') || [],
  });
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { sendPushToUser } = await import('@/lib/webpush');
    await sendPushToUser(session.user.id, {
      title: '🔔 Test Notification',
      body: 'Milan Matrimony push notification is working!',
      url: '/dashboard',
    });
    return NextResponse.json({ success: true, message: 'Push sent!' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
