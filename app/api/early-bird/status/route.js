import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getEarlyBirdOfferForUser, getEarlyBirdSettings, getEarlyBirdClaimedCount } from '@/lib/earlyBird';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || null;
    const offer = await getEarlyBirdOfferForUser(userId);
    return NextResponse.json({ success: true, offer });
  } catch (err) {
    console.error('[early-bird/status]', err);
    return NextResponse.json({ error: 'Failed to load offer' }, { status: 500 });
  }
}

/** Public summary for homepage (no auth) */
export async function HEAD() {
  return GET();
}
