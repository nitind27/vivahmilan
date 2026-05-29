import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { queryOne } from '@/lib/db';
import { computeMatchScore, matchScoreLabel } from '@/lib/matchScore.js';
import { hasPremiumFeature } from '@/lib/planPermissions.js';

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const targetId = searchParams.get('userId');
  if (!targetId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

  const canSee = await hasPremiumFeature(session.user.id, 'aiMatchScore');

  const me = await queryOne(
    `SELECT p.gender, p.dob, p.religion, p.caste, p.motherTongue, p.city, p.state, p.country,
            p.partnerAgeMin, p.partnerAgeMax, p.partnerReligion
     FROM profile p WHERE p.userId = ?`,
    [session.user.id]
  );
  const candidate = await queryOne(
    `SELECT u.adminVerified, p.gender, p.dob, p.religion, p.caste, p.motherTongue, p.city, p.state, p.country,
            p.education, p.profession, p.maritalStatus, p.profileComplete, u.isPremium
     FROM \`user\` u LEFT JOIN profile p ON p.userId = u.id WHERE u.id = ?`,
    [targetId]
  );

  if (!candidate) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const score = computeMatchScore(me, candidate);

  if (!canSee) {
    return NextResponse.json({
      locked: true,
      message: 'Upgrade to premium to see AI match compatibility score.',
      hint: score >= 70 ? 'high' : score >= 50 ? 'medium' : 'low',
    });
  }

  return NextResponse.json({
    locked: false,
    score,
    ...matchScoreLabel(score),
  });
}
