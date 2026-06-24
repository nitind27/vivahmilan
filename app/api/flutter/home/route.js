import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getSiteConfig } from '@/lib/siteconfig';
import { getHomepageStatsBundle } from '@/lib/homepageStats';

/** Public splash / home bootstrap (no auth) */
export async function GET() {
  try {
    const [maintenanceRow, playStoreUrl, appStoreUrl, appNavEnabled, slides, features, statsBundle] =
      await Promise.all([
        queryOne("SELECT value FROM siteconfig WHERE `key` = 'maintenance_mode' LIMIT 1"),
        getSiteConfig('play_store_url'),
        getSiteConfig('app_store_url'),
        getSiteConfig('app_nav_enabled'),
        query('SELECT id, tag, headline, highlight, sub, sortOrder FROM homepage_slide WHERE isActive = 1 ORDER BY sortOrder ASC'),
        query('SELECT id, icon, title, description, sortOrder FROM homepage_feature WHERE isActive = 1 ORDER BY sortOrder ASC'),
        getHomepageStatsBundle(),
      ]);

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
        members: statsBundle.members,
        countries: statsBundle.countries,
        happyCouples: statsBundle.happyCouples,
        successRate: statsBundle.successRate,
        mode: statsBundle.mode,
        display: statsBundle.stats,
      },
    });
  } catch (err) {
    console.error('[flutter/home]', err);
    return NextResponse.json({ error: 'Failed to load home data' }, { status: 500 });
  }
}
