import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/flutter-jwt';
import { query, queryOne } from '@/lib/db';
import { hasPremiumFeature } from '@/lib/planPermissions';

export async function GET(req) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

    const uid = decoded.id;
    const canSee = await hasPremiumFeature(uid, 'canSeeWhoViewed');

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);
    const offset = (page - 1) * limit;

    const countRow = await queryOne(
      `SELECT COUNT(*) AS cnt FROM profileview pv
       JOIN \`user\` u ON u.id = pv.viewerId
       WHERE pv.viewedId = ? AND u.isActive = 1`,
      [uid]
    );
    const total = Number(countRow?.cnt || 0);

    if (!canSee) {
      const teaser = await query(
        `SELECT pv.createdAt, p.gender, p.city, p.state, u.isPremium, u.isVerified
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
        message: 'Premium subscription required to see who viewed your profile.',
        teaser: teaser.map(v => ({
          viewedAt: v.createdAt,
          gender: v.gender,
          location: [v.city, v.state].filter(Boolean).join(', ') || null,
          isPremium: !!v.isPremium,
          blurred: true,
        })),
      });
    }

    const viewers = await query(
      `SELECT pv.id AS viewId, pv.createdAt AS viewedAt,
              u.id, u.name, u.isPremium, u.isVerified, u.verificationBadge, u.adminVerified,
              p.gender, p.dob, p.religion, p.city, p.state, p.country, p.education, p.profession, p.profileComplete,
              ph.url AS photo
       FROM profileview pv
       JOIN \`user\` u ON u.id = pv.viewerId
       LEFT JOIN profile p ON p.userId = u.id
       LEFT JOIN photo ph ON ph.userId = u.id AND ph.isMain = 1
       WHERE pv.viewedId = ? AND u.isActive = 1
       ORDER BY pv.createdAt DESC LIMIT ? OFFSET ?`,
      [uid, limit, offset]
    );

    return NextResponse.json({
      locked: false,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      viewers: viewers.map(v => ({
        viewId: v.viewId,
        viewedAt: v.viewedAt,
        id: v.id,
        name: v.name,
        isPremium: !!v.isPremium,
        isVerified: !!v.isVerified,
        verificationBadge: !!v.verificationBadge,
        adminVerified: !!v.adminVerified,
        photo: v.photo,
        gender: v.gender,
        dob: v.dob,
        religion: v.religion,
        city: v.city,
        state: v.state,
        country: v.country,
        education: v.education,
        profession: v.profession,
        profileComplete: v.profileComplete,
      })),
    });
  } catch (err) {
    console.error('Flutter profile-views error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
