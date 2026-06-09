import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ensureAboutTables } from '@/lib/about';

export async function GET() {
  await ensureAboutTables();

  const settingsRows = await query('SELECT `key`, value FROM about_setting');
  const settings = {};
  for (const row of settingsRows) settings[row.key] = row.value;

  const values = await query(
    'SELECT id, icon, title, description, sortOrder FROM about_value WHERE isActive = 1 ORDER BY sortOrder ASC'
  );
  const milestones = await query(
    'SELECT id, year, title, description, sortOrder FROM about_milestone WHERE isActive = 1 ORDER BY sortOrder ASC'
  );
  const stats = await query(
    'SELECT icon, value, suffix, label, sortOrder FROM homepage_stat WHERE isActive = 1 ORDER BY sortOrder ASC'
  ).catch(() => []);

  return NextResponse.json({ settings, values, milestones, stats });
}
