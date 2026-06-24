import { query, queryOne, execute, executeDdl } from '@/lib/db';
import { getSiteConfig } from '@/lib/siteconfig';
import { randomUUID } from 'crypto';

let homepageStatTableReady = false;

export async function ensureHomepageStatTable() {
  if (homepageStatTableReady) return;

  await executeDdl(`
    CREATE TABLE IF NOT EXISTS homepage_stat (
      id VARCHAR(191) NOT NULL PRIMARY KEY,
      icon VARCHAR(64) NOT NULL DEFAULT 'Heart',
      value INT NOT NULL DEFAULT 0,
      suffix VARCHAR(32) NOT NULL DEFAULT '',
      label VARCHAR(128) NOT NULL DEFAULT '',
      sortOrder INT NOT NULL DEFAULT 0,
      isActive TINYINT(1) NOT NULL DEFAULT 1,
      createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      KEY homepage_stat_active_idx (isActive, sortOrder)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const columns = [
    { name: 'suffix', ddl: "ADD COLUMN suffix VARCHAR(32) NOT NULL DEFAULT '' AFTER value" },
    { name: 'label', ddl: "ADD COLUMN label VARCHAR(128) NOT NULL DEFAULT '' AFTER suffix" },
    { name: 'icon', ddl: "ADD COLUMN icon VARCHAR(64) NOT NULL DEFAULT 'Heart' AFTER id" },
    { name: 'sortOrder', ddl: 'ADD COLUMN sortOrder INT NOT NULL DEFAULT 0 AFTER label' },
    { name: 'isActive', ddl: 'ADD COLUMN isActive TINYINT(1) NOT NULL DEFAULT 1 AFTER sortOrder' },
    { name: 'createdAt', ddl: 'ADD COLUMN createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)' },
    { name: 'updatedAt', ddl: 'ADD COLUMN updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)' },
  ];

  for (const col of columns) {
    try {
      const exists = await queryOne(
        `SELECT COLUMN_NAME FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'homepage_stat' AND COLUMN_NAME = ?`,
        [col.name]
      );
      if (!exists) {
        await executeDdl(`ALTER TABLE homepage_stat ${col.ddl}`);
      }
    } catch {
      /* ignore race / duplicate */
    }
  }

  homepageStatTableReady = true;
}

export const HOMEPAGE_STAT_DEFS = [
  { id: 'stat_members', key: 'members', icon: 'Users', label: 'Members', format: 'count' },
  { id: 'stat_couples', key: 'couples', icon: 'Heart', label: 'Happy Couples', format: 'count' },
  { id: 'stat_countries', key: 'countries', icon: 'Globe', label: 'Countries', format: 'plus' },
  { id: 'stat_verified', key: 'verified', icon: 'Award', label: 'Verified Profiles', format: 'percent' },
];

export function formatCount(n) {
  const num = Number(n) || 0;
  if (num >= 10_000_000) return { value: Math.floor(num / 1_000_000), suffix: 'M+' };
  if (num >= 100_000) return { value: Math.floor(num / 100_000), suffix: 'L+' };
  if (num >= 1_000) return { value: Math.floor(num / 1_000), suffix: 'K+' };
  return { value: num, suffix: num > 0 ? '+' : '' };
}

export function formatActualDisplay(key, raw) {
  const num = Number(raw) || 0;
  if (key === 'verified') return `${num}%`;
  if (key === 'countries') return `${num}+`;
  const fmt = formatCount(num);
  return `${fmt.value}${fmt.suffix}`;
}

async function queryLiveRow() {
  return queryOne(`
    SELECT
      (SELECT COUNT(*) FROM \`user\` WHERE role = 'USER') AS members,
      (SELECT COUNT(DISTINCT country) FROM profile WHERE country IS NOT NULL AND country != '') AS countries,
      (SELECT COUNT(*) FROM successstory WHERE isActive = 1) AS happyCouples,
      (SELECT COUNT(*) FROM \`user\` WHERE role = 'USER' AND adminVerified = 1) AS verifiedMembers
  `);
}

export async function fetchLiveStats() {
  const row = await queryLiveRow();
  const members = Number(row?.members ?? 0);
  const countries = Number(row?.countries ?? 0);
  const happyCouples = Number(row?.happyCouples ?? 0);
  const verifiedMembers = Number(row?.verifiedMembers ?? 0);
  const successRate = members > 0 ? Math.min(100, Math.round((verifiedMembers / members) * 100)) : 0;

  const membersFmt = formatCount(members);
  const couplesFmt = formatCount(happyCouples);

  const raw = {
    members,
    countries,
    happyCouples,
    successRate,
    verifiedMembers,
  };

  const stats = [
    { icon: 'Users', label: 'Members', ...membersFmt, raw: members },
    { icon: 'Heart', label: 'Happy Couples', ...couplesFmt, raw: happyCouples },
    { icon: 'Globe', label: 'Countries', value: countries, suffix: '+', raw: countries },
    { icon: 'Award', label: 'Verified Profiles', value: successRate, suffix: '%', raw: successRate },
  ];

  return { ...raw, stats };
}

function liveValueForKey(key, live) {
  if (key === 'members') return live.members;
  if (key === 'couples') return live.happyCouples;
  if (key === 'countries') return live.countries;
  if (key === 'verified') return live.successRate;
  return 0;
}

function liveStatForDef(def, live) {
  const found = live.stats.find((s) => s.label === def.label);
  if (found) return found;
  const raw = liveValueForKey(def.key, live);
  if (def.format === 'count') {
    const fmt = formatCount(raw);
    return { icon: def.icon, label: def.label, ...fmt, raw };
  }
  if (def.format === 'percent') {
    return { icon: def.icon, label: def.label, value: raw, suffix: '%', raw };
  }
  return { icon: def.icon, label: def.label, value: raw, suffix: '+', raw };
}

export async function ensureDefaultHomepageStats() {
  await ensureHomepageStatTable();
  const defaults = [
    { id: 'stat_members', icon: 'Users', value: 0, suffix: '+', label: 'Members', sortOrder: 1 },
    { id: 'stat_couples', icon: 'Heart', value: 1, suffix: '+', label: 'Happy Couples', sortOrder: 2 },
    { id: 'stat_countries', icon: 'Globe', value: 150, suffix: '+', label: 'Countries', sortOrder: 3 },
    { id: 'stat_verified', icon: 'Award', value: 98, suffix: '%', label: 'Verified Profiles', sortOrder: 4 },
  ];

  for (const d of defaults) {
    const existing = await queryOne('SELECT id FROM homepage_stat WHERE id = ?', [d.id]);
    if (!existing) {
      await execute(
        'INSERT INTO homepage_stat (id, icon, value, suffix, label, sortOrder, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, 1, NOW(), NOW())',
        [d.id, d.icon, d.value, d.suffix, d.label, d.sortOrder]
      );
    }
  }
}

export async function fetchCustomStatsRows() {
  await ensureHomepageStatTable();
  await ensureDefaultHomepageStats();
  const rows = await query(
    `SELECT id, icon, value, suffix, label, sortOrder FROM homepage_stat
     WHERE isActive = 1 AND id IN (${HOMEPAGE_STAT_DEFS.map(() => '?').join(',')})
     ORDER BY sortOrder ASC`,
    HOMEPAGE_STAT_DEFS.map((d) => d.id)
  );
  return rows;
}

function customStatFromRow(row) {
  return {
    id: row.id,
    icon: row.icon,
    label: row.label,
    value: Number(row.value) || 0,
    suffix: row.suffix ?? '',
    raw: Number(row.value) || 0,
  };
}

export async function getHomepageStatsBundle() {
  await ensureHomepageStatTable();
  const [mode, live] = await Promise.all([
    getSiteConfig('homepage_stats_mode'),
    fetchLiveStats(),
  ]);

  let customRows = [];
  try {
    customRows = await fetchCustomStatsRows();
  } catch (err) {
    console.error('fetchCustomStatsRows error:', err.message);
  }

  const useManual = mode === 'manual' && customRows.length > 0;
  const customById = Object.fromEntries(customRows.map((r) => [r.id, r]));

  const items = HOMEPAGE_STAT_DEFS.map((def) => {
    const actualRaw = liveValueForKey(def.key, live);
    const actualDisplay = formatActualDisplay(def.key, actualRaw);
    const customRow = customById[def.id];
    const claimed = customRow
      ? customStatFromRow(customRow)
      : liveStatForDef(def, live);
    const display = useManual ? claimed : liveStatForDef(def, live);

    return {
      id: def.id,
      key: def.key,
      icon: def.icon,
      label: def.label,
      actual: { raw: actualRaw, display: actualDisplay },
      claimed: {
        value: claimed.value,
        suffix: claimed.suffix,
        display: `${claimed.value}${claimed.suffix}`,
      },
      display,
    };
  });

  return {
    mode: useManual ? 'manual' : 'live',
    members: live.members,
    countries: live.countries,
    happyCouples: live.happyCouples,
    successRate: live.successRate,
    stats: items.map((i) => i.display),
    items,
  };
}

export async function updateCustomStat(id, { value, suffix }) {
  const def = HOMEPAGE_STAT_DEFS.find((d) => d.id === id);
  if (!def) throw new Error('Invalid stat id');

  await ensureDefaultHomepageStats();
  await execute(
    'UPDATE homepage_stat SET value = ?, suffix = ?, updatedAt = NOW() WHERE id = ?',
    [Number(value) || 0, String(suffix ?? ''), id]
  );
}
