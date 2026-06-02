import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getSiteConfig } from '@/lib/siteconfig';

function formatCount(n) {
  const num = Number(n) || 0;
  if (num >= 10_000_000) return { value: Math.floor(num / 1_000_000), suffix: 'M+' };
  if (num >= 100_000) return { value: Math.floor(num / 100_000), suffix: 'L+' };
  if (num >= 1_000) return { value: Math.floor(num / 1_000), suffix: 'K+' };
  return { value: num, suffix: num > 0 ? '+' : '' };
}

/** Public splash / home bootstrap (no auth) */
export async function GET() {
  try {
    const [maintenanceRow, playStoreUrl, appStoreUrl, appNavEnabled, slides, features, statsRow] =
      await Promise.all([
        queryOne("SELECT value FROM siteconfig WHERE `key` = 'maintenance_mode' LIMIT 1"),
        getSiteConfig('play_store_url'),
        getSiteConfig('app_store_url'),
        getSiteConfig('app_nav_enabled'),
        query('SELECT id, tag, headline, highlight, sub, sortOrder FROM homepage_slide WHERE isActive = 1 ORDER BY sortOrder ASC'),
        query('SELECT id, icon, title, description, sortOrder FROM homepage_feature WHERE isActive = 1 ORDER BY sortOrder ASC'),
        queryOne(`
          SELECT
            (SELECT COUNT(*) FROM \`user\` WHERE role = 'USER') AS members,
            (SELECT COUNT(DISTINCT country) FROM profile WHERE country IS NOT NULL AND country != '') AS countries,
            (SELECT COUNT(*) FROM successstory WHERE isActive = 1) AS happyCouples,
            (SELECT COUNT(*) FROM \`user\` WHERE role = 'USER' AND adminVerified = 1) AS verifiedMembers
        `),
      ]);

    const members = Number(statsRow?.members ?? 0);
    const countries = Number(statsRow?.countries ?? 0);
    const happyCouples = Number(statsRow?.happyCouples ?? 0);
    const verifiedMembers = Number(statsRow?.verifiedMembers ?? 0);
    const successRate = members > 0 ? Math.min(100, Math.round((verifiedMembers / members) * 100)) : 0;
    const membersFmt = formatCount(members);
    const couplesFmt = formatCount(happyCouples);

    return NextResponse.json({
      maintenance: maintenanceRow?.value !== '1',
      appLinks: {
        playStoreUrl: playStoreUrl?.trim() || '',
        appStoreUrl: appStoreUrl?.trim() || '',
        enabled: appNavEnabled !== '0',
      },
      slides: slides || [],
      features: features || [],
      stats: {
        members,
        countries,
        happyCouples,
        successRate,
        display: [
          { icon: 'Users', label: 'Members', ...membersFmt },
          { icon: 'Heart', label: 'Happy Couples', ...couplesFmt },
          { icon: 'Globe', label: 'Countries', value: countries, suffix: '+' },
          { icon: 'Award', label: 'Verified Profiles', value: successRate, suffix: '%' },
        ],
      },
    });
  } catch (err) {
    console.error('[flutter/home]', err);
    return NextResponse.json({ error: 'Failed to load home data' }, { status: 500 });
  }
}
