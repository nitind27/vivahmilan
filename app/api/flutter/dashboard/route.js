import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/flutter-jwt';
import { query, queryOne } from '@/lib/db';

// Bulk fetch interaction flags for a list of userIds
async function getInteractionMaps(viewerId, userIds) {
  if (!userIds.length) return { interestMap: {}, shortlistSet: new Set(), blockSet: new Set() };

  const ph = userIds.map(() => '?').join(',');
  const [interests, shortlists, blocks] = await Promise.all([
    query(
      `SELECT id, receiverId, status FROM interest WHERE senderId = ? AND receiverId IN (${ph})`,
      [viewerId, ...userIds]
    ),
    query(
      `SELECT targetId FROM shortlist WHERE ownerId = ? AND targetId IN (${ph})`,
      [viewerId, ...userIds]
    ),
    query(
      `SELECT blockedId FROM block WHERE blockerId = ? AND blockedId IN (${ph})`,
      [viewerId, ...userIds]
    ),
  ]);

  return {
    interestMap:  Object.fromEntries(interests.map(i => [i.receiverId, { id: i.id, status: i.status }])),
    shortlistSet: new Set(shortlists.map(s => s.targetId)),
    blockSet:     new Set(blocks.map(b => b.blockedId)),
  };
}

// Build profile card with interaction flags
function buildProfileCard(r, interestMap, shortlistSet, blockSet) {
  return {
    id:               r.u_id,
    name:             r.u_name,
    isPremium:        !!r.u_isPremium,
    isVerified:       !!r.u_isVerified,
    verificationBadge:!!r.u_verificationBadge,
    profile: {
      gender:          r.gender,
      dob:             r.dob,
      religion:        r.religion,
      city:            r.city,
      country:         r.country,
      education:       r.education,
      profession:      r.profession,
      profileComplete: r.profileComplete,
    },
    photos:        r.photo_url ? [{ url: r.photo_url }] : [],
    interestSent:  interestMap[r.u_id]    || null,
    isShortlisted: shortlistSet.has(r.u_id),
    isBlocked:     blockSet.has(r.u_id),
  };
}

export async function GET(req) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

    const uid = decoded.id;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // ── Counts ──────────────────────────────────────────────────────────────
    const [
      interestSentRow, interestReceivedRow, profileViewRow,
      messagesRow, matchesRow,
      todayInterestSentRow, todayProfileViewRow, todayMessagesRow,
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
      queryOne(`SELECT COUNT(*) AS cnt FROM interest WHERE senderId = ? AND status = 'ACCEPTED'`, [uid]),
      queryOne('SELECT COUNT(*) AS cnt FROM interest WHERE senderId = ? AND createdAt >= ?', [uid, todayStart]),
      queryOne('SELECT COUNT(*) AS cnt FROM profileview WHERE viewedId = ? AND createdAt >= ?', [uid, todayStart]),
      queryOne(
        `SELECT COUNT(*) AS cnt FROM message
         WHERE chatRoomId IN (SELECT id FROM chatroom WHERE userAId = ? OR userBId = ?)
           AND senderId != ? AND createdAt >= ?`,
        [uid, uid, uid, todayStart]
      ),
    ]);

    // ── Current user profile for match filtering ─────────────────────────────
    const currentUser = await queryOne(
      'SELECT p.gender, p.religion, p.gotra FROM profile p WHERE p.userId = ?',
      [uid]
    );
    const myGender       = currentUser?.gender;
    const myReligion     = currentUser?.religion;
    const myGotra        = currentUser?.gotra;
    const oppositeGender = myGender === 'MALE' ? 'FEMALE' : myGender === 'FEMALE' ? 'MALE' : null;

    // ── New matches today ────────────────────────────────────────────────────
    const newMatchConds  = ['u.id != ?', 'u.isActive = 1', 'u.adminVerified = 1', 'u.createdAt >= ?'];
    const newMatchParams = [uid, todayStart];
    if (oppositeGender) { newMatchConds.push('p.gender = ?');                              newMatchParams.push(oppositeGender); }
    if (myReligion)     { newMatchConds.push('(p.religion = ? OR p.religion IS NULL)');    newMatchParams.push(myReligion); }
    if (myGotra)        { newMatchConds.push("(p.gotra IS NULL OR p.gotra = '' OR p.gotra != ?)"); newMatchParams.push(myGotra); }

    const newMatchesToday = await query(
      `SELECT u.id AS u_id, u.name AS u_name, u.isPremium AS u_isPremium,
              u.isVerified AS u_isVerified, u.verificationBadge AS u_verificationBadge,
              p.gender, p.dob, p.religion, p.city, p.country, p.education, p.profession, p.profileComplete,
              ph.url AS photo_url
       FROM \`user\` u
       LEFT JOIN profile p ON p.userId = u.id
       LEFT JOIN photo ph ON ph.userId = u.id AND ph.isMain = 1
       WHERE ${newMatchConds.join(' AND ')}
       ORDER BY u.createdAt DESC LIMIT 10`,
      newMatchParams
    );

    // ── Recommended matches ──────────────────────────────────────────────────
    const recConds  = ['u.id != ?', 'u.isActive = 1', 'u.adminVerified = 1'];
    const recParams = [uid];
    if (oppositeGender) { recConds.push('p.gender = ?');                              recParams.push(oppositeGender); }
    if (myReligion)     { recConds.push('(p.religion = ? OR p.religion IS NULL)');    recParams.push(myReligion); }
    if (myGotra)        { recConds.push("(p.gotra IS NULL OR p.gotra = '' OR p.gotra != ?)"); recParams.push(myGotra); }

    const recommendedMatches = await query(
      `SELECT u.id AS u_id, u.name AS u_name, u.isPremium AS u_isPremium,
              u.isVerified AS u_isVerified, u.verificationBadge AS u_verificationBadge,
              p.gender, p.dob, p.religion, p.city, p.country, p.education, p.profession, p.profileComplete,
              ph.url AS photo_url
       FROM \`user\` u
       LEFT JOIN profile p ON p.userId = u.id
       LEFT JOIN photo ph ON ph.userId = u.id AND ph.isMain = 1
       WHERE ${recConds.join(' AND ')}
       ORDER BY u.isPremium DESC, u.profileBoost DESC, p.profileComplete DESC, u.createdAt DESC
       LIMIT 10`,
      recParams
    );

    // ── Pending interests (received, PENDING) ────────────────────────────────
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
       ORDER BY i.createdAt DESC LIMIT 10`,
      [uid]
    );

    // ── Recent activity — notifications ──────────────────────────────────────
    const recentActivity = await query(
      `SELECT n.id, n.type, n.title, n.message AS notif_message,
              n.isRead, n.link, n.createdAt
       FROM notification n
       WHERE n.userId = ?
       ORDER BY n.createdAt DESC
       LIMIT 20`,
      [uid]
    );

    // ── Bulk interaction flags for all profile lists ─────────────────────────
    const allProfileIds = [
      ...newMatchesToday.map(r => r.u_id),
      ...recommendedMatches.map(r => r.u_id),
      ...pendingInterests.map(r => r.u_id),
    ];
    const uniqueIds = [...new Set(allProfileIds)];
    const { interestMap, shortlistSet, blockSet } = await getInteractionMaps(uid, uniqueIds);

    return NextResponse.json({
      counts: {
        interest_sent:       Number(interestSentRow?.cnt)       || 0,
        interest_received:   Number(interestReceivedRow?.cnt)   || 0,
        profile_views:       Number(profileViewRow?.cnt)        || 0,
        messages:            Number(messagesRow?.cnt)           || 0,
        matches:             Number(matchesRow?.cnt)            || 0,
        today_interest_sent: Number(todayInterestSentRow?.cnt)  || 0,
        today_profile_views: Number(todayProfileViewRow?.cnt)   || 0,
        today_messages:      Number(todayMessagesRow?.cnt)      || 0,
      },
      new_matches_today: newMatchesToday.map(r =>
        buildProfileCard(r, interestMap, shortlistSet, blockSet)
      ),
      recommended_matches: recommendedMatches.map(r =>
        buildProfileCard(r, interestMap, shortlistSet, blockSet)
      ),
      pending_interests: pendingInterests.map(r => ({
        ...buildProfileCard(r, interestMap, shortlistSet, blockSet),
        interest: {
          id:        r.interest_id,
          message:   r.interest_message,
          createdAt: r.interest_createdAt,
        },
      })),
      // Recent activity = notifications (not profile cards)
      recent_activity: recentActivity.map(n => ({
        id:        n.id,
        type:      n.type,
        title:     n.title,
        message:   n.notif_message,
        isRead:    !!n.isRead,
        link:      n.link,
        createdAt: n.createdAt,
      })),
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
