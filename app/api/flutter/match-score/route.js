import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/flutter-jwt';
import { queryOne } from '@/lib/db';
import { computeMatchScore, matchScoreLabel } from '@/lib/matchScore.js';
import { hasPremiumFeature } from '@/lib/planPermissions.js';

export async function GET(req) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const targetId = searchParams.get('userId');
    if (!targetId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    const canSee = await hasPremiumFeature(decoded.id, 'aiMatchScore');
    const me = await queryOne(
      `SELECT p.gender, p.dob, p.religion, p.caste, p.motherTongue, p.city, p.state, p.country,
              p.partnerAgeMin, p.partnerAgeMax, p.partnerReligion
       FROM profile p WHERE p.userId = ?`,
      [decoded.id]
    );
    const candidate = await queryOne(
      `SELECT u.adminVerified, p.gender, p.dob, p.religion, p.caste, p.motherTongue, p.city, p.state, p.country,
              p.maritalStatus, p.profileComplete, u.isPremium
       FROM \`user\` u LEFT JOIN profile p ON p.userId = u.id WHERE u.id = ?`,
      [targetId]
    );

    if (!candidate) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const score = computeMatchScore(me, candidate);

    if (!canSee) {
      return NextResponse.json({
        locked: true,
        message: 'Premium subscription required for match score.',
        hint: score >= 70 ? 'high' : score >= 50 ? 'medium' : 'low',
      });
    }

    return NextResponse.json({ locked: false, score, ...matchScoreLabel(score) });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
