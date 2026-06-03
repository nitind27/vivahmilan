import { queryOne } from '@/lib/db';

const MESSAGES = {
  GENDER_MISMATCH:
    'This profile is only visible to members of the opposite gender, as per our matching policy.',
  RELIGION_MISMATCH:
    'This profile is only visible to members of the same religion.',
  GOTRA_MISMATCH:
    'Profiles with the same gotra cannot view each other, as per Hindu tradition.',
  PROFILE_UNAVAILABLE:
    'This profile is not available or has not been verified yet.',
  BLOCKED:
    'This profile is unavailable due to a block between you and this member.',
  INCOMPLETE_PROFILE:
    'Please complete your profile (gender, religion) before viewing shared profiles.',
};

/** Fetch user + profile fields needed for match checks. */
export async function getUserMatchProfile(userId) {
  return queryOne(
    `SELECT u.id, u.role, u.isActive, u.adminVerified,
            p.gender, p.religion, p.caste, p.gotra
     FROM \`user\` u
     LEFT JOIN profile p ON p.userId = u.id
     WHERE u.id = ?`,
    [userId]
  );
}

/**
 * Check if viewer can see target profile (same rules as matches/search).
 * @returns {{ allowed: boolean, code?: string, reason?: string }}
 */
export function checkProfileViewAccess(viewer, targetUser, targetProfile) {
  if (!viewer || !targetUser) {
    return { allowed: false, code: 'PROFILE_UNAVAILABLE', reason: MESSAGES.PROFILE_UNAVAILABLE };
  }

  if (viewer.id === targetUser.id) return { allowed: true };
  if (viewer.role === 'ADMIN') return { allowed: true };

  if (!targetUser.isActive || !targetUser.adminVerified) {
    return { allowed: false, code: 'PROFILE_UNAVAILABLE', reason: MESSAGES.PROFILE_UNAVAILABLE };
  }

  const vGender = viewer.gender?.toUpperCase?.() || viewer.gender;
  const tGender = targetProfile?.gender?.toUpperCase?.() || targetProfile?.gender;

  if (vGender && tGender) {
    const expected = vGender === 'MALE' ? 'FEMALE' : 'MALE';
    if (tGender !== expected) {
      return { allowed: false, code: 'GENDER_MISMATCH', reason: MESSAGES.GENDER_MISMATCH };
    }
  }

  const vReligion = viewer.religion?.trim();
  const tReligion = targetProfile?.religion?.trim();

  if (vReligion) {
    if (!tReligion || vReligion.toLowerCase() !== tReligion.toLowerCase()) {
      return { allowed: false, code: 'RELIGION_MISMATCH', reason: MESSAGES.RELIGION_MISMATCH };
    }
  }

  const vGotra = viewer.gotra?.trim();
  const tGotra = targetProfile?.gotra?.trim();
  if (vGotra && tGotra && vGotra.toLowerCase() === tGotra.toLowerCase()) {
    return { allowed: false, code: 'GOTRA_MISMATCH', reason: MESSAGES.GOTRA_MISMATCH };
  }

  return { allowed: true };
}

export async function assertProfileViewAccess(viewerId, targetUserId) {
  if (viewerId === targetUserId) return { allowed: true };

  const [viewer, targetRow] = await Promise.all([
    getUserMatchProfile(viewerId),
    queryOne(
      `SELECT u.id, u.isActive, u.adminVerified,
              p.gender, p.religion, p.caste, p.gotra
       FROM \`user\` u
       LEFT JOIN profile p ON p.userId = u.id
       WHERE u.id = ?`,
      [targetUserId]
    ),
  ]);

  if (!targetRow) {
    return { allowed: false, code: 'PROFILE_UNAVAILABLE', reason: MESSAGES.PROFILE_UNAVAILABLE };
  }

  const targetUser = { id: targetRow.id, isActive: targetRow.isActive, adminVerified: targetRow.adminVerified };
  const targetProfile = targetRow;

  return checkProfileViewAccess(viewer, targetUser, targetProfile);
}

export function buildShareUrl(profileId) {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://vivahdwar.com';
  return `${base.replace(/\/$/, '')}/profile/${profileId}?share=1`;
}

export function buildShareMessage(name, profileId) {
  return `View ${name}'s matrimonial profile on Vivah Dwar:\n${buildShareUrl(profileId)}`;
}
