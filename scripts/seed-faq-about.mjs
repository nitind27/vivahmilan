import { randomUUID } from 'crypto';
import { execute, query, queryOne, pool } from '../lib/db.js';

async function ddl(sql) {
  const conn = await pool.getConnection();
  try {
    await conn.query(sql);
  } finally {
    conn.release();
  }
}

await ddl(`
  CREATE TABLE IF NOT EXISTS faqitem (
    id VARCHAR(191) NOT NULL PRIMARY KEY,
    category VARCHAR(100) NOT NULL DEFAULT 'General',
    question VARCHAR(500) NOT NULL,
    answer TEXT NOT NULL,
    icon VARCHAR(50) NULL DEFAULT 'HelpCircle',
    sortOrder INT NOT NULL DEFAULT 0,
    isActive TINYINT(1) NOT NULL DEFAULT 1,
    showOnBlog TINYINT(1) NOT NULL DEFAULT 1,
    showOnHelp TINYINT(1) NOT NULL DEFAULT 1,
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    KEY faqitem_active_idx (isActive, sortOrder),
    KEY faqitem_blog_idx (showOnBlog, isActive),
    KEY faqitem_help_idx (showOnHelp, isActive),
    KEY faqitem_category_idx (category)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`);

await ddl(`
  CREATE TABLE IF NOT EXISTS about_setting (
    \`key\` VARCHAR(100) NOT NULL PRIMARY KEY,
    value TEXT NOT NULL,
    updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`);

await ddl(`
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

await ddl(`
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

const DEFAULT_FAQS = [
  { category: 'General', question: 'What is Vivah Dwar?', answer: "Vivah Dwar is India's trusted matrimonial platform where verified profiles, smart matching, and secure chat help you find your life partner for marriage.", icon: 'HelpCircle', sortOrder: 0 },
  { category: 'Account & Profile', question: 'How do I create my profile?', answer: 'After registering, complete the onboarding steps — basic info, religion, location, career, family details, and photo upload. Your profile is reviewed within 24 hours.', icon: 'User', sortOrder: 0 },
  { category: 'Matches & Interests', question: 'How do I send an interest?', answer: 'Visit any profile and click "Send Interest". The other person will be notified and can accept or decline your proposal.', icon: 'Heart', sortOrder: 0 },
  { category: 'Chat & Messaging', question: "Why can't I send messages?", answer: 'Chat requires a Premium subscription or an active free trial. Upgrade your plan from the Premium page to unlock messaging.', icon: 'MessageCircle', sortOrder: 0 },
  { category: 'Subscription & Payments', question: 'What payment methods are accepted?', answer: 'We accept credit/debit cards, UPI, net banking, and wallets via our secure Cashfree payment gateway.', icon: 'CreditCard', sortOrder: 0 },
  { category: 'Safety & Privacy', question: 'How do I report a fake profile?', answer: 'Visit the profile and click "Report", or use our Report Abuse page. Our team reviews reports within 24 hours.', icon: 'Shield', sortOrder: 0 },
];

const DEFAULT_SETTINGS = {
  hero_tag: '🪔 Vivah Dwar Matrimonial',
  hero_title: 'Bringing Hearts Together',
  hero_highlight: 'With Trust & Tradition',
  hero_subtitle: "India's trusted matrimonial platform — where families find meaningful connections through verified profiles, smart matching, and a safe space built for shaadi and lifelong partnerships.",
  mission_title: 'Our Mission',
  mission_content: 'To make finding a life partner simple, safe, and dignified for every Indian family.',
  vision_title: 'Our Vision',
  vision_content: "To become India's most trusted matrimonial destination.",
  story_title: 'Our Story',
  story_content: 'Vivah Dwar was born from a simple belief: every person deserves a trustworthy platform to find their life partner.',
  cta_title: 'Ready to Begin Your Journey?',
  cta_subtitle: 'Create your free profile today and take the first step toward finding your perfect match.',
};

const faqCount = await queryOne('SELECT COUNT(*) AS c FROM faqitem');
if (!Number(faqCount?.c)) {
  for (const f of DEFAULT_FAQS) {
    await execute(
      `INSERT INTO faqitem (id, category, question, answer, icon, sortOrder, isActive, showOnBlog, showOnHelp) VALUES (?, ?, ?, ?, ?, ?, 1, 1, 1)`,
      [randomUUID(), f.category, f.question, f.answer, f.icon, f.sortOrder]
    );
  }
}

for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
  const existing = await queryOne('SELECT `key` FROM about_setting WHERE `key` = ?', [key]);
  if (!existing) await execute('INSERT INTO about_setting (`key`, value) VALUES (?, ?)', [key, value]);
}

const valueCount = await queryOne('SELECT COUNT(*) AS c FROM about_value');
if (!Number(valueCount?.c)) {
  const values = [
    { icon: 'Shield', title: 'Trust & Safety', description: 'Every profile is reviewed. Your data stays private and secure.', sortOrder: 0 },
    { icon: 'Heart', title: 'Family First', description: 'We honour Indian traditions with modern search tools.', sortOrder: 1 },
    { icon: 'Users', title: 'Verified Community', description: 'Real people, real intentions — no fake profiles tolerated.', sortOrder: 2 },
    { icon: 'Star', title: 'Smart Matching', description: 'Filters for religion, location, education help you find compatible partners.', sortOrder: 3 },
  ];
  for (const v of values) {
    await execute('INSERT INTO about_value (id, icon, title, description, sortOrder, isActive) VALUES (?, ?, ?, ?, ?, 1)', [randomUUID(), v.icon, v.title, v.description, v.sortOrder]);
  }
}

const milestoneCount = await queryOne('SELECT COUNT(*) AS c FROM about_milestone');
if (!Number(milestoneCount?.c)) {
  const milestones = [
    { year: '2024', title: 'Platform Launch', description: 'Vivah Dwar goes live with verified profiles.', sortOrder: 0 },
    { year: '2025', title: 'Growing Community', description: 'Thousands of members join across India.', sortOrder: 1 },
    { year: '2026', title: 'Next Chapter', description: 'Expanding smart matchmaking and multilingual support.', sortOrder: 2 },
  ];
  for (const m of milestones) {
    await execute('INSERT INTO about_milestone (id, year, title, description, sortOrder, isActive) VALUES (?, ?, ?, ?, ?, 1)', [randomUUID(), m.year, m.title, m.description, m.sortOrder]);
  }
}

const faq = await query('SELECT COUNT(*) AS c FROM faqitem');
const settings = await query('SELECT COUNT(*) AS c FROM about_setting');
const values = await query('SELECT COUNT(*) AS c FROM about_value');
const milestones = await query('SELECT COUNT(*) AS c FROM about_milestone');

console.log('Tables created & seeded on production DB:');
console.log('  faqitem:', faq[0]?.c, 'rows');
console.log('  about_setting:', settings[0]?.c, 'rows');
console.log('  about_value:', values[0]?.c, 'rows');
console.log('  about_milestone:', milestones[0]?.c, 'rows');

process.exit(0);
