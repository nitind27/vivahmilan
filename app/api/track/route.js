import { NextResponse } from 'next/server';
import { execute } from '@/lib/db';
import { randomUUID } from 'crypto';

// Ensure table exists
async function ensureTable() {
  await execute(`
    CREATE TABLE IF NOT EXISTS pageview (
      id          VARCHAR(36)  PRIMARY KEY,
      page        VARCHAR(500) NOT NULL,
      referrer    VARCHAR(500) DEFAULT NULL,
      ip          VARCHAR(64)  DEFAULT NULL,
      country     VARCHAR(100) DEFAULT NULL,
      city        VARCHAR(100) DEFAULT NULL,
      device      VARCHAR(50)  DEFAULT NULL,
      browser     VARCHAR(100) DEFAULT NULL,
      os          VARCHAR(100) DEFAULT NULL,
      userAgent   TEXT         DEFAULT NULL,
      sessionId   VARCHAR(64)  DEFAULT NULL,
      userId      VARCHAR(36)  DEFAULT NULL,
      createdAt   DATETIME     DEFAULT NOW(),
      INDEX idx_page      (page(100)),
      INDEX idx_createdAt (createdAt),
      INDEX idx_ip        (ip),
      INDEX idx_country   (country)
    )
  `);
}

let tableReady = false;

function parseUserAgent(ua = '') {
  // Device
  let device = 'Desktop';
  if (/mobile|android|iphone|ipod/i.test(ua)) device = 'Mobile';
  else if (/ipad|tablet/i.test(ua)) device = 'Tablet';

  // Browser
  let browser = 'Unknown';
  if (/edg\//i.test(ua))        browser = 'Edge';
  else if (/opr\//i.test(ua))   browser = 'Opera';
  else if (/chrome/i.test(ua))  browser = 'Chrome';
  else if (/safari/i.test(ua))  browser = 'Safari';
  else if (/firefox/i.test(ua)) browser = 'Firefox';
  else if (/msie|trident/i.test(ua)) browser = 'IE';

  // OS
  let os = 'Unknown';
  if (/windows nt 10/i.test(ua))     os = 'Windows 10/11';
  else if (/windows/i.test(ua))      os = 'Windows';
  else if (/android/i.test(ua))      os = 'Android';
  else if (/iphone|ipad/i.test(ua))  os = 'iOS';
  else if (/mac os x/i.test(ua))     os = 'macOS';
  else if (/linux/i.test(ua))        os = 'Linux';

  return { device, browser, os };
}

function getClientIP(req) {
  const headers = req.headers;
  return (
    headers.get('cf-connecting-ip') ||
    headers.get('x-real-ip') ||
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    '0.0.0.0'
  );
}

async function getGeoFromIP(ip) {
  if (!ip || ip === '0.0.0.0' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return { country: 'Local', city: 'Local' };
  }
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=country,city,status`, { signal: AbortSignal.timeout(2000) });
    const data = await res.json();
    if (data.status === 'success') return { country: data.country || 'Unknown', city: data.city || 'Unknown' };
  } catch {}
  return { country: 'Unknown', city: 'Unknown' };
}

export async function POST(req) {
  try {
    if (!tableReady) { await ensureTable(); tableReady = true; }

    const body = await req.json().catch(() => ({}));
    const { page, referrer, sessionId, userId } = body;

    if (!page) return NextResponse.json({ ok: false });

    const ua = req.headers.get('user-agent') || '';
    const ip = getClientIP(req);
    const { device, browser, os } = parseUserAgent(ua);
    const { country, city } = await getGeoFromIP(ip);

    await execute(
      `INSERT INTO pageview (id, page, referrer, ip, country, city, device, browser, os, userAgent, sessionId, userId, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [randomUUID(), page.slice(0, 500), referrer?.slice(0, 500) || null, ip, country, city, device, browser, os, ua.slice(0, 500), sessionId || null, userId || null]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[Track] error:', err.message);
    return NextResponse.json({ ok: false });
  }
}
