import { execute, executeDdl, query, queryOne } from '@/lib/db';
import { randomUUID } from 'crypto';

let tableReady = false;

const DEFAULT_FAQS = [
  { category: 'General', question: 'What is Vivah Dwar?', answer: 'Vivah Dwar is India\'s trusted matrimonial platform where verified profiles, smart matching, and secure chat help you find your life partner for marriage.', icon: 'HelpCircle', sortOrder: 0 },
  { category: 'Account & Profile', question: 'How do I create my profile?', answer: 'After registering, complete the onboarding steps — basic info, religion, location, career, family details, and photo upload. Your profile is reviewed within 24 hours.', icon: 'User', sortOrder: 0 },
  { category: 'Matches & Interests', question: 'How do I send an interest?', answer: 'Visit any profile and click "Send Interest". The other person will be notified and can accept or decline your proposal.', icon: 'Heart', sortOrder: 0 },
  { category: 'Chat & Messaging', question: 'Why can\'t I send messages?', answer: 'Chat requires a Premium subscription or an active free trial. Upgrade your plan from the Premium page to unlock messaging.', icon: 'MessageCircle', sortOrder: 0 },
  { category: 'Subscription & Payments', question: 'What payment methods are accepted?', answer: 'We accept credit/debit cards, UPI, net banking, and wallets via our secure Cashfree payment gateway.', icon: 'CreditCard', sortOrder: 0 },
  { category: 'Safety & Privacy', question: 'How do I report a fake profile?', answer: 'Visit the profile and click "Report", or use our Report Abuse page. Our team reviews reports within 24 hours.', icon: 'Shield', sortOrder: 0 },
];

export async function ensureFaqTable() {
  if (tableReady) return;
  await executeDdl(`
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
      blogPostId VARCHAR(191) NULL DEFAULT NULL,
      createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      KEY faqitem_active_idx (isActive, sortOrder),
      KEY faqitem_blog_idx (showOnBlog, isActive),
      KEY faqitem_help_idx (showOnHelp, isActive),
      KEY faqitem_category_idx (category),
      KEY faqitem_blog_post_idx (blogPostId, isActive, sortOrder)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  try {
    await executeDdl('ALTER TABLE faqitem ADD COLUMN blogPostId VARCHAR(191) NULL DEFAULT NULL AFTER showOnHelp');
  } catch { /* column exists */ }
  try {
    await executeDdl('ALTER TABLE faqitem ADD KEY faqitem_blog_post_idx (blogPostId, isActive, sortOrder)');
  } catch { /* index exists */ }

  const count = await queryOne('SELECT COUNT(*) AS c FROM faqitem');
  if (!count?.c) {
    for (const f of DEFAULT_FAQS) {
      await execute(
        `INSERT INTO faqitem (id, category, question, answer, icon, sortOrder, isActive, showOnBlog, showOnHelp)
         VALUES (?, ?, ?, ?, ?, ?, 1, 1, 1)`,
        [randomUUID(), f.category, f.question, f.answer, f.icon, f.sortOrder]
      );
    }
  }

  tableReady = true;
}

export function formatFaqRow(row) {
  if (!row) return null;
  return {
    ...row,
    isActive: !!row.isActive,
    showOnBlog: !!row.showOnBlog,
    showOnHelp: !!row.showOnHelp,
    blogPostId: row.blogPostId || null,
    sortOrder: Number(row.sortOrder) || 0,
  };
}

export async function getFaqsForBlogPost(blogPostId) {
  await ensureFaqTable();
  const rows = await query(
    'SELECT * FROM faqitem WHERE blogPostId = ? AND isActive = 1 ORDER BY sortOrder ASC, createdAt ASC',
    [blogPostId]
  );
  return rows.map(formatFaqRow);
}

export async function getAdminFaqsForBlogPost(blogPostId) {
  await ensureFaqTable();
  const rows = await query(
    'SELECT * FROM faqitem WHERE blogPostId = ? ORDER BY sortOrder ASC, createdAt ASC',
    [blogPostId]
  );
  return rows.map(formatFaqRow);
}

/** Replace all FAQs for a blog post (display-only content, not tied to user data). */
export async function syncBlogPostFaqs(blogPostId, faqs = []) {
  await ensureFaqTable();
  const existing = await query('SELECT id FROM faqitem WHERE blogPostId = ?', [blogPostId]);
  const keepIds = new Set();

  for (let i = 0; i < faqs.length; i++) {
    const f = faqs[i];
    const question = f.question?.trim();
    const answer = f.answer?.trim();
    if (!question || !answer) continue;

    const sortOrder = Number(f.sortOrder ?? i) || i;
    if (f.id && existing.some((e) => e.id === f.id)) {
      await execute(
        `UPDATE faqitem SET question = ?, answer = ?, sortOrder = ?, isActive = 1,
         showOnBlog = 0, showOnHelp = 0, blogPostId = ?, updatedAt = NOW() WHERE id = ?`,
        [question, answer, sortOrder, blogPostId, f.id]
      );
      keepIds.add(f.id);
    } else {
      const newId = randomUUID();
      await execute(
        `INSERT INTO faqitem (id, category, question, answer, icon, sortOrder, isActive, showOnBlog, showOnHelp, blogPostId)
         VALUES (?, ?, ?, ?, ?, ?, 1, 0, 0, ?)`,
        [newId, 'Blog Article', question, answer, 'HelpCircle', sortOrder, blogPostId]
      );
      keepIds.add(newId);
    }
  }

  for (const row of existing) {
    if (!keepIds.has(row.id)) {
      await execute('DELETE FROM faqitem WHERE id = ?', [row.id]);
    }
  }
}

export async function deleteFaqsForBlogPost(blogPostId) {
  await ensureFaqTable();
  await execute('DELETE FROM faqitem WHERE blogPostId = ?', [blogPostId]);
}
