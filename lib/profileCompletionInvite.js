import { randomUUID } from 'crypto';
import { execute, queryOne } from '@/lib/db.js';

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function ensureProfileCompletionTable() {
  await execute(`
    CREATE TABLE IF NOT EXISTS profilecompletionsession (
      id VARCHAR(36) PRIMARY KEY,
      userId VARCHAR(36) NOT NULL,
      adminId VARCHAR(36) NOT NULL,
      email VARCHAR(255) NOT NULL,
      token VARCHAR(128) NOT NULL UNIQUE,
      status ENUM('PENDING','ACTIVE','COMPLETED','EXPIRED') DEFAULT 'PENDING',
      createdAt DATETIME DEFAULT NOW(),
      updatedAt DATETIME DEFAULT NOW() ON UPDATE NOW(),
      expiresAt DATETIME NOT NULL,
      emailVerifiedAt DATETIME NULL,
      INDEX idx_pc_token (token),
      INDEX idx_pc_userId (userId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  try {
    await execute(`ALTER TABLE profilecompletionsession MODIFY COLUMN token VARCHAR(128) NOT NULL`);
  } catch { /* already ok */ }
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

export function buildProfileCompletionUrl(token) {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://vivahdwar.com';
  return `${base}/complete-profile/${token}`;
}

export function maskEmail(email) {
  const e = String(email || '');
  const [local, domain] = e.split('@');
  if (!domain) return '***';
  const visible = local.length <= 2 ? local[0] || '*' : local.slice(0, 2);
  return `${visible}***@${domain}`;
}

export async function createProfileCompletionInvite(userId, adminId) {
  await ensureProfileCompletionTable();

  const user = await queryOne(
    'SELECT id, name, email FROM `user` WHERE id = ?',
    [userId]
  );
  if (!user) return { ok: false, error: 'User not found', status: 404 };
  if (!user.email) return { ok: false, error: 'User has no email — add email before sending link', status: 400 };

  await execute(
    `UPDATE profilecompletionsession SET status = 'EXPIRED'
     WHERE userId = ? AND status IN ('PENDING','ACTIVE')`,
    [userId]
  );

  const id = randomUUID();
  const token = randomUUID().replace(/-/g, '') + randomUUID().replace(/-/g, '');
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

  await execute(
    `INSERT INTO profilecompletionsession (id, userId, adminId, email, token, expiresAt)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, userId, adminId, user.email, token, expiresAt]
  );

  const completionUrl = buildProfileCompletionUrl(token);
  return {
    ok: true,
    sessionId: id,
    token,
    completionUrl,
    email: user.email,
    name: user.name || 'Member',
    expiresAt,
  };
}

export async function getSessionByToken(token) {
  await ensureProfileCompletionTable();
  return queryOne(
    `SELECT s.*, u.name AS userName
     FROM profilecompletionsession s
     JOIN \`user\` u ON u.id = s.userId
     WHERE s.token = ?`,
    [token]
  );
}

export async function validateCompletionToken(token, { requireActive = false } = {}) {
  const session = await getSessionByToken(token);
  if (!session) return { ok: false, error: 'Invalid or expired link', status: 404 };
  if (new Date(session.expiresAt) < new Date()) {
    await execute(`UPDATE profilecompletionsession SET status = 'EXPIRED' WHERE id = ?`, [session.id]);
    return { ok: false, error: 'This link has expired. Ask admin to send a new one.', status: 410 };
  }
  if (session.status === 'COMPLETED') {
    return { ok: false, error: 'This link was already used. Ask admin for a new link if needed.', status: 410 };
  }
  if (session.status === 'EXPIRED') {
    return { ok: false, error: 'This link has expired.', status: 410 };
  }
  if (requireActive && session.status !== 'ACTIVE') {
    return { ok: false, error: 'Please open the link from your email and confirm your email address first.', status: 403 };
  }
  return { ok: true, session };
}

/** User confirms email on the invite landing page */
export async function verifyCompletionEmail(token, emailInput) {
  const check = await validateCompletionToken(token);
  if (!check.ok) return check;

  const session = check.session;
  const entered = normalizeEmail(emailInput);
  const expected = normalizeEmail(session.email);

  if (!entered || entered !== expected) {
    return {
      ok: false,
      error: 'Email does not match. Use the same email address where you received this link.',
      status: 403,
    };
  }

  await execute(
    `UPDATE profilecompletionsession SET status = 'ACTIVE', emailVerifiedAt = NOW() WHERE id = ?`,
    [session.id]
  );

  return {
    ok: true,
    email: session.email,
    onboardingUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://vivahdwar.com'}/onboarding?email=${encodeURIComponent(session.email)}&completionToken=${token}`,
  };
}

export async function getLatestInviteForUser(userId) {
  await ensureProfileCompletionTable();
  return queryOne(
    `SELECT id, status, expiresAt, emailVerifiedAt, createdAt
     FROM profilecompletionsession
     WHERE userId = ?
     ORDER BY createdAt DESC LIMIT 1`,
    [userId]
  );
}

export async function markCompletionSessionDone(token) {
  const check = await validateCompletionToken(token, { requireActive: true });
  if (!check.ok) return;
  await execute(
    `UPDATE profilecompletionsession SET status = 'COMPLETED' WHERE id = ?`,
    [check.session.id]
  );
}
