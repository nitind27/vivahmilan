import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/flutter-jwt';
import { query, queryOne, execute } from '@/lib/db';
import { randomUUID } from 'crypto';

const ALLOWED_PROFILE_COLS = new Set([
  'gender','dob','height','weight','religion','caste','subCaste','sect','gotra','motherTongue',
  'education','profession','income','country','state','city','aboutMe',
  'maritalStatus','smoking','drinking','diet','complexion','bodyType',
  'fatherOccupation','motherOccupation','siblings','familyType','familyStatus',
  'partnerAgeMin','partnerAgeMax','partnerHeightMin','partnerHeightMax',
  'partnerReligion','partnerCaste','partnerEducation','partnerProfession',
  'partnerLocation','partnerMaritalStatus','partnerManglik',
  'horoscopeSign','nakshatra','manglik','kundliMatch','amritdhari',
  'hidePhone','hidePhoto',
]);

// All fields that count toward profile completion (25 fields = 4% each)
const COMPLETION_FIELDS = [
  'gender','dob','height','weight','religion','caste','motherTongue',
  'education','profession','income','country','state','city','aboutMe',
  'maritalStatus','diet','complexion','bodyType',
  'fatherOccupation','motherOccupation','siblings','familyType','familyStatus',
  'horoscopeSign','manglik',
];

function calcProfileComplete(profileRow, userName, photos) {
  let filled = 0;
  for (const f of COMPLETION_FIELDS) {
    const v = profileRow?.[f];
    if (v !== null && v !== undefined && v !== '') filled++;
  }
  // Also count: name, at least 1 photo
  if (userName) filled++;
  if (photos && photos.length > 0) filled++;
  const total = COMPLETION_FIELDS.length + 2; // +name +photo
  return Math.round((filled / total) * 100);
}

export async function GET(req) {
  const token = getTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const targetUserId = searchParams.get('userId'); // optional: view another user's profile
  const viewerId = decoded.id;
  const profileUserId = targetUserId || viewerId;

  const user = await queryOne(
    `SELECT id, name, email, phone, isPremium, premiumPlan, premiumExpiry,
            isVerified, verificationBadge, adminVerified, isActive,
            profileBoost, boostExpiry, freeTrialExpiry, lastLoginAt, createdAt
     FROM \`user\` WHERE id = ?`,
    [profileUserId]
  );
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const profile = await queryOne('SELECT * FROM profile WHERE userId = ?', [profileUserId]);
  const photos = await query('SELECT * FROM photo WHERE userId = ? ORDER BY isMain DESC, createdAt ASC', [profileUserId]);
  const familyPhotos = await query('SELECT * FROM family_photo WHERE userId = ? ORDER BY createdAt DESC', [profileUserId]).catch(() => []);

  // Active subscription / premium plan details
  const subscription = await queryOne(
    `SELECT s.id, s.plan, s.status, s.amount, s.currency, s.startDate, s.endDate,
            pc.displayName, pc.permissions, pc.durationDays, pc.description
     FROM subscription s
     LEFT JOIN planconfig pc ON pc.plan = s.plan
     WHERE s.userId = ? AND s.status = 'ACTIVE' AND s.endDate > NOW()
     ORDER BY s.endDate DESC LIMIT 1`,
    [profileUserId]
  );

  let premiumPlanDetails = null;
  if (subscription) {
    premiumPlanDetails = {
      ...subscription,
      permissions: typeof subscription.permissions === 'string'
        ? JSON.parse(subscription.permissions || '[]')
        : (subscription.permissions || []),
    };
  }

  // Recalculate and sync profileComplete
  const computedComplete = calcProfileComplete(profile, user.name, photos);
  if (profile && profile.profileComplete !== computedComplete) {
    await execute('UPDATE profile SET profileComplete = ?, updatedAt = NOW() WHERE userId = ?', [computedComplete, profileUserId]);
    profile.profileComplete = computedComplete;
  }

  // If viewing another user's profile — add interaction flags
  let interactionFlags = {};
  if (targetUserId && targetUserId !== viewerId) {
    // Record profile view
    const alreadyViewed = await queryOne(
      'SELECT id FROM profileview WHERE viewerId = ? AND viewedId = ?',
      [viewerId, targetUserId]
    );
    if (!alreadyViewed) {
      await execute(
        'INSERT INTO profileview (id, viewerId, viewedId, createdAt) VALUES (?, ?, ?, NOW())',
        [randomUUID(), viewerId, targetUserId]
      );
      // Notify the viewed user
      await execute(
        `INSERT INTO notification (id, userId, type, title, message, isRead, link, createdAt)
         VALUES (?, ?, 'PROFILE_VIEWED', 'Profile Viewed', 'Someone viewed your profile', 0, ?, NOW())`,
        [randomUUID(), targetUserId, `/profile/${viewerId}`]
      );
    }

    const [interestSent, interestReceived, isBlocked, isReported, isShortlisted] = await Promise.all([
      queryOne('SELECT id, status FROM interest WHERE senderId = ? AND receiverId = ?', [viewerId, targetUserId]),
      queryOne('SELECT id, status FROM interest WHERE senderId = ? AND receiverId = ?', [targetUserId, viewerId]),
      queryOne('SELECT id FROM block WHERE blockerId = ? AND blockedId = ?', [viewerId, targetUserId]),
      queryOne('SELECT id FROM report WHERE reporterId = ? AND targetId = ?', [viewerId, targetUserId]),
      queryOne('SELECT id FROM shortlist WHERE ownerId = ? AND targetId = ?', [viewerId, targetUserId]),
    ]);

    interactionFlags = {
      interestSent: interestSent ? { id: interestSent.id, status: interestSent.status } : null,
      interestReceived: interestReceived ? { id: interestReceived.id, status: interestReceived.status } : null,
      isBlocked: !!isBlocked,
      isReported: !!isReported,
      isShortlisted: !!isShortlisted,
    };
  }

  return NextResponse.json({
    ...user,
    isPremium: !!user.isPremium,
    isVerified: !!user.isVerified,
    verificationBadge: !!user.verificationBadge,
    adminVerified: !!user.adminVerified,
    profileBoost: !!user.profileBoost,
    profile,
    photos,
    familyPhotos,
    premiumPlanDetails,
    ...interactionFlags,
  });
}

export async function PUT(req) {
  const token = getTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

  const data = await req.json();
  const { name, phone, ...profileData } = data;

  const sanitized = {};
  for (const [key, val] of Object.entries(profileData)) {
    if (!ALLOWED_PROFILE_COLS.has(key)) continue;
    if (val === '' || val === undefined) {
      sanitized[key] = null;
    } else if (key === 'dob') {
      const parsed = new Date(val);
      sanitized[key] = isNaN(parsed.getTime()) ? null : parsed;
    } else if (['height','weight','siblings','partnerAgeMin','partnerAgeMax','partnerHeightMin','partnerHeightMax'].includes(key)) {
      const num = parseInt(val);
      sanitized[key] = isNaN(num) ? null : num;
    } else {
      sanitized[key] = val;
    }
  }

  if (name || phone) {
    await execute(
      'UPDATE `user` SET name = COALESCE(?, name), phone = COALESCE(?, phone), updatedAt = NOW() WHERE id = ?',
      [name || null, phone || null, decoded.id]
    );
  }

  const existing = await queryOne('SELECT id FROM profile WHERE userId = ?', [decoded.id]);
  if (existing) {
    if (Object.keys(sanitized).length > 0) {
      const sets = [...Object.keys(sanitized).map(k => `\`${k}\` = ?`), 'updatedAt = NOW()'].join(', ');
      await execute(`UPDATE profile SET ${sets} WHERE userId = ?`, [...Object.values(sanitized), decoded.id]);
    }
  } else {
    const cols = ['id','userId','maritalStatus','smoking','drinking','hidePhone','hidePhoto','profileComplete','createdAt','updatedAt',...Object.keys(sanitized)];
    const vals = [randomUUID(), decoded.id, 'NEVER_MARRIED','NO','NO',0,0,0,new Date(),new Date(),...Object.values(sanitized)];
    await execute(`INSERT INTO profile (${cols.map(c=>`\`${c}\``).join(',')}) VALUES (${vals.map(()=>'?').join(',')})`, vals);
  }

  // Recalculate profileComplete from DB
  const user = await queryOne('SELECT id, name FROM `user` WHERE id = ?', [decoded.id]);
  const profile = await queryOne('SELECT * FROM profile WHERE userId = ?', [decoded.id]);
  const photos = await query('SELECT * FROM photo WHERE userId = ?', [decoded.id]);
  const profileComplete = calcProfileComplete(profile, user?.name, photos);
  await execute('UPDATE profile SET profileComplete = ?, updatedAt = NOW() WHERE userId = ?', [profileComplete, decoded.id]);
  profile.profileComplete = profileComplete;

  const fullUser = await queryOne(
    `SELECT id, name, email, phone, isPremium, premiumPlan, premiumExpiry,
            isVerified, verificationBadge, adminVerified, isActive, createdAt
     FROM \`user\` WHERE id = ?`,
    [decoded.id]
  );

  const subscription = await queryOne(
    `SELECT s.id, s.plan, s.status, s.amount, s.currency, s.startDate, s.endDate,
            pc.displayName, pc.permissions, pc.durationDays, pc.description
     FROM subscription s
     LEFT JOIN planconfig pc ON pc.plan = s.plan
     WHERE s.userId = ? AND s.status = 'ACTIVE' AND s.endDate > NOW()
     ORDER BY s.endDate DESC LIMIT 1`,
    [decoded.id]
  );

  let premiumPlanDetails = null;
  if (subscription) {
    premiumPlanDetails = {
      ...subscription,
      permissions: typeof subscription.permissions === 'string'
        ? JSON.parse(subscription.permissions || '[]')
        : (subscription.permissions || []),
    };
  }

  return NextResponse.json({ ...fullUser, profile, photos, premiumPlanDetails });
}
