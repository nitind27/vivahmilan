import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query, queryOne } from '@/lib/db';
import { getAnalyticsWindow } from '@/lib/analyticsWindow';

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const window = getAnalyticsWindow(searchParams.get('days'));
  const { whereSql, params, isToday, days, label } = window;

  try {
    const [
      totalViews,
      uniqueIPs,
      todayViews,
      todayUnique,
      uniquePages,
      topPages,
      topCountries,
      topCities,
      deviceBreakdown,
      browserBreakdown,
      osBreakdown,
      topReferrers,
      recentVisitors,
      dailyTrend,
      hourlyTrend,
    ] = await Promise.all([
      queryOne(`SELECT COUNT(*) as cnt FROM pageview WHERE ${whereSql}`, params),
      queryOne(`SELECT COUNT(DISTINCT ip) as cnt FROM pageview WHERE ${whereSql}`, params),
      queryOne(`SELECT COUNT(*) as cnt FROM pageview WHERE DATE(createdAt) = CURDATE()`),
      queryOne(`SELECT COUNT(DISTINCT ip) as cnt FROM pageview WHERE DATE(createdAt) = CURDATE()`),
      queryOne(`SELECT COUNT(DISTINCT page) as cnt FROM pageview WHERE ${whereSql}`, params),
      query(`SELECT page, COUNT(*) as views FROM pageview WHERE ${whereSql} GROUP BY page ORDER BY views DESC LIMIT 10`, params),
      query(`SELECT country, COUNT(*) as views, COUNT(DISTINCT ip) as unique_visitors FROM pageview WHERE ${whereSql} AND country IS NOT NULL AND country NOT IN ('Unknown','Local','Local network') GROUP BY country ORDER BY views DESC LIMIT 15`, params),
      query(`SELECT city, region, country, COUNT(*) as views FROM pageview WHERE ${whereSql} AND country IS NOT NULL AND country NOT IN ('Unknown','Local','Local network') GROUP BY city, region, country ORDER BY views DESC LIMIT 10`, params),
      query(`SELECT device, COUNT(*) as cnt FROM pageview WHERE ${whereSql} GROUP BY device ORDER BY cnt DESC`, params),
      query(`SELECT browser, COUNT(*) as cnt FROM pageview WHERE ${whereSql} GROUP BY browser ORDER BY cnt DESC`, params),
      query(`SELECT os, COUNT(*) as cnt FROM pageview WHERE ${whereSql} GROUP BY os ORDER BY cnt DESC`, params),
      query(`SELECT referrer, COUNT(*) as cnt FROM pageview WHERE ${whereSql} AND referrer IS NOT NULL AND referrer != '' GROUP BY referrer ORDER BY cnt DESC LIMIT 10`, params),
      query(`SELECT id, page, ip, country, region, city, device, browser, os, referrer, sessionId, userId, createdAt FROM pageview WHERE ${whereSql} ORDER BY createdAt DESC LIMIT 50`, params),
      isToday
        ? query(`SELECT DATE(createdAt) as date, COUNT(*) as views, COUNT(DISTINCT ip) as unique_visitors FROM pageview WHERE DATE(createdAt) = CURDATE() GROUP BY DATE(createdAt) ORDER BY date ASC`)
        : query(`SELECT DATE(createdAt) as date, COUNT(*) as views, COUNT(DISTINCT ip) as unique_visitors FROM pageview WHERE ${whereSql} GROUP BY DATE(createdAt) ORDER BY date ASC`, params),
      isToday
        ? query(`SELECT HOUR(createdAt) as hour, COUNT(*) as views, COUNT(DISTINCT ip) as unique_visitors FROM pageview WHERE DATE(createdAt) = CURDATE() GROUP BY HOUR(createdAt) ORDER BY hour ASC`)
        : Promise.resolve([]),
    ]);

    const hourly = (hourlyTrend || []).map((r) => ({
      hour: Number(r.hour),
      views: Number(r.views),
      unique_visitors: Number(r.unique_visitors),
    }));
    const peakHour = hourly.length
      ? hourly.reduce((best, h) => (h.views > best.views ? h : best), hourly[0])
      : null;

    return NextResponse.json({
      period: {
        days,
        label,
        isToday,
        date: new Date().toISOString().slice(0, 10),
      },
      summary: {
        totalViews: totalViews?.cnt || 0,
        uniqueVisitors: uniqueIPs?.cnt || 0,
        todayViews: todayViews?.cnt || 0,
        todayUniqueVisitors: todayUnique?.cnt || 0,
        uniquePages: uniquePages?.cnt || 0,
        peakHour: peakHour?.hour ?? null,
        peakHourViews: peakHour?.views ?? 0,
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
      hourlyTrend: hourly,
    });
  } catch (err) {
    return NextResponse.json({
      period: { days, label, isToday, date: new Date().toISOString().slice(0, 10) },
      summary: { totalViews: 0, uniqueVisitors: 0, todayViews: 0, todayUniqueVisitors: 0, uniquePages: 0, peakHour: null, peakHourViews: 0 },
      topPages: [], topCountries: [], topCities: [], deviceBreakdown: [],
      browserBreakdown: [], osBreakdown: [], topReferrers: [], recentVisitors: [], dailyTrend: [], hourlyTrend: [],
    });
  }
}
