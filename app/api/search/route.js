import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query, queryOne } from '@/lib/db';

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page   = parseInt(searchParams.get('page')  || '1');
  const limit  = parseInt(searchParams.get('limit') || '12');
  const offset = (page - 1) * limit;

  const q            = searchParams.get('q')            || '';
  const gender       = searchParams.get('gender')       || '';
  const religion     = searchParams.get('religion')     || '';
  const country      = searchParams.get('country')      || '';
  const state        = searchParams.get('state')        || '';
  const city         = searchParams.get('city')         || '';
  const education    = searchParams.get('education')    || '';
  const profession   = searchParams.get('profession')   || '';
  const maritalStatus = searchParams.get('maritalStatus') || '';
  const ageMin       = searchParams.get('ageMin')       || '';
  const ageMax       = searchParams.get('ageMax')       || '';
  const heightMin    = searchParams.get('heightMin')    || '';
  const heightMax    = searchParams.get('heightMax')    || '';

  // Blocked IDs
  const blocks = await query(
    'SELECT blockerId, blockedId FROM block WHERE blockerId = ? OR blockedId = ?',
    [session.user.id, session.user.id]
  );
  const blockedIds = blocks.map(b => b.blockerId === session.user.id ? b.blockedId : b.blockerId);

  const conditions = ['u.id != ?', 'u.isActive = 1'];
  const params = [session.user.id];

  if (blockedIds.length) {
    conditions.push(`u.id NOT IN (${blockedIds.map(() => '?').join(',')})`);
    params.push(...blockedIds);
  }
  if (q) {
    conditions.push('(u.name LIKE ? OR p.city LIKE ? OR p.profession LIKE ? OR p.religion LIKE ? OR p.country LIKE ?)');
    params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (gender)       { conditions.push('p.gender = ?'); params.push(gender); }
  if (religion)     { conditions.push('p.religion = ?'); params.push(religion); }
  if (country)      { conditions.push('p.country = ?'); params.push(country); }
  if (state)        { conditions.push('p.state LIKE ?'); params.push(`%${state}%`); }
  if (city)         { conditions.push('p.city LIKE ?'); params.push(`%${city}%`); }
  if (education)    { conditions.push('p.education = ?'); params.push(education); }
  if (profession)   { conditions.push('p.profession LIKE ?'); params.push(`%${profession}%`); }
  if (maritalStatus){ conditions.push('p.maritalStatus = ?'); params.push(maritalStatus); }
  if (heightMin)    { conditions.push('p.height >= ?'); params.push(parseInt(heightMin)); }
  if (heightMax)    { conditions.push('p.height <= ?'); params.push(parseInt(heightMax)); }

  const now = new Date();
  if (ageMin) {
    const dobMax = new Date(now.getFullYear() - parseInt(ageMin), now.getMonth(), now.getDate());
    conditions.push('p.dob <= ?'); params.push(dobMax);
  }
  if (ageMax) {
    const dobMin = new Date(now.getFullYear() - parseInt(ageMax), now.getMonth(), now.getDate());
    conditions.push('p.dob >= ?'); params.push(dobMin);
  }

  const where = 'WHERE ' + conditions.join(' AND ');
  const baseSQL = `FROM \`user\` u LEFT JOIN profile p ON p.userId = u.id ${where}`;

  const countRow = await queryOne(`SELECT COUNT(*) as cnt ${baseSQL}`, params);
  const total = Number(countRow?.cnt ?? 0);

  const users = await query(
    `SELECT u.*, p.gender, p.dob, p.height, p.religion, p.caste, p.education, p.profession,
            p.country, p.state, p.city, p.aboutMe, p.maritalStatus, p.profileComplete,
            p.complexion, p.bodyType, p.motherTongue, p.income
     ${baseSQL}
     ORDER BY u.isPremium DESC, u.profileBoost DESC, u.createdAt DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const userIds = users.map(u => u.id);
  let photos = [];
  if (userIds.length) {
    photos = await query(
      `SELECT * FROM photo WHERE userId IN (${userIds.map(() => '?').join(',')}) AND isMain = 1`,
      userIds
    );
  }
  const photoMap = Object.fromEntries(photos.map(p => [p.userId, p]));

  const result = users.map(u => ({
    ...u,
    profile: {
      gender: u.gender, dob: u.dob, height: u.height, religion: u.religion,
      caste: u.caste, education: u.education, profession: u.profession,
      country: u.country, state: u.state, city: u.city, aboutMe: u.aboutMe,
      maritalStatus: u.maritalStatus, profileComplete: u.profileComplete,
      complexion: u.complexion, bodyType: u.bodyType, motherTongue: u.motherTongue,
      income: u.income,
    },
    photos: photoMap[u.id] ? [photoMap[u.id]] : [],
  }));

  return NextResponse.json({ users: result, total, page, totalPages: Math.ceil(total / limit) });
}
