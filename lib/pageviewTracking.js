import { execute, queryOne } from '@/lib/db';
import { randomUUID } from 'crypto';
import {
  getGeoFromIP,
  parseUserAgent,
  resolveServerIP,
  isLocalIP,
  normalizeIP,
} from '@/lib/geoTracking';

let tableReady = false;

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
    console.warn(`[pageview] ensureColumn ${table}.${column}:`, err.message);
  }
}

export async function ensurePageviewTable() {
  if (tableReady) return;
  await execute(`
    CREATE TABLE IF NOT EXISTS pageview (
      id          VARCHAR(36)  PRIMARY KEY,
      page        VARCHAR(500) NOT NULL,
      referrer    VARCHAR(500) DEFAULT NULL,
      ip          VARCHAR(64)  DEFAULT NULL,
      country     VARCHAR(100) DEFAULT NULL,
      region      VARCHAR(100) DEFAULT NULL,
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await ensureColumn('pageview', 'region', 'VARCHAR(100) DEFAULT NULL');
  tableReady = true;
}

/** Resolve visitor IP + geo (IP-based; optional clientPublicIp from browser). */
export async function resolvePageviewGeo(req, body = {}) {
  const ip = await resolveServerIP(req, null, body);
  const geo = await getGeoFromIP(ip);
  const ua = req?.headers?.get('user-agent') || body.userAgent || '';
  const { device, browser, os } = parseUserAgent(ua);

  let country = geo.country;
  let city = geo.city;
  let region = geo.region;

  if (isLocalIP(ip)) {
    country = country === 'Unknown' ? 'Local network' : country;
    city = city === 'Unknown' ? '—' : city;
  }

  return {
    ip: normalizeIP(ip) || ip,
    country,
    region,
    city,
    device,
    browser,
    os,
    userAgent: ua.slice(0, 500) || null,
  };
}

export function formatVisitorLocation(row) {
  if (!row) return '—';
  const parts = [row.city, row.region, row.country].filter(
    (p) => p && p !== 'Unknown' && p !== 'Local' && p !== '—'
  );
  if (parts.length) return parts.join(', ');
  if (row.country === 'Local network' || row.country === 'Local') return 'Local network';
  return '—';
}

export async function recordPageview(req, body = {}) {
  await ensurePageviewTable();

  const { page, referrer, sessionId, userId } = body;
  if (!page) return { ok: false };

  const geo = await resolvePageviewGeo(req, body);

  await execute(
    `INSERT INTO pageview (id, page, referrer, ip, country, region, city, device, browser, os, userAgent, sessionId, userId, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      randomUUID(),
      String(page).slice(0, 500),
      referrer?.slice(0, 500) || null,
      geo.ip,
      geo.country,
      geo.region,
      geo.city,
      geo.device,
      geo.browser,
      geo.os,
      geo.userAgent,
      sessionId || null,
      userId || null,
    ]
  );

  return { ok: true, geo };
}
