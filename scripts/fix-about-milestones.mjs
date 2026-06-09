/**
 * One-time fix: replace incorrect milestone seed data (2024/2025) with correct 2026 timeline.
 * Also updates about page text settings for coming-soon + free registration messaging.
 */
import { randomUUID } from 'crypto';
import { execute, query } from '../lib/db.js';

const SETTINGS_UPDATE = {
  hero_subtitle:
    "Launching in 2026 — India's new matrimonial platform. Free registration is open now. Create your profile today and be ready when we go fully live.",
  story_content:
    'Vivah Dwar is launching in 2026 with one clear goal: help Indian families find a life partner through a safe, respectful, and verified matrimonial platform. We are currently in our early phase — free registration is open so you can create your profile now, while our team prepares the full experience with admin-verified listings, smart matching, secure chat, horoscope support, and help in Hindi and English.',
  cta_title: 'Free Registration Is Open',
  cta_subtitle: 'Create your free profile today. Be among the first members before our full platform launch in 2026.',
};

const MILESTONES = [
  {
    year: '2026',
    title: 'Vivah Dwar — Coming Soon',
    description: 'We are building a trusted matrimonial platform for Indian families — focused on verified profiles, privacy, and meaningful shaadi connections.',
    sortOrder: 0,
  },
  {
    year: '2026',
    title: 'Free Registration Open',
    description: 'Early registration has started. Create your free profile now and complete your matrimonial details before the full platform goes live.',
    sortOrder: 1,
  },
  {
    year: 'Soon',
    title: 'Full Platform Launch',
    description: 'Coming soon — smart matching, secure chat, horoscope matching, premium plans, and our complete matrimonial experience.',
    sortOrder: 2,
  },
];

for (const [key, value] of Object.entries(SETTINGS_UPDATE)) {
  await execute('UPDATE about_setting SET value = ?, updatedAt = NOW() WHERE `key` = ?', [value, key]);
  console.log('Updated setting:', key);
}

await execute('DELETE FROM about_milestone');

for (const m of MILESTONES) {
  await execute(
    'INSERT INTO about_milestone (id, year, title, description, sortOrder, isActive) VALUES (?, ?, ?, ?, ?, 1)',
    [randomUUID(), m.year, m.title, m.description, m.sortOrder]
  );
}

const rows = await query('SELECT year, title FROM about_milestone ORDER BY sortOrder ASC');
console.log('\nMilestones now:');
rows.forEach((r) => console.log(`  ${r.year} — ${r.title}`));

process.exit(0);
