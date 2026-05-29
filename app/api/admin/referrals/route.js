import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query } from '@/lib/db';
import { ensureFeatureTables } from '@/lib/ensureFeatureTables.js';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await ensureFeatureTables();

  const referrers = await query(
    `SELECT ur.id, ur.userId, ur.referralCode, ur.totalReferrals, ur.createdAt,
            u.name, u.email, u.isPremium, u.createdAt AS userSince
     FROM userreferral ur
     JOIN \`user\` u ON u.id = ur.userId
     ORDER BY ur.totalReferrals DESC, ur.createdAt DESC`
  );

  const referred = await query(
    `SELECT ur.userId AS referredUserId, ur.referredByUserId, ur.createdAt AS joinedAt,
            u.name AS referredName, u.email AS referredEmail,
            ref.name AS referrerName, ref_code.referralCode
     FROM userreferral ur
     JOIN \`user\` u ON u.id = ur.userId
     JOIN \`user\` ref ON ref.id = ur.referredByUserId
     LEFT JOIN userreferral ref_code ON ref_code.userId = ur.referredByUserId
     WHERE ur.referredByUserId IS NOT NULL
     ORDER BY ur.createdAt DESC
     LIMIT 200`
  );

  const summary = await query(
    `SELECT
       COUNT(*) AS totalCodes,
       COALESCE(SUM(totalReferrals), 0) AS totalReferrals,
       COUNT(CASE WHEN totalReferrals > 0 THEN 1 END) AS activeReferrers
     FROM userreferral`
  );

  return NextResponse.json({
    summary: {
      totalCodes: Number(summary[0]?.totalCodes) || 0,
      totalReferrals: Number(summary[0]?.totalReferrals) || 0,
      activeReferrers: Number(summary[0]?.activeReferrers) || 0,
    },
    referrers,
    referredUsers: referred,
  });
}
