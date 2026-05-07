import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/flutter-jwt';
import { query, queryOne } from '@/lib/db';

// Helper to build a minimal profile card from a DB row
function buildProfileCard(r) {
  return {
    id: r.u_id,
    name: r.u_name,
    isPremium: !!r.u_isPremium,
    isVerified: !!r.u_isVerified,
    verificationBadge: !!r.u_verificationBadge,
    profile: {
      gender: r.gender,
      dob: r.dob,
      religion: r.religion,
      city: r.city,
      country: r.country,
      education: r.education,
      profession: r.profession,
      profileComplete: r.profileComplete,
    },
    photos: r.photo_url ? [{ url: r.photo_url }] : [],
  };
}

export async function GET(req) {
  const token = getTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

  const uid = decoded.id;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // ── Counts ────────────────────────────────────────────────────────────────
  const [
    interestSentRow,
    interestReceivedRow,
    profileViewRow,
    messagesRow,
    matchesRow,
    todayInterestSentRow,
    todayProfileViewRow,
    todayMessagesRow,
  ] = await Promise.all([
    queryOne('SELECT COUNT(*) AS cnt FROM interest WHERE senderId = ?', [uid]),
    queryOne('SELECT COUNT(*) AS cnt FROM interest WHERE receiverId = ?', [uid]),
    queryOne('SELECT COUNT(*) AS cnt FROM profileview WHERE viewedId = ?', [uid]),
    queryOne(
      `SELECT COUNT(*) AS cnt FROM message
       WHERE chatRoomId IN (SELECT id FROM chatroom WHERE userAId = ? OR userBId = ?)
         AND senderId != ?`,
      [uid, uid, uid]
    ),
    queryOne(
      `SELECT COUNT(*) AS cnt FROM interest
       WHERE senderId = ? AND status = 'ACCEPTED'`,
      [uid]
    ),
    queryOne(
      'SELECT COUNT(*) AS cnt FROM interest WHERE senderId = ? AND createdAt >= ?',
      [uid, todayStart]
    ),
    queryOne(
      'SELECT COUNT(*) AS cnt FROM profileview WHERE viewedId = ? AND createdAt >= ?',
      [uid, todayStart]
    ),
    queryOne(
      `SELECT COUNT(*) AS cnt FROM message
       WHERE chatRoomId IN (SELECT id FROM chatroom WHERE userAId = ? OR userBId = ?)
         AND senderId != ? AND createdAt >= ?`,
      [uid, uid, uid, todayStart]
    ),
  ]);

  // ── New matches today (opposite gender, same religion, joined today) ──────
  const currentUser = await queryOne(
    'SELECT p.gender, p.religion, p.gotra FROM profile p WHERE p.userId = ?',
    [uid]
  );
  const myGender   = currentUser?.gender;
  const myReligion = currentUser?.religion;
  const myGotra    = currentUser?.gotra;
  const oppositeGender = myGender === 'MALE' ? 'FEMALE' : myGender === 'FEMALE' ? 'MALE' : null;

  const newMatchConditions = [
    'u.id != ?', 'u.isActive = 1', 'u.adminVerified = 1',
    'u.createdAt >= ?',
  ];
  const newMatchParams = [uid, todayStart];

  if (oppositeGender) {
    newMatchConditions.push('p.gender = ?');
    newMatchParams.push(oppositeGender);
  }
  if (myReligion) {
    newMatchConditions.push('(p.religion = ? OR p.religion IS NULL)');
    newMatchParams.push(myReligion);
  }
  if (myGotra) {
    newMatchConditions.push('(p.gotra IS NULL OR p.gotra = \'\' OR p.gotra != ?)');
    newMatchParams.push(myGotra);
  }

  const newMatchesToday = await query(
    `SELECT u.id AS u_id, u.name AS u_name, u.isPremium AS u_isPremium,
            u.isVerified AS u_isVerified, u.verificationBadge AS u_verificationBadge,
            p.gender, p.dob, p.religion, p.city, p.country, p.education, p.profession, p.profileComplete,
            ph.url AS photo_url
     FROM \`user\` u
     LEFT JOIN profile p ON p.userId = u.id
     LEFT JOIN photo ph ON ph.userId = u.id AND ph.isMain = 1
     WHERE ${newMatchConditions.join(' AND ')}
     ORDER BY u.createdAt DESC
     LIMIT 10`,
    newMatchParams
  );

  // ── Recommended matches (premium first, then profileComplete, same religion) ─
  const recConditions = [
    'u.id != ?', 'u.isActive = 1', 'u.adminVerified = 1',
  ];
  const recParams = [uid];

  if (oppositeGender) {
    recConditions.push('p.gender = ?');
    recParams.push(oppositeGender);
  }
  if (myReligion) {
    recConditions.push('(p.religion = ? OR p.religion IS NULL)');
    recParams.push(myReligion);
  }
  if (myGotra) {
    recConditions.push('(p.gotra IS NULL OR p.gotra = \'\' OR p.gotra != ?)');
    recParams.push(myGotra);
  }

  const recommendedMatches = await query(
    `SELECT u.id AS u_id, u.name AS u_name, u.isPremium AS u_isPremium,
            u.isVerified AS u_isVerified, u.verificationBadge AS u_verificationBadge,
            p.gender, p.dob, p.religion, p.city, p.country, p.education, p.profession, p.profileComplete,
            ph.url AS photo_url
     FROM \`user\` u
     LEFT JOIN profile p ON p.userId = u.id
     LEFT JOIN photo ph ON ph.userId = u.id AND ph.isMain = 1
     WHERE ${recConditions.join(' AND ')}
     ORDER BY u.isPremium DESC, u.profileBoost DESC, p.profileComplete DESC, u.createdAt DESC
     LIMIT 10`,
    recParams
  );

  // ── Pending interests (received, status = PENDING) ────────────────────────
  const pendingInterests = await query(
    `SELECT u.id AS u_id, u.name AS u_name, u.isPremium AS u_isPremium,
            u.isVerified AS u_isVerified, u.verificationBadge AS u_verificationBadge,
            p.gender, p.dob, p.religion, p.city, p.country, p.education, p.profession, p.profileComplete,
            ph.url AS photo_url,
            i.id AS interest_id, i.message AS interest_message, i.createdAt AS interest_createdAt
     FROM interest i
     JOIN \`user\` u ON u.id = i.senderId
     LEFT JOIN profile p ON p.userId = i.senderId
     LEFT JOIN photo ph ON ph.userId = i.senderId AND ph.isMain = 1
     WHERE i.receiverId = ? AND i.status = 'PENDING'
     ORDER BY i.createdAt DESC
     LIMIT 10`,
    [uid]
  );

  // ── Recent activity (profile views on my profile) ─────────────────────────
  const recentActivity = await query(
    `SELECT u.id AS u_id, u.name AS u_name, u.isPremium AS u_isPremium,
            u.isVerified AS u_isVerified, u.verificationBadge AS u_verificationBadge,
            p.gender, p.dob, p.religion, p.city, p.country, p.education, p.profession, p.profileComplete,
            ph.url AS photo_url,
            pv.createdAt AS viewed_at
     FROM profileview pv
     JOIN \`user\` u ON u.id = pv.viewerId
     LEFT JOIN profile p ON p.userId = pv.viewerId
     LEFT JOIN photo ph ON ph.userId = pv.viewerId AND ph.isMain = 1
     WHERE pv.viewedId = ?
     ORDER BY pv.createdAt DESC
     LIMIT 10`,
    [uid]
  );

  return NextResponse.json({
    counts: {
      interest_sent:        interestSentRow?.cnt     || 0,
      interest_received:    interestReceivedRow?.cnt || 0,
      profile_views:        profileViewRow?.cnt      || 0,
      messages:             messagesRow?.cnt         || 0,
      matches:              matchesRow?.cnt          || 0,
      today_interest_sent:  todayInterestSentRow?.cnt  || 0,
      today_profile_views:  todayProfileViewRow?.cnt   || 0,
      today_messages:       todayMessagesRow?.cnt      || 0,
    },
    new_matches_today: newMatchesToday.map(buildProfileCard),
    recommended_matches: recommendedMatches.map(buildProfileCard),
    pending_interests: pendingInterests.map((r) => ({
      ...buildProfileCard(r),
      interest: {
        id: r.interest_id,
        message: r.interest_message,
        createdAt: r.interest_createdAt,
      },
    })),
    recent_activity: recentActivity.map((r) => ({
      ...buildProfileCard(r),
      viewed_at: r.viewed_at,
    })),
  });
}
