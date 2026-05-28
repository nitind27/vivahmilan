import { queryOne, query, execute } from '@/lib/db';

export const MIN_PROFILE_PHOTOS = 1;
export const MIN_TOTAL_VISUALS = 2; // profile photo + family/lifestyle photo
export const MIN_PROFILE_COMPLETE = 100;
export const AUTO_HIDE_REPORT_THRESHOLD = 3;
export const REQUIRED_PROFILE_FIELDS = [
  'gender', 'dob', 'height', 'religion', 'education', 'profession', 'country', 'city', 'aboutMe',
];

export const APPROVAL_MESSAGES = {
  profileComplete: 'Profile must be fully completed (100%) before admin approval.',
  requiredFields: 'All mandatory profile fields must be filled before approval.',
  phone: 'A valid phone number is required on the account before approval.',
  photos: 'At least one profile photo is required before approval.',
  visualProof: 'Upload a profile photo and at least one family or lifestyle photo before approval.',
  document: 'An identity document (Aadhaar, PAN, Passport, etc.) must be uploaded before approval.',
  documentApproved: 'Identity document must be uploaded (pending or approved) before profile approval.',
  reports: 'This profile has multiple abuse reports and cannot be approved until reviewed.',
  submitted: 'User must submit their profile for review before approval.',
};

function normalizePhone(phone) {
  if (!phone || typeof phone !== 'string') return '';
  return phone.replace(/\s/g, '').trim();
}

export function isValidPhone(phone) {
  const p = normalizePhone(phone);
  return /^[+]?[\d\-()]{7,15}$/.test(p);
}

export async function fetchUserVerificationData(userId) {
  const user = await queryOne(
    'SELECT id, name, email, phone, adminVerified, isActive FROM `user` WHERE id = ?',
    [userId]
  );
  if (!user) return null;

  const profile = await queryOne('SELECT * FROM profile WHERE userId = ?', [userId]);
  const photos = await query('SELECT id, url, isMain, contentHash FROM photo WHERE userId = ?', [userId]).catch(() =>
    query('SELECT id, url, isMain FROM photo WHERE userId = ?', [userId])
  );
  const familyPhotos = await query('SELECT id FROM family_photo WHERE userId = ?', [userId]).catch(() => []);
  const documents = await query('SELECT id, status, type FROM document WHERE userId = ?', [userId]);
  const reportRow = await queryOne(
    'SELECT COUNT(*) AS cnt FROM report WHERE targetId = ? AND status IN (\'PENDING\', \'REVIEWED\')',
    [userId]
  );

  return {
    user,
    profile,
    photos: photos || [],
    familyPhotos: familyPhotos || [],
    documents: documents || [],
    reportCount: Number(reportRow?.cnt ?? 0),
  };
}

export function buildApprovalChecklist(data) {
  if (!data) {
    return { eligible: false, checklist: [], errors: ['User not found.'] };
  }

  const { user, profile, photos, familyPhotos, documents, reportCount } = data;
  const missingFields = REQUIRED_PROFILE_FIELDS.filter(f => !profile?.[f]);
  const profileCompleteOk = (profile?.profileComplete ?? 0) >= MIN_PROFILE_COMPLETE && missingFields.length === 0;
  const phoneOk = isValidPhone(user.phone);
  const profilePhotoOk = photos.length >= MIN_PROFILE_PHOTOS;
  const totalVisuals = photos.length + familyPhotos.length;
  const visualProofOk = profilePhotoOk && totalVisuals >= MIN_TOTAL_VISUALS;
  const hasDocument = documents.length > 0;
  const documentOk = hasDocument && documents.some(d => ['PENDING', 'APPROVED'].includes(d.status));
  const reportsOk = reportCount < AUTO_HIDE_REPORT_THRESHOLD;
  const submittedOk = (profile?.profileComplete ?? 0) >= MIN_PROFILE_COMPLETE;

  const checklist = [
    {
      id: 'profileComplete',
      label: 'Profile 100% complete',
      passed: profileCompleteOk,
      detail: missingFields.length
        ? `Missing: ${missingFields.join(', ')}`
        : `${profile?.profileComplete ?? 0}% complete`,
    },
    {
      id: 'phone',
      label: 'Valid phone number on file',
      passed: phoneOk,
      detail: phoneOk ? user.phone : 'Phone number is missing or invalid',
    },
    {
      id: 'photos',
      label: 'Profile photo uploaded',
      passed: profilePhotoOk,
      detail: profilePhotoOk ? `${photos.length} profile photo(s)` : 'No profile photo found',
    },
    {
      id: 'visualProof',
      label: 'Family / lifestyle photo uploaded',
      passed: visualProofOk,
      detail: visualProofOk
        ? `${totalVisuals} photo(s) total`
        : 'Add at least one family or lifestyle photo in addition to your profile photo',
    },
    {
      id: 'document',
      label: 'Identity document uploaded',
      passed: documentOk,
      detail: documentOk
        ? documents.map(d => `${d.type} (${d.status})`).join(', ')
        : 'Upload Aadhaar, PAN, Passport, or another valid ID',
    },
    {
      id: 'submitted',
      label: 'Submitted for admin review',
      passed: submittedOk,
      detail: submittedOk ? 'Ready for review' : 'User has not submitted profile for review',
    },
    {
      id: 'reports',
      label: 'No critical abuse reports',
      passed: reportsOk,
      detail: reportsOk
        ? reportCount === 0 ? 'No open reports' : `${reportCount} report(s) on file`
        : `${reportCount} reports — profile auto-hidden pending investigation`,
    },
  ];

  const errors = [];
  if (!profileCompleteOk) errors.push(APPROVAL_MESSAGES.requiredFields);
  if (!phoneOk) errors.push(APPROVAL_MESSAGES.phone);
  if (!profilePhotoOk) errors.push(APPROVAL_MESSAGES.photos);
  if (!visualProofOk) errors.push(APPROVAL_MESSAGES.visualProof);
  if (!documentOk) errors.push(APPROVAL_MESSAGES.document);
  if (!submittedOk) errors.push(APPROVAL_MESSAGES.submitted);
  if (!reportsOk) errors.push(APPROVAL_MESSAGES.reports);

  const eligible = checklist.every(c => c.passed);

  return { eligible, checklist, errors, missingFields, reportCount };
}

export async function getApprovalChecklist(userId) {
  const data = await fetchUserVerificationData(userId);
  return buildApprovalChecklist(data);
}

export async function validateSubmitForReview(userId) {
  const result = await getApprovalChecklist(userId);
  if (result.eligible) {
    return { ok: true, ...result };
  }
  return {
    ok: false,
    code: 'SUBMIT_REQUIREMENTS_NOT_MET',
    message: 'Your profile does not meet the verification requirements yet. Please complete all items below before submitting.',
    ...result,
  };
}

export async function validateAdminApproval(userId) {
  const result = await getApprovalChecklist(userId);
  if (result.eligible) {
    return { ok: true, ...result };
  }
  return {
    ok: false,
    code: 'APPROVAL_REQUIREMENTS_NOT_MET',
    message: 'This profile cannot be approved yet. The following verification requirements must be satisfied first.',
    ...result,
  };
}

/** SHA-256 hash for duplicate photo detection */
export async function hashFileBuffer(buffer) {
  const { createHash } = await import('crypto');
  return createHash('sha256').update(buffer).digest('hex');
}

export async function findDuplicatePhotoHash(contentHash, excludeUserId) {
  if (!contentHash) return null;
  try {
    const row = await queryOne(
      'SELECT userId, url FROM photo WHERE contentHash = ? AND userId != ? LIMIT 1',
      [contentHash, excludeUserId]
    );
    return row || null;
  } catch {
    return null;
  }
}

export async function savePhotoContentHash(photoId, contentHash) {
  if (!contentHash) return;
  try {
    await execute('UPDATE photo SET contentHash = ? WHERE id = ?', [contentHash, photoId]);
  } catch {
    // column may not exist yet
  }
}
