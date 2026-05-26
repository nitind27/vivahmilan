import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query, queryOne, execute } from '@/lib/db';

let tableReady = false;

async function ensureTable() {
  await execute(`
    CREATE TABLE IF NOT EXISTS cookieconsentlog (
      id          VARCHAR(36)  PRIMARY KEY,
      choiceType  VARCHAR(20)  NOT NULL,
      functional  TINYINT(1)   NOT NULL DEFAULT 0,
      analytics   TINYINT(1)   NOT NULL DEFAULT 0,
      sessionId   VARCHAR(64)  DEFAULT NULL,
      createdAt   DATETIME     DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_createdAt (createdAt),
      INDEX idx_choiceType (choiceType)
    )
  `);
}

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get('days') || '30', 10);
  const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 19).replace('T', ' ');

  try {
    if (!tableReady) {
      await ensureTable();
      tableReady = true;
    }

    const [total, byType, functionalOn, analyticsOn, today, daily] = await Promise.all([
      queryOne(`SELECT COUNT(*) AS cnt FROM cookieconsentlog WHERE createdAt >= ?`, [since]),
      query(
        `SELECT choiceType, COUNT(*) AS cnt FROM cookieconsentlog WHERE createdAt >= ?
         GROUP BY choiceType ORDER BY cnt DESC`,
        [since]
      ),
      queryOne(
        `SELECT COUNT(*) AS cnt FROM cookieconsentlog WHERE createdAt >= ? AND functional = 1`,
        [since]
      ),
      queryOne(
        `SELECT COUNT(*) AS cnt FROM cookieconsentlog WHERE createdAt >= ? AND analytics = 1`,
        [since]
      ),
      queryOne(`SELECT COUNT(*) AS cnt FROM cookieconsentlog WHERE DATE(createdAt) = CURDATE()`),
      query(
        `SELECT DATE(createdAt) AS date, COUNT(*) AS cnt FROM cookieconsentlog
         WHERE createdAt >= ? GROUP BY DATE(createdAt) ORDER BY date ASC`,
        [since]
      ),
    ]);

    const totalCnt = Number(total?.cnt || 0);
    const acceptAllCnt = Number(byType.find(r => r.choiceType === 'all')?.cnt || 0);
    const essentialCnt = Number(byType.find(r => r.choiceType === 'essential')?.cnt || 0);
    const customCnt = Number(byType.find(r => r.choiceType === 'custom')?.cnt || 0);

    return NextResponse.json({
      days,
      total: totalCnt,
      today: Number(today?.cnt || 0),
      acceptAll: acceptAllCnt,
      essentialOnly: essentialCnt,
      custom: customCnt,
      functionalEnabled: Number(functionalOn?.cnt || 0),
      analyticsEnabled: Number(analyticsOn?.cnt || 0),
      acceptAllPct: totalCnt ? Math.round((acceptAllCnt / totalCnt) * 100) : 0,
      essentialPct: totalCnt ? Math.round((essentialCnt / totalCnt) * 100) : 0,
      byType,
      daily,
    });
  } catch (err) {
    console.error('[Admin CookieConsent]', err.message);
    return NextResponse.json({
      days,
      total: 0,
      today: 0,
      acceptAll: 0,
      essentialOnly: 0,
      custom: 0,
      functionalEnabled: 0,
      analyticsEnabled: 0,
      acceptAllPct: 0,
      essentialPct: 0,
      byType: [],
      daily: [],
    });
  }
}
