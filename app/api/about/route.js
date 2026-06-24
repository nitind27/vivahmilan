import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ensureAboutTables } from '@/lib/about';
import { getHomepageStatsBundle } from '@/lib/homepageStats';

export async function GET() {
  await ensureAboutTables();

  const [settingsRows, values, milestones, statsBundle] = await Promise.all([
    query('SELECT `key`, value FROM about_setting'),
    query('SELECT id, icon, title, description, sortOrder FROM about_value WHERE isActive = 1 ORDER BY sortOrder ASC'),
    query('SELECT id, year, title, description, sortOrder FROM about_milestone WHERE isActive = 1 ORDER BY sortOrder ASC'),
    getHomepageStatsBundle(),
  ]);

  const settings = {};
  for (const row of settingsRows) settings[row.key] = row.value;

  return NextResponse.json({
    settings,
    values,
    milestones,
    stats: statsBundle.stats,
    statsMode: statsBundle.mode,
  });
}
