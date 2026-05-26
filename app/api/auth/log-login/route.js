import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { recordLoginGeo } from '@/lib/geoTracking';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    await recordLoginGeo(session.user.id, req, body);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[log-login] error:', err.message);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
