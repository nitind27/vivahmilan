import { execute, queryOne } from '@/lib/db';
import { randomUUID } from 'crypto';

let tableReady = false;

const DEFAULT_SETTINGS = {
  hero_tag: '🪔 Vivah Dwar Matrimonial',
  hero_title: 'Bringing Hearts Together',
  hero_highlight: 'With Trust & Tradition',
  hero_subtitle:
    "India's trusted matrimonial platform — where families find meaningful connections through verified profiles, smart matching, and a safe space built for shaadi and lifelong partnerships.",
  mission_title: 'Our Mission',
  mission_content:
    'To make finding a life partner simple, safe, and dignified for every Indian family. We combine modern technology with cultural values so your search for vivah feels respectful, transparent, and truly personal.',
  vision_title: 'Our Vision',
  vision_content:
    'To become India\'s most trusted matrimonial destination — where millions of verified profiles, intelligent matchmaking, and genuine success stories redefine how people find love and build families.',
  story_title: 'Our Story',
  story_content:
    'Vivah Dwar was born from a simple belief: every person deserves a trustworthy platform to find their life partner. We saw families struggling with unverified listings, privacy concerns, and impersonal experiences. So we built Vivah Dwar — a matrimonial home that puts authenticity first, with admin-verified profiles, secure chat, horoscope matching, and support in Hindi and English. Today, couples across India are writing their success stories through our platform.',
  cta_title: 'Ready to Begin Your Journey?',
  cta_subtitle: 'Create your free profile today and take the first step toward finding your perfect match.',
};

const DEFAULT_VALUES = [
  { icon: 'Shield', title: 'Trust & Safety', description: 'Every profile is reviewed. Your data and conversations stay private and secure.', sortOrder: 0 },
  { icon: 'Heart', title: 'Family First', description: 'We honour Indian traditions while giving you modern tools to search with confidence.', sortOrder: 1 },
  { icon: 'Users', title: 'Verified Community', description: 'Real people, real intentions — no fake profiles tolerated on our platform.', sortOrder: 2 },
  { icon: 'Star', title: 'Smart Matching', description: 'Filters for religion, location, education, and preferences help you find compatible partners faster.', sortOrder: 3 },
];

const DEFAULT_MILESTONES = [
  { year: '2024', title: 'Platform Launch', description: 'Vivah Dwar goes live with verified profiles and secure matrimonial search.', sortOrder: 0 },
  { year: '2025', title: 'Growing Community', description: 'Thousands of members join across India with success stories and premium features.', sortOrder: 1 },
  { year: '2026', title: 'Next Chapter', description: 'Expanding smart matchmaking, Kundali matching, and multilingual support for every family.', sortOrder: 2 },
];

export async function ensureAboutTables() {
  if (tableReady) return;

  await execute(`
    CREATE TABLE IF NOT EXISTS about_setting (
      \`key\` VARCHAR(100) NOT NULL PRIMARY KEY,
      value TEXT NOT NULL,
      updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await execute(`
    CREATE TABLE IF NOT EXISTS about_value (
      id VARCHAR(191) NOT NULL PRIMARY KEY,
      icon VARCHAR(50) NOT NULL DEFAULT 'Heart',
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      sortOrder INT NOT NULL DEFAULT 0,
      isActive TINYINT(1) NOT NULL DEFAULT 1,
      createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      KEY about_value_sort_idx (isActive, sortOrder)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await execute(`
    CREATE TABLE IF NOT EXISTS about_milestone (
      id VARCHAR(191) NOT NULL PRIMARY KEY,
      year VARCHAR(20) NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      sortOrder INT NOT NULL DEFAULT 0,
      isActive TINYINT(1) NOT NULL DEFAULT 1,
      createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      KEY about_milestone_sort_idx (isActive, sortOrder)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    const existing = await queryOne('SELECT `key` FROM about_setting WHERE `key` = ?', [key]);
    if (!existing) {
      await execute('INSERT INTO about_setting (`key`, value) VALUES (?, ?)', [key, value]);
    }
  }

  const valueCount = await queryOne('SELECT COUNT(*) AS c FROM about_value');
  if (!valueCount?.c) {
    for (const v of DEFAULT_VALUES) {
      await execute(
        'INSERT INTO about_value (id, icon, title, description, sortOrder, isActive) VALUES (?, ?, ?, ?, ?, 1)',
        [randomUUID(), v.icon, v.title, v.description, v.sortOrder]
      );
    }
  }

  const milestoneCount = await queryOne('SELECT COUNT(*) AS c FROM about_milestone');
  if (!milestoneCount?.c) {
    for (const m of DEFAULT_MILESTONES) {
      await execute(
        'INSERT INTO about_milestone (id, year, title, description, sortOrder, isActive) VALUES (?, ?, ?, ?, ?, 1)',
        [randomUUID(), m.year, m.title, m.description, m.sortOrder]
      );
    }
  }

  tableReady = true;
}

export const ABOUT_VALUE_ICONS = ['Heart', 'Shield', 'Users', 'Star', 'Globe', 'Award', 'Sparkles', 'CheckCircle'];
