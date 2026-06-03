import { randomBytes } from 'crypto';
import { execute, queryOne } from '@/lib/db.js';
import { ensureFeatureTables } from '@/lib/ensureFeatureTables.js';
import { ABOUT_ME_MIN_WORDS } from '@/lib/aboutMeValidation.js';
import { fetchUserVerificationData, buildApprovalChecklist } from '@/lib/profileVerification.js';
import { CORRECTION_FIELD_OPTIONS, CORRECTION_FIELD_KEYS } from '@/lib/profileCorrectionFields.js';

export { CORRECTION_FIELD_OPTIONS } from '@/lib/profileCorrectionFields.js';

const VALID_KEYS = CORRECTION_FIELD_KEYS;

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

const MISSING_FIELD_TO_CORRECTION = {
  gender: 'basic_info',
  dob: 'basic_info',
  height: 'basic_info',
  aboutMe: 'basic_info',
  religion: 'religion',
  education: 'career',
  profession: 'career',
  country: 'location',
  city: 'location',
};

function missingFieldsToCorrectionKeys(missingFields = []) {
  const keys = new Set();
  for (const f of missingFields) {
    const key = MISSING_FIELD_TO_CORRECTION[f];
    if (key) keys.add(key);
  }
  return [...keys];
}

/**
 * Infer correction checkboxes + user instructions from verification checklist failures.
 */
export function buildAutoCorrectionSuggestionFromData(data) {
  if (!data) {
    return {
      fields: ['profile_photo', 'identity_document'],
      message:
        'Dear member,\n\nThank you for joining Vivah Dwar. Our verification team reviewed your profile and needs a few updates before we can approve it. Please log in using the link in this email, update the sections indicated below, and save your profile.\n\nWe will review your updated profile within 24–48 hours.\n\nThank you.',
      checklist: [],
      failedItems: [],
    };
  }

  const { checklist, missingFields = [] } = buildApprovalChecklist(data, { mode: 'admin' });
  const fieldSet = new Set();
  const bullets = [];

  for (const item of checklist) {
    if (item.passed || item.id === 'submitted') continue;

    switch (item.id) {
      case 'profileComplete': {
        missingFieldsToCorrectionKeys(missingFields).forEach((k) => fieldSet.add(k));
        if (missingFields.includes('aboutMe')) {
          bullets.push(
            `About Me: Please write at least ${ABOUT_ME_MIN_WORDS} words about yourself, your background, and what you are looking for in a partner.`
          );
        }
        const other = missingFields.filter((f) => f !== 'aboutMe');
        if (other.length) {
          bullets.push(
            `Profile details: Please complete the following required fields: ${other.join(', ')}.`
          );
        } else if (!missingFields.includes('aboutMe') && item.detail && !item.detail.startsWith('All')) {
          bullets.push(`Profile details: ${item.detail}.`);
        }
        break;
      }
      case 'phone':
        fieldSet.add('phone');
        bullets.push(
          'Phone number: Add a valid mobile number (with country code) on your account so our team can contact you if needed during verification.'
        );
        break;
      case 'photos':
        fieldSet.add('profile_photo');
        bullets.push(
          'Profile photo: Upload a clear, recent photo with your face fully visible. Avoid group photos, sunglasses, heavy filters, or blurry images.'
        );
        break;
      case 'visualProof': {
        const photoCount = data.photos?.length || 0;
        const familyCount = data.familyPhotos?.length || 0;
        if (photoCount < 1) fieldSet.add('profile_photo');
        if (photoCount + familyCount < 2 || familyCount < 1) fieldSet.add('family_photos');
        bullets.push(
          'Family / lifestyle photo: Add at least one additional photo besides your main profile picture (for example a family, casual, or lifestyle photo).'
        );
        break;
      }
      case 'document': {
        fieldSet.add('identity_document');
        const rejected = (data.documents || []).filter((d) => d.status === 'REJECTED');
        if (rejected.length) {
          const types = rejected.map((d) => d.type || 'document').join(', ');
          bullets.push(
            `Identity document: Your uploaded ID (${types}) was not accepted. Please upload a clear, readable image of Aadhaar, PAN, Passport, or another valid government ID (all corners visible, no glare or blur).`
          );
        } else {
          bullets.push(
            'Identity document: Upload a clear photo of Aadhaar, PAN, Passport, or another valid government-issued ID. Ensure your name and photo are readable.'
          );
        }
        break;
      }
      case 'reports':
        bullets.push(
          'Profile review: Your account is under additional review. Please ensure all photos and information are accurate, appropriate, and match your identity document.'
        );
        break;
      default:
        if (item.detail) bullets.push(`${item.label}: ${item.detail}.`);
    }
  }

  const rejectedDocs = (data.documents || []).filter((d) => d.status === 'REJECTED');
  if (rejectedDocs.length) {
    fieldSet.add('identity_document');
    const types = rejectedDocs.map((d) => d.type || 'ID').join(', ');
    if (!bullets.some((b) => b.toLowerCase().includes('identity document'))) {
      bullets.push(
        `Identity document: Please resubmit your ID — ${types} was not accepted. Upload a clear, full image with no blur or cropped edges.`
      );
    }
  }

  let fields = normalizeCorrectionFields([...fieldSet]);
  if (!fields.length) {
    fields = ['profile_photo', 'identity_document'];
  }

  const uniqueBullets = [...new Set(bullets)];
  let message;
  if (uniqueBullets.length) {
    const numbered = uniqueBullets.map((b, i) => `${i + 1}. ${b}`).join('\n\n');
    message = `Dear member,\n\nThank you for joining Vivah Dwar. Our verification team reviewed your profile and needs the following updates before we can approve it:\n\n${numbered}\n\nPlease log in using the button in this email, update the highlighted sections in your profile, and save your changes. We will review your updated profile within 24–48 hours.\n\nThank you for your cooperation,\nVivah Dwar Verification Team`;
  } else {
    message = `Dear member,\n\nThank you for joining Vivah Dwar. Our verification team reviewed your profile and needs a few updates before we can approve it. Please log in using the link in this email, review the sections marked below, make the requested changes, and save your profile.\n\nWe will review your updated profile within 24–48 hours.\n\nThank you,\nVivah Dwar Verification Team`;
  }

  const failedItems = checklist.filter((c) => !c.passed && c.id !== 'submitted');

  return { fields, message, checklist, failedItems };
}

export async function getAutoCorrectionSuggestion(userId) {
  const data = await fetchUserVerificationData(userId);
  return buildAutoCorrectionSuggestionFromData(data);
}
