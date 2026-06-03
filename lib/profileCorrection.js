import { randomBytes } from 'crypto';
import { execute, queryOne } from '@/lib/db.js';
import { ensureFeatureTables } from '@/lib/ensureFeatureTables.js';

/** Fields admin can ask the member to fix (maps to onboarding step index). */
export const CORRECTION_FIELD_OPTIONS = [
  { key: 'profile_photo', label: 'Profile photo (wrong / unclear)', step: 5 },
  { key: 'family_photos', label: 'Family / lifestyle photos', step: 5 },
  { key: 'identity_document', label: 'Identity document (Aadhaar, PAN, etc.)', step: 5 },
  { key: 'basic_info', label: 'Basic info (name, DOB, height, about me…)', step: 0 },
  { key: 'religion', label: 'Religion & community details', step: 1 },
  { key: 'location', label: 'Location (city, state, country)', step: 2 },
  { key: 'career', label: 'Education & profession', step: 3 },
  { key: 'family', label: 'Family background', step: 4 },
  { key: 'phone', label: 'Phone number', step: 0 },
  { key: 'email', label: 'Email address (see admin note — contact if needed)', step: -1 },
];

const VALID_KEYS = new Set(CORRECTION_FIELD_OPTIONS.map((f) => f.key));

export function normalizeCorrectionFields(fields) {
  if (!Array.isArray(fields)) return [];
  return [...new Set(fields.map((f) => String(f).trim()).filter((f) => VALID_KEYS.has(f)))];
}

export function parseCorrectionFieldsJson(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return normalizeCorrectionFields(Array.isArray(parsed) ? parsed : []);
  } catch {
    return [];
  }
}

export function correctionFieldLabels(keys) {
  return keys
    .map((k) => CORRECTION_FIELD_OPTIONS.find((o) => o.key === k)?.label || k)
    .filter(Boolean);
}

export function buildCorrectionOnboardingUrl(email, token = null) {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://vivahdwar.com';
  const params = new URLSearchParams({
    email: String(email || '').trim(),
    correction: '1',
  });
  if (token) params.set('token', token);
  return `${base}/onboarding?${params.toString()}`;
}

export function generateCorrectionToken() {
  return randomBytes(24).toString('hex');
}

export async function getUserCorrectionState(userId) {
  await ensureFeatureTables();
  const row = await queryOne(
    `SELECT id, email, name, adminVerified, profileCorrectionRequired, profileCorrectionNote,
            profileCorrectionFields, profileCorrectionRequestedAt, profileCorrectionToken
     FROM \`user\` WHERE id = ?`,
    [userId]
  );
  if (!row) return null;
  const fields = parseCorrectionFieldsJson(row.profileCorrectionFields);
  return {
    ...row,
    profileCorrectionRequired: !!row.profileCorrectionRequired,
    fields,
    correctionUrl: row.email
      ? buildCorrectionOnboardingUrl(row.email, row.profileCorrectionToken)
      : null,
  };
}

export async function verifyCorrectionAccess(email, token) {
  const user = await queryOne(
    `SELECT id, email, profileCorrectionRequired, profileCorrectionToken
     FROM \`user\` WHERE email = ?`,
    [email]
  );
  if (!user) return { ok: false, error: 'User not found' };
  if (!user.profileCorrectionRequired) return { ok: true, user, requiresCorrection: false };
  if (token && user.profileCorrectionToken && token === user.profileCorrectionToken) {
    return { ok: true, user, requiresCorrection: true };
  }
  return { ok: true, user, requiresCorrection: true, tokenOptional: true };
}

/** Admin requests profile edits — user can log in and fix on onboarding. */
export async function requestProfileCorrection(userId, { message, fields, sendEmail = true, adminId, adminName }) {
  await ensureFeatureTables();
  const normalized = normalizeCorrectionFields(fields);
  if (!message || String(message).trim().length < 10) {
    return { ok: false, error: 'Please provide instructions (at least 10 characters)', status: 400 };
  }
  if (!normalized.length) {
    return { ok: false, error: 'Select at least one item for the user to update', status: 400 };
  }

  const user = await queryOne(
    `SELECT id, name, email, adminVerified, isActive FROM \`user\` WHERE id = ?`,
    [userId]
  );
  if (!user) return { ok: false, error: 'User not found', status: 404 };
  if (user.adminVerified) {
    return { ok: false, error: 'Profile is already approved — use profile edit or member tools', status: 400 };
  }
  if (!user.isActive) {
    return { ok: false, error: 'Cannot request edits on a rejected/inactive account', status: 400 };
  }

  const token = generateCorrectionToken();
  const fieldsJson = JSON.stringify(normalized);

  await execute(
    `UPDATE \`user\` SET
      profileCorrectionRequired = 1,
      profileCorrectionNote = ?,
      profileCorrectionFields = ?,
      profileCorrectionRequestedAt = NOW(),
      profileCorrectionToken = ?,
      profileRejectionReason = NULL,
      profileRejectedAt = NULL,
      updatedAt = NOW()
     WHERE id = ?`,
    [String(message).trim(), fieldsJson, token, userId]
  );

  const correctionUrl = buildCorrectionOnboardingUrl(user.email, token);
  const fieldLabels = correctionFieldLabels(normalized);

  let emailSent = false;
  if (sendEmail && user.email) {
    try {
      const { sendProfileCorrectionEmail } = await import('@/lib/email.js');
      await sendProfileCorrectionEmail(user.email, user.name || 'Member', {
        message: String(message).trim(),
        fields: fieldLabels,
        correctionUrl,
      });
      emailSent = true;
    } catch (e) {
      console.error('[profileCorrection] email:', e.message);
    }
  }

  const notifTitle = 'Please update your profile';
  const notifBody = `${fieldLabels.slice(0, 2).join(', ')}${fieldLabels.length > 2 ? '…' : ''} — open the link in your email to fix and resubmit.`;

  try {
    const { randomUUID } = await import('crypto');
    await execute(
      `INSERT INTO notification (id, userId, type, title, message, isRead, link, createdAt)
       VALUES (?, ?, 'SYSTEM', ?, ?, 0, ?, NOW())`,
      [randomUUID(), userId, notifTitle, notifBody.slice(0, 500), '/onboarding?correction=1']
    );
    const io = global.getIO?.();
    if (io) io.to(`user:${userId}`).emit('notification:new', { userId });
  } catch (e) {
    console.error('[profileCorrection] notification:', e.message);
  }

  try {
    const { sendPushToUser } = await import('@/lib/webpush.js');
    await sendPushToUser(userId, {
      title: '✏️ Profile update required',
      body: notifBody.slice(0, 120),
      url: correctionUrl,
    });
  } catch {}

  return {
    ok: true,
    correctionUrl,
    emailSent,
    fields: normalized,
    adminId,
    adminName,
  };
}

export async function clearProfileCorrection(userId) {
  await ensureFeatureTables();
  await execute(
    `UPDATE \`user\` SET
      profileCorrectionRequired = 0,
      profileCorrectionNote = NULL,
      profileCorrectionFields = NULL,
      profileCorrectionRequestedAt = NULL,
      profileCorrectionToken = NULL,
      updatedAt = NOW()
     WHERE id = ?`,
    [userId]
  );
}

export function primaryCorrectionStep(fields) {
  const steps = fields
    .map((k) => CORRECTION_FIELD_OPTIONS.find((o) => o.key === k)?.step)
    .filter((s) => s != null && s >= 0);
  if (!steps.length) return 0;
  return Math.min(...steps);
}
