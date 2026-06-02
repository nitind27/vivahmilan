import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { queryOne, execute } from '@/lib/db';
import { getSiteConfig } from '@/lib/siteconfig';

/** Parse admin input: "email:password" per line/comma; plain email = bypass only */
export function parseDeveloperAccessInput(raw) {
  if (!raw || typeof raw !== 'string') return { accounts: [], emailsOnly: [] };

  const entries = raw
    .split(/[\n\r,;]+/)
    .map(s => s.trim())
    .filter(Boolean);

  const accounts = [];
  const emailsOnly = [];

  for (const entry of entries) {
    const colonIdx = entry.indexOf(':');
    if (colonIdx > 0 && entry.includes('@')) {
      const email = entry.slice(0, colonIdx).trim().toLowerCase();
      const password = entry.slice(colonIdx + 1).trim();
      if (email && password.length >= 6) accounts.push({ email, password });
    } else if (entry.includes('@')) {
      emailsOnly.push(entry.trim().toLowerCase());
    }
  }

  return { accounts, emailsOnly };
}

export function extractDeveloperEmail(entry) {
  const s = String(entry || '').trim().toLowerCase();
  if (!s) return '';
  const colon = s.indexOf(':');
  if (colon > 0 && s.includes('@')) return s.slice(0, colon).trim();
  return s;
}

export function parseDeveloperEmails(raw) {
  if (!raw || typeof raw !== 'string') return [];
  return raw
    .split(/[\n\r,;]+/)
    .map(extractDeveloperEmail)
    .filter(e => e.includes('@'));
}

const DEV_PROFILE = {
  gender: 'MALE',
  dob: '1990-01-01',
  height: '170',
  religion: 'Hindu',
  education: 'Graduate',
  profession: 'Developer',
  country: 'India',
  city: 'Mumbai',
  aboutMe: 'Developer portal test account.',
};

/** Create or update a login-ready user with hashed password */
export async function provisionDeveloperAccount(email, password) {
  const emailNorm = email.trim().toLowerCase();
  const hash = await bcrypt.hash(password, 10);
  const now = new Date();

  let user = await queryOne(
    'SELECT id, name FROM `user` WHERE email = ?',
    [emailNorm]
  );

  if (user) {
    await execute(
      `UPDATE \`user\` SET password = ?, isActive = 1, isVerified = 1, adminVerified = 1, updatedAt = ? WHERE id = ?`,
      [hash, now, user.id]
    );
  } else {
    const userId = randomUUID();
    const name = emailNorm.split('@')[0] || 'Developer';
    await execute(
      `INSERT INTO \`user\` (id, name, email, password, phone, role, isActive, isVerified, adminVerified, verificationBadge, isPremium, profileBoost, phoneVerified, loginOtpEnabled, emailVerified, createdAt, updatedAt, needsPassword)
       VALUES (?, ?, ?, ?, NULL, 'USER', 1, 1, 1, 0, 0, 0, 0, 0, NOW(), ?, ?, 0)`,
      [userId, name, emailNorm, hash, now, now]
    );
    user = { id: userId, name };
  }

  const profile = await queryOne('SELECT id FROM profile WHERE userId = ?', [user.id]);
  if (profile) {
    await execute(
      `UPDATE profile SET gender = ?, dob = ?, height = ?, religion = ?, education = ?, profession = ?, country = ?, city = ?, aboutMe = ?, profileComplete = 100, updatedAt = ? WHERE userId = ?`,
      [
        DEV_PROFILE.gender,
        DEV_PROFILE.dob,
        DEV_PROFILE.height,
        DEV_PROFILE.religion,
        DEV_PROFILE.education,
        DEV_PROFILE.profession,
        DEV_PROFILE.country,
        DEV_PROFILE.city,
        DEV_PROFILE.aboutMe,
        now,
        user.id,
      ]
    );
  } else {
    await execute(
      `INSERT INTO profile (id, userId, gender, dob, height, religion, education, profession, country, city, aboutMe, profileComplete, maritalStatus, smoking, drinking, hidePhone, hidePhoto, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 100, 'NEVER_MARRIED', 'NO', 'NO', 0, 0, ?, ?)`,
      [
        randomUUID(),
        user.id,
        DEV_PROFILE.gender,
        DEV_PROFILE.dob,
        DEV_PROFILE.height,
        DEV_PROFILE.religion,
        DEV_PROFILE.education,
        DEV_PROFILE.profession,
        DEV_PROFILE.country,
        DEV_PROFILE.city,
        DEV_PROFILE.aboutMe,
        now,
        now,
      ]
    );
  }

  return { id: user.id, email: emailNorm, name: user.name };
}

export async function saveDeveloperPortalEmails(emails) {
  const unique = [...new Set(emails.map(e => extractDeveloperEmail(e)).filter(e => e.includes('@')))];
  const value = unique.join(', ');
  const existing = await queryOne('SELECT id FROM siteconfig WHERE `key` = ?', ['developer_portal_emails']);
  if (existing) {
    await execute('UPDATE siteconfig SET value = ?, updatedAt = NOW() WHERE `key` = ?', [value, 'developer_portal_emails']);
  } else {
    await execute(
      'INSERT INTO siteconfig (id, `key`, value, updatedAt, createdAt) VALUES (?, ?, ?, NOW(), NOW())',
      [randomUUID(), 'developer_portal_emails', value]
    );
  }
  return unique;
}

export async function isDeveloperBypassEmail(email) {
  if (!email) return false;
  const raw = await getSiteConfig('developer_portal_emails');
  const list = parseDeveloperEmails(raw);
  return list.includes(String(email).trim().toLowerCase());
}
