import { execute, queryOne, query } from '@/lib/db';
import { randomUUID } from 'crypto';
import { headers } from 'next/headers';

let tablesReady = false;

const NOMINATIM_UA = 'MilanMatrimony/1.0 (login-geo-tracking)';

async function ensureColumn(table, column, definition) {
  try {
    const row = await queryOne(
      `SELECT COUNT(*) AS c FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
      [table, column]
    );
    if (!row?.c) {
      await execute(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
    }
  } catch (err) {
    console.warn(`[geo] ensureColumn ${table}.${column}:`, err.message);
  }
}

export async function ensureGeoTables() {
  if (tablesReady) return;
  try {
    await execute(`
      CREATE TABLE IF NOT EXISTS user_geo_log (
        id          VARCHAR(36)  PRIMARY KEY,
        userId      VARCHAR(36)  NOT NULL,
        eventType   VARCHAR(20)  NOT NULL,
        ip          VARCHAR(64)  DEFAULT NULL,
        country     VARCHAR(100) DEFAULT NULL,
        city        VARCHAR(100) DEFAULT NULL,
        region      VARCHAR(100) DEFAULT NULL,
        latitude    DECIMAL(10,7) DEFAULT NULL,
        longitude   DECIMAL(10,7) DEFAULT NULL,
        geoSource   VARCHAR(10)  DEFAULT 'IP',
        device      VARCHAR(50)  DEFAULT NULL,
        browser     VARCHAR(100) DEFAULT NULL,
        os          VARCHAR(100) DEFAULT NULL,
        platform    VARCHAR(50)  DEFAULT NULL,
        userAgent   TEXT         DEFAULT NULL,
        createdAt   DATETIME     DEFAULT NOW(),
        INDEX idx_userId (userId),
        INDEX idx_eventType (eventType),
        INDEX idx_createdAt (createdAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    const userCols = [
      ['registrationIp', 'VARCHAR(64) DEFAULT NULL'],
      ['registrationCountry', 'VARCHAR(100) DEFAULT NULL'],
      ['registrationCity', 'VARCHAR(100) DEFAULT NULL'],
      ['registrationLat', 'DECIMAL(10,7) DEFAULT NULL'],
      ['registrationLon', 'DECIMAL(10,7) DEFAULT NULL'],
      ['lastLoginIp', 'VARCHAR(64) DEFAULT NULL'],
      ['lastLoginCountry', 'VARCHAR(100) DEFAULT NULL'],
      ['lastLoginCity', 'VARCHAR(100) DEFAULT NULL'],
      ['lastLoginLat', 'DECIMAL(10,7) DEFAULT NULL'],
      ['lastLoginLon', 'DECIMAL(10,7) DEFAULT NULL'],
    ];
    for (const [col, def] of userCols) {
      await ensureColumn('user', col, def);
    }

    const pendingCols = [
      ['registrationIp', 'VARCHAR(64) DEFAULT NULL'],
      ['registrationCountry', 'VARCHAR(100) DEFAULT NULL'],
      ['registrationCity', 'VARCHAR(100) DEFAULT NULL'],
      ['registrationLat', 'DECIMAL(10,7) DEFAULT NULL'],
      ['registrationLon', 'DECIMAL(10,7) DEFAULT NULL'],
    ];
    for (const [col, def] of pendingCols) {
      await ensureColumn('pending_registration', col, def);
    }

    tablesReady = true;
  } catch (err) {
    console.error('[geo] ensureGeoTables error:', err.message);
  }
}

export function normalizeIP(raw) {
  if (!raw || typeof raw !== 'string') return null;
  let ip = raw.trim();
  if (ip.startsWith('[') && ip.includes(']')) ip = ip.slice(1, ip.indexOf(']'));
  if (ip.startsWith('::ffff:')) ip = ip.slice(7);
  return ip || null;
}

export function isLocalIP(ip) {
  if (!ip || ip === '0.0.0.0') return true;
  if (ip === '::1' || ip === 'localhost') return true;
  if (ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.')) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return true;
  if (ip.startsWith('fe80:') || ip.startsWith('fc') || ip.startsWith('fd')) return true;
  return false;
}

function pickIPFromHeaderList(req) {
  if (!req?.headers) return null;
  const candidates = [
    req.headers.get('cf-connecting-ip'),
    req.headers.get('true-client-ip'),
    req.headers.get('x-real-ip'),
    ...(req.headers.get('x-forwarded-for')?.split(',') || []),
    req.headers.get('x-client-ip'),
    req.headers.get('fastly-client-ip'),
  ];
  for (const raw of candidates) {
    const ip = normalizeIP(raw);
    if (ip && !isLocalIP(ip)) return ip;
  }
  return null;
}

export function getClientIP(req) {
  const fromHeaders = pickIPFromHeaderList(req);
  if (fromHeaders) return fromHeaders;
  return '0.0.0.0';
}

export async function getClientIPFromHeaders() {
  try {
    const h = await headers();
    const fromHeaders = pickIPFromHeaderList({ headers: h });
    if (fromHeaders) return fromHeaders;
  } catch {}
  return '0.0.0.0';
}

export async function resolveServerIP(req, ipOverride, body = {}) {
  if (ipOverride) {
    const ip = normalizeIP(ipOverride);
    if (ip && !isLocalIP(ip)) return ip;
  }
  const fromReq = getClientIP(req);
  if (!isLocalIP(fromReq)) return fromReq;
  try {
    const fromNext = await getClientIPFromHeaders();
    if (!isLocalIP(fromNext)) return fromNext;
  } catch {}
  const clientPublic = normalizeIP(body.clientPublicIp ?? body.clientIp);
  if (clientPublic && !isLocalIP(clientPublic)) return clientPublic;
  return fromReq !== '0.0.0.0' ? fromReq : (clientPublic || '0.0.0.0');
}

function roundCoord(n) {
  if (n == null || !Number.isFinite(n)) return null;
  return Math.round(n * 1e6) / 1e6;
}

export async function getGeoFromIP(ip) {
  if (isLocalIP(ip)) {
    return { country: 'Local', city: 'Local', region: null, latitude: null, longitude: null, isp: null };
  }
  const providers = [
    () => fetch(
      `https://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,city,regionName,lat,lon,isp,timezone,query`,
      { signal: AbortSignal.timeout(4000), cache: 'no-store' }
    ),
    () => fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, {
      signal: AbortSignal.timeout(4000),
      cache: 'no-store',
    }),
  ];
  for (const fetchFn of providers) {
    try {
      const res = await fetchFn();
      const data = await res.json();
      if (data.status === 'success' || data.success === true) {
        return {
          country: data.country || 'Unknown',
          city: data.city || 'Unknown',
          region: data.regionName || data.region || null,
          latitude: data.lat != null ? roundCoord(Number(data.lat)) : null,
          longitude: data.lon != null ? roundCoord(Number(data.lon)) : null,
          isp: data.isp || data.connection?.isp || null,
        };
      }
    } catch {}
  }
  return { country: 'Unknown', city: 'Unknown', region: null, latitude: null, longitude: null, isp: null };
}

export async function reverseGeocodeFromCoords(lat, lon) {
  const latitude = roundCoord(lat);
  const longitude = roundCoord(lon);
  if (latitude == null || longitude == null) return null;
  try {
    const url = new URL('https://nominatim.openstreetmap.org/reverse');
    url.searchParams.set('lat', String(latitude));
    url.searchParams.set('lon', String(longitude));
    url.searchParams.set('format', 'json');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('zoom', '14');

    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': NOMINATIM_UA, Accept: 'application/json' },
      signal: AbortSignal.timeout(4000),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    const addr = data.address || {};
    return {
      city: addr.city || addr.town || addr.village || addr.suburb || addr.hamlet || addr.county || addr.state_district || 'Unknown',
      region: addr.state || addr.region || addr.state_district || null,
      country: addr.country || 'Unknown',
    };
  } catch {
    return null;
  }
}

export function parseClientCoords(body = {}) {
  const lat = parseFloat(body.latitude ?? body.lat);
  const lon = parseFloat(body.longitude ?? body.lng ?? body.lon);
  const accuracy = parseFloat(body.accuracy);
  if (Number.isFinite(lat) && Number.isFinite(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
    return {
      latitude: roundCoord(lat),
      longitude: roundCoord(lon),
      accuracy: Number.isFinite(accuracy) ? Math.round(accuracy) : null,
      geoSource: 'GPS',
    };
  }
  return { latitude: null, longitude: null, accuracy: null, geoSource: 'IP' };
}

export function parseUserAgent(ua = '') {
  let device = 'Desktop';
  if (/mobile|android|iphone|ipod/i.test(ua)) device = 'Mobile';
  else if (/ipad|tablet/i.test(ua)) device = 'Tablet';

  let browser = 'Unknown';
  if (/edg\//i.test(ua)) browser = 'Edge';
  else if (/opr\//i.test(ua)) browser = 'Opera';
  else if (/chrome/i.test(ua)) browser = 'Chrome';
  else if (/safari/i.test(ua)) browser = 'Safari';
  else if (/firefox/i.test(ua)) browser = 'Firefox';

  let os = 'Unknown';
  if (/windows nt 10/i.test(ua)) os = 'Windows 10/11';
  else if (/windows/i.test(ua)) os = 'Windows';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad/i.test(ua)) os = 'iOS';
  else if (/mac os x/i.test(ua)) os = 'macOS';
  else if (/linux/i.test(ua)) os = 'Linux';

  return { device, browser, os };
}

async function resolveGeoContext(req, body = {}, ipOverride = null) {
  const ip = await resolveServerIP(req, ipOverride, body);
  const ipGeo = await getGeoFromIP(ip);
  const client = parseClientCoords(body);
  const ua = req?.headers?.get('user-agent') || body.userAgent || '';
  const { device, browser, os } = parseUserAgent(ua);

  let country = ipGeo.country;
  let city = ipGeo.city;
  let region = ipGeo.region;
  let latitude = client.latitude ?? ipGeo.latitude;
  let longitude = client.longitude ?? ipGeo.longitude;
  let geoSource = client.latitude != null ? 'GPS' : 'IP';

  if (client.latitude != null && client.longitude != null) {
    const rev = await reverseGeocodeFromCoords(client.latitude, client.longitude);
    if (rev) {
      country = rev.country;
      city = rev.city;
      region = rev.region;
    }
  }

  return {
    ip,
    country,
    city,
    region,
    latitude,
    longitude,
    geoSource,
    gpsAccuracy: client.accuracy,
    device,
    browser,
    os,
    platform: body.platform || null,
    userAgent: ua.slice(0, 500) || null,
  };
}

export async function capturePendingRegistrationGeo(req, body = {}) {
  await ensureGeoTables();
  return resolveGeoContext(req, body);
}

export async function recordRegistrationGeo(userId, req, body = {}, { ipOverride, storedGeo } = {}) {
  if (!userId) return;
  await ensureGeoTables();

  const geo = storedGeo || await resolveGeoContext(req, body, ipOverride);

  await execute(
    `UPDATE \`user\` SET
      registrationIp = ?, registrationCountry = ?, registrationCity = ?,
      registrationLat = ?, registrationLon = ?, updatedAt = NOW()
     WHERE id = ?`,
    [geo.ip, geo.country, geo.city, geo.latitude, geo.longitude, userId]
  );

  await insertGeoLog(userId, 'REGISTRATION', geo);
}

export async function recordLoginGeo(userId, req, body = {}, { ipOverride } = {}) {
  if (!userId) return null;
  await ensureGeoTables();

  const geo = await resolveGeoContext(req, body, ipOverride);
  const now = new Date();

  await execute(
    `UPDATE \`user\` SET
      lastLoginAt = ?, lastLoginIp = ?, lastLoginCountry = ?, lastLoginCity = ?,
      lastLoginLat = ?, lastLoginLon = ?, updatedAt = ?
     WHERE id = ?`,
    [now, geo.ip, geo.country, geo.city, geo.latitude, geo.longitude, now, userId]
  );

  await insertGeoLog(userId, 'LOGIN', geo);
  return geo;
}

async function insertGeoLog(userId, eventType, geo) {
  await execute(
    `INSERT INTO user_geo_log
      (id, userId, eventType, ip, country, city, region, latitude, longitude, geoSource, device, browser, os, platform, userAgent, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      randomUUID(), userId, eventType, geo.ip, geo.country, geo.city, geo.region,
      geo.latitude, geo.longitude, geo.geoSource, geo.device, geo.browser, geo.os,
      geo.platform, geo.userAgent,
    ]
  );
}

export async function getUserGeoLogs(userId, limit = 50) {
  await ensureGeoTables();
  return query(
    `SELECT * FROM user_geo_log WHERE userId = ? ORDER BY createdAt DESC LIMIT ?`,
    [userId, limit]
  );
}

export function formatGeoLabel(geo) {
  if (!geo) return '—';
  const parts = [geo.city, geo.region, geo.country].filter(Boolean);
  const loc = parts.join(', ') || 'Unknown';
  const coords = geo.latitude != null && geo.longitude != null
    ? `${Number(geo.latitude).toFixed(5)}, ${Number(geo.longitude).toFixed(5)}`
    : null;
  const source = geo.geoSource === 'GPS' ? ' (GPS)' : '';
  return coords ? `${loc}${source} (${coords})` : loc;
}
