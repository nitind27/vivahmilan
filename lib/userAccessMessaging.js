import { queryOne } from '@/lib/db';
import { getSiteConfig } from '@/lib/siteconfig';
import { getUserEarlyBirdStatus, getEarlyBirdSettings, formatDurationLabel } from '@/lib/earlyBird';

function formatEmailDate(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function trialHeadline(days) {
  const n = Math.max(1, parseInt(days, 10) || 1);
  return n === 1 ? '1-Day Free Trial' : `${n}-Day Free Trial`;
}

/**
 * Active premium access to mention in approval email / push (Early Bird takes priority over free trial).
 * @returns {Promise<null | {
 *   type: 'early_bird' | 'free_trial',
 *   badge: string,
 *   headline: string,
 *   description: string,
 *   validUntil: Date,
 *   validUntilLabel: string,
 *   planName?: string,
 * }>}
 */
export async function getUserAccessGrantForEmail(userId) {
  if (!userId) return null;

  const earlyBird = await getUserEarlyBirdStatus(userId);
  if (earlyBird) {
    const config = await getEarlyBirdSettings();
    const planRow = await queryOne(
      'SELECT displayName FROM planconfig WHERE plan = ? LIMIT 1',
      [earlyBird.plan]
    );
    const planName = planRow?.displayName || earlyBird.plan || 'Premium';
    const durationLabel = formatDurationLabel(config);
    const validUntil = earlyBird.expiry instanceof Date ? earlyBird.expiry : new Date(earlyBird.expiry);

    return {
      type: 'early_bird',
      badge: 'Early Bird — Free Full Access',
      headline: durationLabel,
      planName,
      description: `You have complimentary <strong>${planName}</strong> access for <strong>${durationLabel}</strong> under our Early Bird offer. Enjoy unlimited chat, contact details, advanced filters, and more.`,
      validUntil,
      validUntilLabel: formatEmailDate(validUntil),
    };
  }

  const user = await queryOne(
    `SELECT freeTrialExpiry, isPremium, premiumPlan, premiumExpiry
     FROM \`user\` WHERE id = ?`,
    [userId]
  );
  if (!user?.freeTrialExpiry) return null;

  const expiry = new Date(user.freeTrialExpiry);
  if (expiry <= new Date()) return null;

  const daysLeft = Math.max(1, Math.ceil((expiry - new Date()) / 86400000));

  return {
    type: 'free_trial',
    badge: 'Complimentary Premium Trial',
    headline: trialHeadline(daysLeft),
    description:
      'Full premium access is active on your account — unlimited chat, view contacts, advanced filters, and more.',
    validUntil: expiry,
    validUntilLabel: formatEmailDate(expiry),
  };
}

/** Whether admin approval should set freeTrialExpiry (not for Early Bird / existing premium). */
export async function shouldGrantFreeTrialOnApproval(userId, freeTrialUsed) {
  if (freeTrialUsed) return false;

  const trialDays = parseInt(await getSiteConfig('freeTrialDays') || '1', 10);
  if (trialDays <= 0) return false;

  if (await getUserEarlyBirdStatus(userId)) return false;

  const user = await queryOne(
    `SELECT isPremium, premiumExpiry FROM \`user\` WHERE id = ?`,
    [userId]
  );
  if (user?.isPremium && user.premiumExpiry && new Date(user.premiumExpiry) > new Date()) {
    return false;
  }

  return true;
}

export async function isFreeTrialEmailEnabled() {
  const v = await getSiteConfig('freeTrialEmailEnabled');
  return v !== '0' && v !== 'false';
}

export function buildApprovalEmailSubject(name, accessGrant, showAccessGift) {
  if (showAccessGift && accessGrant?.type === 'early_bird') {
    return `✅ ${name}, your profile is verified — Early Bird access is active!`;
  }
  if (showAccessGift && accessGrant?.type === 'free_trial') {
    return `✅ ${name}, your profile is verified — ${accessGrant.headline} started!`;
  }
  return `✅ Your Vivah Dwar profile is verified!`;
}

export function buildApprovalPushBody(accessGrant, showAccessGift) {
  if (!showAccessGift || !accessGrant) {
    return 'Your profile has been verified. Log in to start finding matches.';
  }
  if (accessGrant.type === 'early_bird') {
    return `Welcome! Your Early Bird access (${accessGrant.headline}) is active until ${accessGrant.validUntilLabel}.`;
  }
  return `Welcome! Your ${accessGrant.headline} is active until ${accessGrant.validUntilLabel}.`;
}

export function buildApprovalNotificationMessage(accessGrant, showAccessGift) {
  if (!showAccessGift || !accessGrant) {
    return 'Your profile has been verified by our team. You can now log in and start matching.';
  }
  if (accessGrant.type === 'early_bird') {
    return `Your profile is verified. Early Bird free access (${accessGrant.headline}) is active until ${accessGrant.validUntilLabel}.`;
  }
  return `Your profile is verified. Your ${accessGrant.headline} is active until ${accessGrant.validUntilLabel}.`;
}
