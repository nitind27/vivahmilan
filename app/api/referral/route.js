import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { queryOne, execute } from '@/lib/db';
import { getReferralStats, getOrCreateReferral } from '@/lib/referral.js';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const stats = await getReferralStats(session.user.id);
  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || '';

  return NextResponse.json({
    referralCode: stats.referralCode,
    totalReferrals: stats.totalReferrals || 0,
    referralLink: `${baseUrl}/register?ref=${stats.referralCode}`,
    referredUsers: (stats.referredUsers || []).map(u => ({
      id: u.id,
      name: u.name,
      photo: u.photo,
      joinedAt: u.createdAt,
    })),
  });
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const row = await getOrCreateReferral(session.user.id, session.user.name);
  return NextResponse.json({ referralCode: row.referralCode });
}
