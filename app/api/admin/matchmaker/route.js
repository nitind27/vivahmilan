import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query, queryOne } from '@/lib/db';

// GET /api/admin/matchmaker?phone=xxx  — lookup user by phone
// GET /api/admin/matchmaker?userId=xxx&limit=20  — find matches for user
export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const phone  = searchParams.get('phone');
  const userId = searchParams.get('userId');
  const limit  = parseInt(searchParams.get('limit') || '20');

  // ── Lookup by phone ──────────────────────────────────────────────────────
  if (phone) {
    const clean = phone.replace(/\s+/g, '').replace(/^0+/, '');
    const user = await queryOne(
      `SELECT u.*, p.gender, p.dob, p.religion, p.caste, p.motherTongue,
              p.city, p.state, p.country, p.education, p.profession, p.income,
              p.maritalStatus, p.height, p.weight, p.aboutMe, p.familyType,
              p.familyStatus, p.fatherOccupation, p.motherOccupation, p.siblings,
              p.smoking, p.drinking, p.diet, p.complexion, p.bodyType,
              p.partnerAgeMin, p.partnerAgeMax, p.partnerReligion, p.partnerLocation,
              p.horoscopeSign, p.nakshatra, p.manglik, p.profileComplete,
              ph.url AS mainPhoto
       FROM \`user\` u
       LEFT JOIN profile p ON p.userId = u.id
       LEFT JOIN photo ph ON ph.userId = u.id AND ph.isMain = 1
       WHERE u.phone LIKE ? OR u.phone LIKE ?
       LIMIT 1`,
      [`%${clean}`, `%${phone.trim()}`]
    );
    if (!user) return NextResponse.json({ error: 'No user found with this phone number' }, { status: 404 });

    // Get all photos
    const photos = await query('SELECT url FROM photo WHERE userId = ? ORDER BY isMain DESC', [user.id]);
    // Get documents
    const docs = await query('SELECT id, type, status, url FROM document WHERE userId = ? ORDER BY createdAt DESC', [user.id]);

    return NextResponse.json({ user: { ...user, photos, documents: docs } });
  }

  // ── Find matches for userId ──────────────────────────────────────────────
  if (userId) {
    const me = await queryOne(
      `SELECT u.id, p.gender, p.religion, p.caste, p.city, p.state, p.country,
              p.dob, p.partnerAgeMin, p.partnerAgeMax, p.partnerReligion, p.partnerLocation,
              p.maritalStatus, p.motherTongue
       FROM \`user\` u
       LEFT JOIN profile p ON p.userId = u.id
       WHERE u.id = ?`,
      [userId]
    );
    if (!me) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const oppositeGender = me.gender === 'MALE' ? 'FEMALE' : 'MALE';
    const myAge = me.dob ? Math.floor((Date.now() - new Date(me.dob)) / 31557600000) : null;

    // Build smart match query — same religion/caste preferred, same area preferred
    const matches = await query(
      `SELECT
         u.id, u.name, u.email, u.phone, u.isPremium, u.isVerified, u.adminVerified,
         u.createdAt,
         p.gender, p.dob, p.religion, p.caste, p.motherTongue,
         p.city, p.state, p.country, p.education, p.profession, p.income,
         p.maritalStatus, p.height, p.complexion, p.aboutMe, p.profileComplete,
         ph.url AS mainPhoto,
         -- Score: higher = better match
         (
           CASE WHEN p.religion = ? THEN 30 ELSE 0 END +
           CASE WHEN p.caste = ? THEN 25 ELSE 0 END +
           CASE WHEN p.motherTongue = ? THEN 10 ELSE 0 END +
           CASE WHEN p.city = ? THEN 20 ELSE 0 END +
           CASE WHEN p.state = ? THEN 10 ELSE 0 END +
           CASE WHEN p.country = ? THEN 5 ELSE 0 END +
           CASE WHEN p.maritalStatus = 'NEVER_MARRIED' THEN 10 ELSE 0 END +
           CASE WHEN u.adminVerified = 1 THEN 5 ELSE 0 END +
           CASE WHEN p.profileComplete >= 70 THEN 10 ELSE 0 END
         ) AS matchScore
       FROM \`user\` u
       LEFT JOIN profile p ON p.userId = u.id
       LEFT JOIN photo ph ON ph.userId = u.id AND ph.isMain = 1
       WHERE u.role = 'USER'
         AND u.isActive = 1
         AND u.id != ?
         AND p.gender = ?
       ORDER BY matchScore DESC, p.profileComplete DESC
       LIMIT ?`,
      [
        me.religion || '', me.caste || '', me.motherTongue || '',
        me.city || '', me.state || '', me.country || '',
        userId, oppositeGender, limit,
      ]
    );

    return NextResponse.json({ matches, me });
  }

  return NextResponse.json({ error: 'Provide phone or userId' }, { status: 400 });
}
