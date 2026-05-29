import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query, queryOne } from '@/lib/db';
import { hasPremiumFeature } from '@/lib/planPermissions';

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const uid = session.user.id;
  const canSee = await hasPremiumFeature(uid, 'canSeeWhoViewed');

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);
  const offset = (page - 1) * limit;

  const countRow = await queryOne(
    `SELECT COUNT(*) AS count FROM profileview pv
     JOIN \`user\` u ON u.id = pv.viewerId
     WHERE pv.viewedId = ? AND u.isActive = 1`,
    [uid]
  );
  const total = Number(countRow?.count || 0);

  if (!canSee) {
    const teaser = await query(
      `SELECT pv.createdAt, u.isPremium, u.isVerified, u.verificationBadge,
              p.gender, p.city, p.state
       FROM profileview pv
       JOIN \`user\` u ON u.id = pv.viewerId
       LEFT JOIN profile p ON p.userId = u.id
       WHERE pv.viewedId = ? AND u.isActive = 1
       ORDER BY pv.createdAt DESC LIMIT 5`,
      [uid]
    );
    return NextResponse.json({
      locked: true,
      total,
      message: 'Upgrade to a premium plan to see who viewed your profile.',
      teaser: teaser.map(v => ({
        viewedAt: v.createdAt,
        gender: v.gender,
        location: [v.city, v.state].filter(Boolean).join(', ') || null,
        isPremium: !!v.isPremium,
        isVerified: !!v.isVerified,
        blurred: true,
      })),
    });
  }

  const viewers = await query(
    `SELECT pv.id, pv.createdAt AS viewedAt,
            u.id, u.name, u.isPremium, u.isVerified, u.verificationBadge, u.adminVerified,
            p.gender, p.dob, p.religion, p.city, p.state, p.country, p.education, p.profession, p.profileComplete,
            ph.url AS photo
     FROM profileview pv
     JOIN \`user\` u ON u.id = pv.viewerId
     LEFT JOIN profile p ON p.userId = u.id
     LEFT JOIN photo ph ON ph.userId = u.id AND ph.isMain = 1
     WHERE pv.viewedId = ? AND u.isActive = 1
     ORDER BY pv.createdAt DESC
     LIMIT ? OFFSET ?`,
    [uid, limit, offset]
  );

  return NextResponse.json({
    locked: false,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    viewers: viewers.map(v => ({
      viewId: v.id,
      viewedAt: v.viewedAt,
      user: {
        id: v.id,
        name: v.name,
        isPremium: !!v.isPremium,
        isVerified: !!v.isVerified,
        verificationBadge: !!v.verificationBadge,
        adminVerified: !!v.adminVerified,
        photo: v.photo,
        profile: {
          gender: v.gender,
          dob: v.dob,
          religion: v.religion,
          city: v.city,
          state: v.state,
          country: v.country,
          education: v.education,
          profession: v.profession,
          profileComplete: v.profileComplete,
        },
      },
    })),
  });
}
