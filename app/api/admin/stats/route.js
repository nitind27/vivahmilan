import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query, queryOne } from '@/lib/db';

function todaySql() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

function monthStartSql() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const days = Math.min(Math.max(parseInt(searchParams.get('days') || '30', 10) || 30, 7), 365);
  const lite = searchParams.get('lite') === '1';
  const since = new Date(Date.now() - days * 86400000);
  const sinceSql = since.toISOString().slice(0, 19).replace('T', ' ');
  const todayStart = todaySql();
  const monthStart = monthStartSql();

  try {
    const [userStats, genderStats, interestStats, subscriptionStats, miscStats] = await Promise.all([
      queryOne(`
        SELECT
          COUNT(*) AS totalUsers,
          SUM(CASE WHEN isPremium = 1 THEN 1 ELSE 0 END) AS premiumUsers,
          SUM(CASE WHEN adminVerified = 0 AND isActive = 1 THEN 1 ELSE 0 END) AS pendingAdminVerify,
          SUM(CASE WHEN isActive = 0 THEN 1 ELSE 0 END) AS blockedUsers,
          SUM(CASE WHEN adminVerified = 1 THEN 1 ELSE 0 END) AS verifiedUsers,
          SUM(CASE WHEN createdAt >= ? THEN 1 ELSE 0 END) AS newUsersToday,
          SUM(CASE WHEN createdAt >= ? THEN 1 ELSE 0 END) AS newUsersMonth,
          SUM(CASE WHEN createdAt >= ? THEN 1 ELSE 0 END) AS newUsersPeriod
        FROM \`user\` WHERE role = 'USER'
      `, [todayStart, monthStart, sinceSql]),

      queryOne(`
        SELECT
          SUM(CASE WHEN p.gender = 'MALE' THEN 1 ELSE 0 END) AS maleUsers,
          SUM(CASE WHEN p.gender = 'FEMALE' THEN 1 ELSE 0 END) AS femaleUsers,
          SUM(CASE WHEN p.gender = 'OTHER' THEN 1 ELSE 0 END) AS otherGenderUsers,
          ROUND(AVG(p.profileComplete)) AS avgProfileComplete
        FROM profile p
        JOIN \`user\` u ON u.id = p.userId
        WHERE u.role = 'USER'
      `),

      queryOne(`
        SELECT
          COUNT(*) AS totalInterests,
          SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) AS interestsPending,
          SUM(CASE WHEN status = 'ACCEPTED' THEN 1 ELSE 0 END) AS interestsAccepted,
          SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) AS interestsRejected,
          SUM(CASE WHEN createdAt >= ? THEN 1 ELSE 0 END) AS newInterestsToday
        FROM interest
      `, [todayStart]),

      queryOne(`
        SELECT
          COUNT(*) AS totalSubscriptions,
          SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) AS activeSubscriptions,
          SUM(CASE WHEN status = 'EXPIRED' THEN 1 ELSE 0 END) AS subscriptionsExpired,
          SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) AS subscriptionsCancelled,
          SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) AS subscriptionsPending,
          COALESCE(SUM(CASE WHEN status IN ('ACTIVE','EXPIRED') THEN amount ELSE 0 END), 0) AS totalRevenue,
          COALESCE(SUM(CASE WHEN createdAt >= ? THEN amount ELSE 0 END), 0) AS periodRevenue
        FROM subscription
      `, [sinceSql]),

      queryOne(`
        SELECT
          (SELECT COUNT(*) FROM message) AS totalMessages,
          (SELECT COUNT(*) FROM message WHERE createdAt >= ?) AS newMessagesToday,
          (SELECT COUNT(*) FROM chatroom) AS totalChats,
          (SELECT COUNT(*) FROM profileview) AS totalProfileViews,
          (SELECT COUNT(*) FROM shortlist) AS totalShortlists,
          (SELECT COUNT(*) FROM document WHERE status = 'PENDING') AS pendingVerifications,
          (SELECT COUNT(*) FROM document WHERE status = 'APPROVED') AS documentsApproved,
          (SELECT COUNT(*) FROM document WHERE status = 'REJECTED') AS documentsRejected,
          (SELECT COUNT(*) FROM report WHERE status = 'PENDING') AS pendingReports,
          (SELECT COUNT(*) FROM report WHERE status = 'REVIEWED') AS reportsReviewed,
          (SELECT COUNT(*) FROM report WHERE status = 'RESOLVED') AS reportsResolved,
          (SELECT COUNT(*) FROM support_session WHERE status = 'live') AS supportLiveSessions,
          (SELECT COUNT(*) FROM support_session ss WHERE ss.status = 'live' AND (
            SELECT m.sender FROM support_message m WHERE m.sessionId = ss.id ORDER BY m.createdAt DESC LIMIT 1
          ) = 'user') AS pendingSupportLive
      `, [todayStart]),
    ]);

    const totalUsers = Number(userStats?.totalUsers || 0);
    const premiumUsers = Number(userStats?.premiumUsers || 0);

    const payload = {
      totalUsers,
      premiumUsers,
      pendingVerifications: Number(miscStats?.pendingVerifications || 0),
      pendingReports: Number(miscStats?.pendingReports || 0),
      totalMessages: Number(miscStats?.totalMessages || 0),
      newUsersToday: Number(userStats?.newUsersToday || 0),
      newUsersMonth: Number(userStats?.newUsersMonth || 0),
      pendingAdminVerify: Number(userStats?.pendingAdminVerify || 0),
      pendingSupportLive: Number(miscStats?.pendingSupportLive || 0),
      supportLiveSessions: Number(miscStats?.supportLiveSessions || 0),
      totalSubscriptions: Number(subscriptionStats?.totalSubscriptions || 0),
      activeSubscriptions: Number(subscriptionStats?.activeSubscriptions || 0),
      totalInterests: Number(interestStats?.totalInterests || 0),
      totalChats: Number(miscStats?.totalChats || 0),
      maleUsers: Number(genderStats?.maleUsers || 0),
      femaleUsers: Number(genderStats?.femaleUsers || 0),
      otherGenderUsers: Number(genderStats?.otherGenderUsers || 0),
      blockedUsers: Number(userStats?.blockedUsers || 0),
      verifiedUsers: Number(userStats?.verifiedUsers || 0),
      freeUsers: totalUsers - premiumUsers,
      totalProfileViews: Number(miscStats?.totalProfileViews || 0),
      totalShortlists: Number(miscStats?.totalShortlists || 0),
      interestsPending: Number(interestStats?.interestsPending || 0),
      interestsAccepted: Number(interestStats?.interestsAccepted || 0),
      interestsRejected: Number(interestStats?.interestsRejected || 0),
      newInterestsToday: Number(interestStats?.newInterestsToday || 0),
      newMessagesToday: Number(miscStats?.newMessagesToday || 0),
      newUsersPeriod: Number(userStats?.newUsersPeriod || 0),
      documentsApproved: Number(miscStats?.documentsApproved || 0),
      documentsRejected: Number(miscStats?.documentsRejected || 0),
      reportsReviewed: Number(miscStats?.reportsReviewed || 0),
      reportsResolved: Number(miscStats?.reportsResolved || 0),
      subscriptionsExpired: Number(subscriptionStats?.subscriptionsExpired || 0),
      subscriptionsCancelled: Number(subscriptionStats?.subscriptionsCancelled || 0),
      subscriptionsPending: Number(subscriptionStats?.subscriptionsPending || 0),
      premiumRate: totalUsers > 0 ? Math.round((premiumUsers / totalUsers) * 100) : 0,
      verifyRate: totalUsers > 0 ? Math.round((Number(userStats?.verifiedUsers || 0) / totalUsers) * 100) : 0,
      avgProfileComplete: Number(genderStats?.avgProfileComplete || 0),
      totalRevenue: Number(subscriptionStats?.totalRevenue || 0),
      periodRevenue: Number(subscriptionStats?.periodRevenue || 0),
      filterDays: days,
    };

    if (lite) {
      return NextResponse.json({
        ...payload,
        dailyRegistrations: [],
        dailyInterests: [],
        topCities: [],
        topStates: [],
        topReligions: [],
        subscriptionByPlan: [],
        recentUsers: [],
      });
    }

    const [
      dailyRegistrations,
      dailyInterests,
      topCities,
      topStates,
      topReligions,
      subscriptionByPlan,
      recentUsers,
    ] = await Promise.all([
      query(
        `SELECT DATE(createdAt) AS date, COUNT(*) AS cnt
         FROM \`user\` WHERE role = 'USER' AND createdAt >= ?
         GROUP BY DATE(createdAt) ORDER BY date ASC`,
        [sinceSql]
      ),
      query(
        `SELECT DATE(createdAt) AS date, COUNT(*) AS cnt
         FROM interest WHERE createdAt >= ?
         GROUP BY DATE(createdAt) ORDER BY date ASC`,
        [sinceSql]
      ),
      query(
        `SELECT p.city, p.state, COUNT(*) AS cnt
         FROM profile p JOIN \`user\` u ON u.id = p.userId
         WHERE u.role = 'USER' AND p.city IS NOT NULL AND p.city != ''
         GROUP BY p.city, p.state ORDER BY cnt DESC LIMIT 10`
      ),
      query(
        `SELECT p.state, COUNT(*) AS cnt
         FROM profile p JOIN \`user\` u ON u.id = p.userId
         WHERE u.role = 'USER' AND p.state IS NOT NULL AND p.state != ''
         GROUP BY p.state ORDER BY cnt DESC LIMIT 10`
      ),
      query(
        `SELECT p.religion, COUNT(*) AS cnt
         FROM profile p JOIN \`user\` u ON u.id = p.userId
         WHERE u.role = 'USER' AND p.religion IS NOT NULL AND p.religion != ''
         GROUP BY p.religion ORDER BY cnt DESC LIMIT 8`
      ),
      query(
        `SELECT plan, COUNT(*) AS cnt, SUM(amount) AS revenue
         FROM subscription GROUP BY plan ORDER BY cnt DESC LIMIT 6`
      ),
      query(
        `SELECT u.id, u.name, u.email, u.phone, u.createdAt, u.isPremium, u.adminVerified, u.isActive,
                p.gender, p.city, p.state, p.profileComplete, ph.url AS photo
         FROM \`user\` u
         LEFT JOIN profile p ON p.userId = u.id
         LEFT JOIN photo ph ON ph.userId = u.id AND ph.isMain = 1
         WHERE u.role = 'USER'
         ORDER BY u.createdAt DESC LIMIT 15`
      ),
    ]);

    return NextResponse.json({
      ...payload,
      dailyRegistrations,
      dailyInterests,
      topCities,
      topStates,
      topReligions,
      subscriptionByPlan,
      recentUsers,
    });
  } catch (err) {
    console.error('Stats API error:', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
