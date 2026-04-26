import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query, queryOne } from '@/lib/db';

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get('days') || '30');
  const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 19).replace('T', ' ');

  try {
    const [
      totalViews,
      uniqueIPs,
      todayViews,
      topPages,
      topCountries,
      topCities,
      deviceBreakdown,
      browserBreakdown,
      osBreakdown,
      topReferrers,
      recentVisitors,
      dailyTrend,
    ] = await Promise.all([
      // Total page views
      queryOne(`SELECT COUNT(*) as cnt FROM pageview WHERE createdAt >= ?`, [since]),
      // Unique IPs
      queryOne(`SELECT COUNT(DISTINCT ip) as cnt FROM pageview WHERE createdAt >= ?`, [since]),
      // Today's views
      queryOne(`SELECT COUNT(*) as cnt FROM pageview WHERE DATE(createdAt) = CURDATE()`),
      // Top pages
      query(`SELECT page, COUNT(*) as views FROM pageview WHERE createdAt >= ? GROUP BY page ORDER BY views DESC LIMIT 10`, [since]),
      // Top countries
      query(`SELECT country, COUNT(*) as views, COUNT(DISTINCT ip) as unique_visitors FROM pageview WHERE createdAt >= ? AND country IS NOT NULL GROUP BY country ORDER BY views DESC LIMIT 15`, [since]),
      // Top cities
      query(`SELECT city, country, COUNT(*) as views FROM pageview WHERE createdAt >= ? AND city IS NOT NULL AND city != 'Unknown' GROUP BY city, country ORDER BY views DESC LIMIT 10`, [since]),
      // Device breakdown
      query(`SELECT device, COUNT(*) as cnt FROM pageview WHERE createdAt >= ? GROUP BY device ORDER BY cnt DESC`, [since]),
      // Browser breakdown
      query(`SELECT browser, COUNT(*) as cnt FROM pageview WHERE createdAt >= ? GROUP BY browser ORDER BY cnt DESC`, [since]),
      // OS breakdown
      query(`SELECT os, COUNT(*) as cnt FROM pageview WHERE createdAt >= ? GROUP BY os ORDER BY cnt DESC`, [since]),
      // Top referrers
      query(`SELECT referrer, COUNT(*) as cnt FROM pageview WHERE createdAt >= ? AND referrer IS NOT NULL AND referrer != '' GROUP BY referrer ORDER BY cnt DESC LIMIT 10`, [since]),
      // Recent visitors (last 50)
      query(`SELECT id, page, ip, country, city, device, browser, os, referrer, sessionId, userId, createdAt FROM pageview ORDER BY createdAt DESC LIMIT 50`),
      // Daily trend (last N days)
      query(`SELECT DATE(createdAt) as date, COUNT(*) as views, COUNT(DISTINCT ip) as unique_visitors FROM pageview WHERE createdAt >= ? GROUP BY DATE(createdAt) ORDER BY date ASC`, [since]),
    ]);

    return NextResponse.json({
      summary: {
        totalViews: totalViews?.cnt || 0,
        uniqueVisitors: uniqueIPs?.cnt || 0,
        todayViews: todayViews?.cnt || 0,
      },
      topPages,
      topCountries,
      topCities,
      deviceBreakdown,
      browserBreakdown,
      osBreakdown,
      topReferrers,
      recentVisitors,
      dailyTrend,
    });
  } catch (err) {
    // Table might not exist yet
    return NextResponse.json({
      summary: { totalViews: 0, uniqueVisitors: 0, todayViews: 0 },
      topPages: [], topCountries: [], topCities: [], deviceBreakdown: [],
      browserBreakdown: [], osBreakdown: [], topReferrers: [], recentVisitors: [], dailyTrend: [],
    });
  }
}
