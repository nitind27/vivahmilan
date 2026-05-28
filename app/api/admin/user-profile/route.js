import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query, queryOne } from '@/lib/db';
import { getUserGeoLogs } from '@/lib/geoTracking';
import { getApprovalChecklist } from '@/lib/profileVerification';

function calcAge(dob) {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob)) / 31557600000);
}

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

  const user = await queryOne('SELECT * FROM `user` WHERE id = ?', [userId]);
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [
    profile,
    photos,
    documents,
    familyPhotos,
    subscriptions,
    geoLogs,
    statsRows,
    recentInterests,
  ] = await Promise.all([
    queryOne('SELECT * FROM profile WHERE userId = ?', [userId]),
    query('SELECT * FROM photo WHERE userId = ? ORDER BY isMain DESC, createdAt DESC', [userId]),
    query('SELECT * FROM document WHERE userId = ? ORDER BY createdAt DESC', [userId]),
    query('SELECT * FROM family_photo WHERE userId = ? ORDER BY createdAt DESC', [userId]).catch(() => []),
    query(
      `SELECT s.*, pc.displayName AS planDisplayName
       FROM subscription s
       LEFT JOIN planconfig pc ON pc.plan = s.plan
       WHERE s.userId = ?
       ORDER BY s.createdAt DESC`,
      [userId]
    ),
    getUserGeoLogs(userId, 50),
    queryOne(
      `SELECT
         (SELECT COUNT(*) FROM interest WHERE senderId = ?) AS interestsSent,
         (SELECT COUNT(*) FROM interest WHERE receiverId = ?) AS interestsReceived,
         (SELECT COUNT(*) FROM interest WHERE senderId = ? AND status = 'ACCEPTED') AS interestsSentAccepted,
         (SELECT COUNT(*) FROM interest WHERE receiverId = ? AND status = 'ACCEPTED') AS interestsReceivedAccepted,
         (SELECT COUNT(*) FROM interest WHERE senderId = ? AND status = 'PENDING') AS interestsSentPending,
         (SELECT COUNT(*) FROM interest WHERE receiverId = ? AND status = 'PENDING') AS interestsReceivedPending,
         (SELECT COUNT(*) FROM message WHERE senderId = ?) AS messagesSent,
         (SELECT COUNT(*) FROM message WHERE receiverId = ?) AS messagesReceived,
         (SELECT COUNT(*) FROM profileview WHERE viewerId = ?) AS profileViews,
         (SELECT COUNT(*) FROM profileview WHERE viewedId = ?) AS profileViewedBy,
         (SELECT COUNT(*) FROM shortlist WHERE ownerId = ?) AS shortlisted,
         (SELECT COUNT(*) FROM shortlist WHERE targetId = ?) AS shortlistedBy,
         (SELECT COUNT(*) FROM report WHERE reporterId = ?) AS reportsMade,
         (SELECT COUNT(*) FROM report WHERE targetId = ?) AS reportsReceived,
         (SELECT COUNT(*) FROM block WHERE blockerId = ?) AS blockedUsers,
         (SELECT COUNT(*) FROM block WHERE blockedId = ?) AS blockedBy`,
      Array(16).fill(userId)
    ),
    query(
      `SELECT i.id, i.status, i.message, i.createdAt, i.senderId, i.receiverId,
              CASE WHEN i.senderId = ? THEN 'sent' ELSE 'received' END AS direction,
              u.name AS otherName, u.email AS otherEmail, u.phone AS otherPhone
       FROM interest i
       JOIN \`user\` u ON u.id = CASE WHEN i.senderId = ? THEN i.receiverId ELSE i.senderId END
       WHERE i.senderId = ? OR i.receiverId = ?
       ORDER BY i.createdAt DESC
       LIMIT 30`,
      [userId, userId, userId, userId]
    ),
  ]);

  const mainPhoto = photos.find(p => p.isMain) || photos[0];
  const activeSubscription =
    subscriptions.find(s => s.status === 'ACTIVE' && new Date(s.endDate) >= new Date()) ||
    subscriptions.find(s => s.status === 'ACTIVE') ||
    null;

  const premiumPlanConfig = user.premiumPlan
    ? await queryOne('SELECT displayName, price, durationDays FROM planconfig WHERE plan = ?', [user.premiumPlan])
    : null;

  const profileWithAge = profile
    ? { ...profile, age: calcAge(profile.dob), bio: profile.aboutMe, occupation: profile.profession }
    : null;

  const approvalChecklist = await getApprovalChecklist(userId);

  return NextResponse.json({
    user: {
      ...user,
      photo: mainPhoto?.url || user.image || null,
      isBanned: !user.isActive,
    },
    profile: profileWithAge,
    photos,
    documents,
    familyPhotos,
    subscriptions,
    activeSubscription,
    premiumPlanConfig,
    interests: recentInterests,
    stats: statsRows || {},
    geoLogs,
    approvalChecklist,
  });
}
