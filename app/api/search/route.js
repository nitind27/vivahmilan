import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query, queryOne } from '@/lib/db';

const FREE_LIMIT = 5;
const GUEST_PAGE_SIZE = 12;

function ageFromDob(dob) {
  if (!dob) return null;
  const born = new Date(dob);
  if (Number.isNaN(born.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const month = now.getMonth() - born.getMonth();
  if (month < 0 || (month === 0 && now.getDate() < born.getDate())) age -= 1;
  return age > 0 && age < 120 ? age : null;
}

/** Logged-out browse: card details are real. Photo stays blurred in the UI. No phone, email, or about text. */
async function publicProfilePreview(searchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const gender = (searchParams.get('gender') || '').toUpperCase();
  const offset = (page - 1) * GUEST_PAGE_SIZE;

  const conditions = ['u.isActive = 1', 'u.adminVerified = 1'];
  const params = [];

  if (gender === 'MALE' || gender === 'FEMALE') {
    conditions.push('p.gender = ?');
    params.push(gender);
  }

  const where = `WHERE ${conditions.join(' AND ')}`;
  const baseSQL = `FROM \`user\` u INNER JOIN profile p ON p.userId = u.id ${where}`;

  const countRow = await queryOne(`SELECT COUNT(*) as cnt ${baseSQL}`, params);
  const total = Number(countRow?.cnt ?? 0);

  const users = await query(
    `SELECT u.id, u.name, u.isPremium, u.verificationBadge,
            p.dob, p.religion, p.education, p.profession, p.city, p.country
     ${baseSQL}
     ORDER BY u.isPremium DESC, u.profileBoost DESC, p.profileComplete DESC, u.createdAt DESC
     LIMIT ? OFFSET ?`,
    [...params, GUEST_PAGE_SIZE, offset]
  );

  const userIds = users.map(u => u.id);
  let photos = [];
  if (userIds.length) {
    photos = await query(
      `SELECT userId, url FROM photo WHERE userId IN (${userIds.map(() => '?').join(',')}) AND isMain = 1`,
      userIds
    );
  }
  const photoMap = Object.fromEntries(photos.map(p => [p.userId, p.url]));

  return NextResponse.json({
    guest: true,
    users: users.map(u => ({
      id: u.id,
      name: u.name,
      guestLocked: true,
      isPremium: !!u.isPremium,
      verificationBadge: !!u.verificationBadge,
      profile: {
        age: ageFromDob(u.dob),
        religion: u.religion || null,
        education: u.education || null,
        profession: u.profession || null,
        city: u.city || null,
        country: u.country || null,
      },
      photos: photoMap[u.id] ? [{ url: photoMap[u.id] }] : [],
    })),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / GUEST_PAGE_SIZE)),
  });
}

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return publicProfilePreview(new URL(req.url).searchParams);

  const { searchParams } = new URL(req.url);
  const page          = parseInt(searchParams.get('page')  || '1');
  const limit         = parseInt(searchParams.get('limit') || '12');
  const offset        = (page - 1) * limit;

  const q             = searchParams.get('q')             || '';
  const gender        = searchParams.get('gender')        || '';
  const religion      = searchParams.get('religion')      || '';
  const country       = searchParams.get('country')       || '';
  const state         = searchParams.get('state')         || '';
  const city          = searchParams.get('city')          || '';
  const education     = searchParams.get('education')     || '';
  const profession    = searchParams.get('profession')    || '';
  const maritalStatus = searchParams.get('maritalStatus') || '';
  const ageMin        = searchParams.get('ageMin')        || '';
  const ageMax        = searchParams.get('ageMax')        || '';
  const heightMin     = searchParams.get('heightMin')     || '';
  const heightMax     = searchParams.get('heightMax')     || '';
  const verifiedOnly  = searchParams.get('verifiedOnly')  === '1' || searchParams.get('verifiedOnly') === 'true';
  const rashi         = searchParams.get('rashi')         || '';
  const nakshatra     = searchParams.get('nakshatra')     || '';
  const manglik       = searchParams.get('manglik')       || '';
  const hasKundali    = searchParams.get('hasKundali')    === '1' || searchParams.get('hasKundali') === 'true';

  // Get current user's profile for religion/gotra/gender filtering
  const currentUser = await queryOne(
    `SELECT u.isPremium, u.freeTrialExpiry, p.religion, p.caste, p.gotra, p.gender
     FROM \`user\` u LEFT JOIN profile p ON p.userId = u.id WHERE u.id = ?`,
    [session.user.id]
  );

  const myReligion = currentUser?.religion;
  const myGotra    = currentUser?.gotra;
  const myGender   = currentUser?.gender; // MALE or FEMALE
  const trialActive = currentUser?.freeTrialExpiry && new Date(currentUser.freeTrialExpiry) > new Date();
  const isPremium   = session.user.isPremium || trialActive;

  // Blocked IDs
  const blocks = await query(
    'SELECT blockerId, blockedId FROM block WHERE blockerId = ? OR blockedId = ?',
    [session.user.id, session.user.id]
  );
  const blockedIds = blocks.map(b => b.blockerId === session.user.id ? b.blockedId : b.blockerId);

  const conditions = ['u.id != ?', 'u.isActive = 1', 'u.adminVerified = 1'];
  const params = [session.user.id];

  if (verifiedOnly) {
    conditions.push('u.verificationBadge = 1');
  }

  if (blockedIds.length) {
    conditions.push(`u.id NOT IN (${blockedIds.map(() => '?').join(',')})`);
    params.push(...blockedIds);
  }

  // ── STRICT GENDER MATCHING ──────────────────────────────────────────────────
  if (myGender) {
    const strictOpposite = myGender.toUpperCase() === 'MALE' ? 'FEMALE' : 'MALE';
    conditions.push('p.gender = ?');
    params.push(strictOpposite);
  } else if (gender) {
    conditions.push('p.gender = ?');
    params.push(gender);
  }

  // ── Same religion only ───────────────────────────────────────────────────────
  if (myReligion) {
    conditions.push('p.religion = ?');
    params.push(myReligion);
  } else if (religion) {
    conditions.push('p.religion = ?');
    params.push(religion);
  }

  // ── Gotra filter ──────────────────────────────────────────────────────────
  if (myGotra && myGotra.trim()) {
    conditions.push('(p.gotra IS NULL OR p.gotra = \'\' OR p.gotra != ?)');
    params.push(myGotra.trim());
  }

  if (q) {
    conditions.push('(u.name LIKE ? OR p.city LIKE ? OR p.profession LIKE ? OR p.country LIKE ?)');
    params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
  }
  
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

  const kundaliJoin = (rashi || nakshatra || manglik || hasKundali)
    ? ' LEFT JOIN kundali k ON k.userId = u.id'
    : '';

  if (hasKundali) {
    conditions.push('k.userId IS NOT NULL');
  }
  if (rashi) {
    conditions.push('k.rashi = ?');
    params.push(rashi);
  }
  if (nakshatra) {
    conditions.push('k.nakshatra = ?');
    params.push(nakshatra);
  }
  if (manglik === '1') {
    conditions.push('k.manglik = 1');
  } else if (manglik === '0') {
    conditions.push('(k.manglik = 0 OR k.manglik IS NULL)');
  }

  const where  = 'WHERE ' + conditions.join(' AND ');
  const baseSQL = `FROM \`user\` u LEFT JOIN profile p ON p.userId = u.id${kundaliJoin} ${where}`;

  const countRow = await queryOne(`SELECT COUNT(*) as cnt ${baseSQL}`, params);
  const total = Number(countRow?.cnt ?? 0);

  const effectiveLimit  = isPremium ? limit  : Math.min(limit, FREE_LIMIT);
  const effectiveOffset = isPremium ? offset : 0;

  const users = await query(
    `SELECT u.id, u.name, u.isPremium, u.verificationBadge, u.createdAt,
            p.gender, p.dob, p.height, p.religion, p.caste, p.gotra, p.education,
            p.profession, p.country, p.state, p.city, p.aboutMe, p.maritalStatus,
            p.profileComplete, p.complexion, p.bodyType, p.motherTongue, p.income
     ${baseSQL}
     ORDER BY u.isPremium DESC, u.profileBoost DESC, p.profileComplete DESC, u.createdAt DESC
     LIMIT ? OFFSET ?`,
    [...params, effectiveLimit, effectiveOffset]
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
      caste: u.caste, gotra: u.gotra, education: u.education, profession: u.profession,
      country: u.country, state: u.state, city: u.city, aboutMe: u.aboutMe,
      maritalStatus: u.maritalStatus, profileComplete: u.profileComplete,
      complexion: u.complexion, bodyType: u.bodyType, motherTongue: u.motherTongue,
      income: u.income,
    },
    photos: photoMap[u.id] ? [photoMap[u.id]] : [],
  }));

  return NextResponse.json({
    users: result,
    total,
    page,
    totalPages: Math.ceil(total / (isPremium ? limit : FREE_LIMIT)),
    isPremium,
    freeLimit: FREE_LIMIT,
    isLimited: !isPremium && total > FREE_LIMIT,
  });
}
