import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query } from '@/lib/db';

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 20);

  const rows = await query(
    `SELECT u.id, u.name, u.isPremium, u.verificationBadge,
            p.gender, p.dob, p.city, p.state, p.profession, p.education, p.profileComplete,
            pv.createdAt AS viewedAt
     FROM profileview pv
     JOIN \`user\` u ON u.id = pv.viewedId
     LEFT JOIN profile p ON p.userId = u.id
     WHERE pv.viewerId = ? AND u.isActive = 1
     ORDER BY pv.createdAt DESC
     LIMIT ?`,
    [session.user.id, limit * 3]
  );

  const seen = new Set();
  const users = [];
  for (const r of rows) {
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    users.push({
      id: r.id,
      name: r.name,
      isPremium: !!r.isPremium,
      verificationBadge: !!r.verificationBadge,
      viewedAt: r.viewedAt,
      profile: {
        gender: r.gender,
        dob: r.dob,
        city: r.city,
        state: r.state,
        profession: r.profession,
        education: r.education,
        profileComplete: r.profileComplete,
      },
    });
    if (users.length >= limit) break;
  }

  const ids = users.map(u => u.id);
  let photos = [];
  if (ids.length) {
    photos = await query(
      `SELECT userId, url FROM photo WHERE userId IN (${ids.map(() => '?').join(',')}) AND isMain = 1`,
      ids
    );
  }
  const photoMap = Object.fromEntries(photos.map(p => [p.userId, p.url]));

  return NextResponse.json({
    users: users.map(u => ({
      ...u,
      photos: photoMap[u.id] ? [{ url: photoMap[u.id], isMain: true }] : [],
    })),
  });
}
