import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query } from '@/lib/db';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const [totals, byPlan, daily, activeCount, recentSubs, topReferrers] = await Promise.all([
    query(`SELECT
      COALESCE(SUM(amount), 0) AS totalRevenue,
      COUNT(*) AS totalOrders,
      COALESCE(SUM(CASE WHEN createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN amount ELSE 0 END), 0) AS revenue30d,
      COALESCE(SUM(CASE WHEN createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN amount ELSE 0 END), 0) AS revenue7d
     FROM subscription WHERE status IN ('ACTIVE','EXPIRED')`),
    query(`SELECT plan, COUNT(*) AS orders, COALESCE(SUM(amount), 0) AS revenue
           FROM subscription WHERE status IN ('ACTIVE','EXPIRED')
           GROUP BY plan ORDER BY revenue DESC`),
    query(`SELECT DATE(createdAt) AS day, COUNT(*) AS orders, COALESCE(SUM(amount), 0) AS revenue
           FROM subscription WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
           GROUP BY DATE(createdAt) ORDER BY day ASC`),
    query(`SELECT COUNT(*) AS cnt FROM subscription WHERE status = 'ACTIVE' AND endDate > NOW()`),
    query(`SELECT s.id, s.plan, s.amount, s.status, s.createdAt, u.name, u.email
           FROM subscription s JOIN \`user\` u ON u.id = s.userId
           ORDER BY s.createdAt DESC LIMIT 20`),
    query(`SELECT ur.referralCode, ur.totalReferrals, u.id, u.name, u.email, u.createdAt
           FROM userreferral ur JOIN \`user\` u ON u.id = ur.userId
           WHERE ur.totalReferrals > 0 ORDER BY ur.totalReferrals DESC LIMIT 10`),
  ]);

  const t = totals[0] || {};
  const expired30 = await query(
    `SELECT COUNT(*) AS cnt FROM subscription WHERE status = 'EXPIRED' AND endDate >= DATE_SUB(NOW(), INTERVAL 30 DAY)`
  );

  return NextResponse.json({
    summary: {
      totalRevenue: Number(t.totalRevenue) || 0,
      totalOrders: Number(t.totalOrders) || 0,
      revenue30d: Number(t.revenue30d) || 0,
      revenue7d: Number(t.revenue7d) || 0,
      activeSubscriptions: Number(activeCount[0]?.cnt) || 0,
      expiredLast30d: Number(expired30[0]?.cnt) || 0,
    },
    byPlan: byPlan.map(r => ({
      plan: r.plan,
      orders: Number(r.orders),
      revenue: Number(r.revenue),
    })),
    dailyTrend: daily.map(r => ({
      day: r.day,
      orders: Number(r.orders),
      revenue: Number(r.revenue),
    })),
    recentSubscriptions: recentSubs,
    topReferrers,
  });
}
