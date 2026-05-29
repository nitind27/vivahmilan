import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/flutter-jwt';
import { getReferralStats, getOrCreateReferral } from '@/lib/referral.js';

export async function GET(req) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

    const stats = await getReferralStats(decoded.id);
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
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

    const row = await getOrCreateReferral(decoded.id);
    return NextResponse.json({ referralCode: row.referralCode });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
