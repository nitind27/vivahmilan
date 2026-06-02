import { randomUUID } from 'crypto';
import { queryOne, execute } from '@/lib/db';
import { getSiteConfig } from '@/lib/siteconfig';
import { DEFAULT_EARLY_BIRD_SETTINGS } from '@/lib/defaultPlans';

const CONFIG_KEY = 'early_bird_settings';

export function resolveDurationDays(config) {
  const unit = config?.durationUnit === 'days' ? 'days' : 'years';
  const value = Math.max(1, parseInt(config?.durationValue, 10) || (unit === 'years' ? 1 : 365));
  if (unit === 'years') return value * 365;
  return value;
}

export function formatDurationLabel(config) {
  const unit = config?.durationUnit === 'days' ? 'days' : 'years';
  const value = Math.max(1, parseInt(config?.durationValue, 10) || (unit === 'years' ? 1 : 365));
  if (unit === 'years') return value === 1 ? '1 Year' : `${value} Years`;
  return value === 1 ? '1 Day' : `${value} Days`;
}

export function normalizeEarlyBirdSettings(raw) {
  const parsed = typeof raw === 'string' ? (() => { try { return JSON.parse(raw); } catch { return {}; } })() : raw || {};
  const unit = parsed.durationUnit === 'days' ? 'days' : 'years';
  const durationValue = Math.max(
    1,
    parseInt(parsed.durationValue, 10) ||
      (unit === 'years' ? 1 : parseInt(parsed.durationDays, 10) || 365)
  );
  const durationDays = unit === 'years' ? durationValue * 365 : durationValue;

  const limit = Math.max(1, parseInt(parsed.limit, 10) || 1000);
  const displayLimit = Math.max(1, parseInt(parsed.displayLimit, 10) || limit);
  const displayClaimed = Math.max(0, parseInt(parsed.displayClaimed, 10) || 0);

  return {
    ...DEFAULT_EARLY_BIRD_SETTINGS,
    ...parsed,
    enabled: parsed.enabled === true || parsed.enabled === 'true' || parsed.enabled === 1,
    limit,
    claimed: Math.max(0, parseInt(parsed.claimed, 10) || 0),
    displayLimit,
    displayClaimed,
    planId: parsed.planId || 'GOLD',
    durationUnit: unit,
    durationValue,
    durationDays,
    autoAssignOnSignup: parsed.autoAssignOnSignup === true || parsed.autoAssignOnSignup === 'true' || parsed.autoAssignOnSignup === 1,
    guestPopupEnabled: parsed.guestPopupEnabled !== false && parsed.guestPopupEnabled !== 'false' && parsed.guestPopupEnabled !== 0 && parsed.guestPopupEnabled !== '0',
    title: parsed.title || 'Early Bird Offer',
    subtitle: parsed.subtitle || 'First registered members get full premium access absolutely free!',
  };
}

/** Public offer summary for guest popup (no login). */
export async function getEarlyBirdGuestOffer() {
  const config = await getEarlyBirdSettings();
  const realClaimed = await getEarlyBirdClaimedCount();
  const real = getRealEarlyBirdCounts(config, realClaimed);
  const pub = getPublicEarlyBirdCounts(config);
  const durationLabel = formatDurationLabel(config);
  const planRow = await queryOne(
    'SELECT displayName FROM planconfig WHERE plan = ? LIMIT 1',
    [config.planId]
  );
  const planDisplayName = planRow?.displayName || config.planId;

  if (!config.enabled || !config.guestPopupEnabled) {
    return { show: false, reason: 'disabled' };
  }
  if (real.slotsLeft <= 0) {
    return { show: false, reason: 'sold_out', slotsLeft: 0, limit: pub.limit, claimedCount: pub.claimedCount };
  }

  return {
    show: true,
    title: config.title,
    subtitle: config.subtitle,
    planId: config.planId,
    planDisplayName,
    durationLabel,
    limit: pub.limit,
    claimedCount: pub.claimedCount,
    slotsLeft: pub.slotsLeft,
    message: `First ${pub.limit} members get ${planDisplayName} FREE for ${durationLabel}!`,
  };
}

export async function getEarlyBirdSettings() {
  try {
    const raw = await getSiteConfig(CONFIG_KEY);
    if (!raw) return normalizeEarlyBirdSettings({});
    return normalizeEarlyBirdSettings(JSON.parse(raw));
  } catch {
    return normalizeEarlyBirdSettings({});
  }
}

/** Counts shown on site / app (admin can set displayClaimed & displayLimit). */
export function getPublicEarlyBirdCounts(config) {
  const displayLimit = Math.max(1, parseInt(config?.displayLimit, 10) || config?.limit || 1000);
  const displayClaimed = Math.max(0, parseInt(config?.displayClaimed, 10) || 0);
  return {
    limit: displayLimit,
    claimedCount: displayClaimed,
    slotsLeft: Math.max(0, displayLimit - displayClaimed),
  };
}

export function getRealEarlyBirdCounts(config, realClaimed) {
  const limit = Math.max(1, parseInt(config?.limit, 10) || 1000);
  const claimed = Math.max(0, Number(realClaimed) || 0);
  return {
    limit,
    claimedCount: claimed,
    slotsLeft: Math.max(0, limit - claimed),
  };
}

/** How many users already claimed Early Bird (source of truth) */
export async function getEarlyBirdClaimedCount() {
  const row = await queryOne(
    `SELECT COUNT(DISTINCT userId) AS c FROM subscription WHERE paymentId = 'EARLY_BIRD'`
  );
  return Number(row?.c || 0);
}

export async function syncEarlyBirdClaimedCount() {
  const config = await getEarlyBirdSettings();
  const actual = await getEarlyBirdClaimedCount();
  const updated = { ...config, claimed: actual };
  await execute('UPDATE siteconfig SET value = ?, updatedAt = NOW() WHERE `key` = ?', [
    JSON.stringify(updated),
    CONFIG_KEY,
  ]);
  return updated;
}

async function persistEarlyBirdSettings(config) {
  await execute('UPDATE siteconfig SET value = ?, updatedAt = NOW() WHERE `key` = ?', [
    JSON.stringify(config),
    CONFIG_KEY,
  ]);
}

/**
 * Offer state for logged-in user (premium page / dashboard).
 */
export async function getEarlyBirdOfferForUser(userId) {
  const config = await getEarlyBirdSettings();
  const realClaimed = await getEarlyBirdClaimedCount();
  const real = getRealEarlyBirdCounts(config, realClaimed);
  const pub = getPublicEarlyBirdCounts(config);
  const durationLabel = formatDurationLabel(config);
  const planRow = await queryOne(
    'SELECT displayName FROM planconfig WHERE plan = ? LIMIT 1',
    [config.planId]
  );
  const planDisplayName = planRow?.displayName || config.planId;

  const active = userId ? await getUserEarlyBirdStatus(userId) : null;
  if (active) {
    return {
      status: 'active',
      enabled: config.enabled,
      isEarlyBird: true,
      plan: active.plan,
      planDisplayName,
      expiry: active.expiry,
      daysLeft: active.daysLeft,
      totalDays: active.totalDays,
      durationLabel,
      limit: pub.limit,
      claimedCount: pub.claimedCount,
      slotsLeft: pub.slotsLeft,
      label: active.label,
    };
  }

  if (!config.enabled) {
    return { status: 'disabled', enabled: false, limit: pub.limit, claimedCount: pub.claimedCount, slotsLeft: 0 };
  }

  if (real.slotsLeft <= 0) {
    return {
      status: 'sold_out',
      enabled: true,
      limit: pub.limit,
      claimedCount: pub.claimedCount,
      slotsLeft: 0,
      message: 'All available slots have been claimed.',
    };
  }

  if (!userId) {
    return {
      status: 'login_required',
      enabled: true,
      canClaim: false,
      limit: pub.limit,
      claimedCount: pub.claimedCount,
      slotsLeft: pub.slotsLeft,
      planId: config.planId,
      planDisplayName,
      durationLabel,
      durationDays: config.durationDays,
      title: config.title,
      subtitle: config.subtitle,
    };
  }

  return {
    status: 'eligible',
    enabled: true,
    canClaim: true,
    limit: pub.limit,
    claimedCount: pub.claimedCount,
    slotsLeft: pub.slotsLeft,
    planId: config.planId,
    planDisplayName,
    durationLabel,
    durationDays: config.durationDays,
    title: config.title,
    subtitle: config.subtitle,
    message: `Claim your free ${planDisplayName} access for ${durationLabel}. ${pub.slotsLeft} slots remaining.`,
  };
}

/**
 * Assign free premium if slots remain.
 */
export async function tryAssignEarlyBirdToUser(userId) {
  if (!userId) return { assigned: false, reason: 'no_user' };

  const existing = await queryOne(
    `SELECT id FROM subscription WHERE userId = ? AND paymentId = 'EARLY_BIRD' LIMIT 1`,
    [userId]
  );
  if (existing) {
    const active = await getUserEarlyBirdStatus(userId);
    return { assigned: false, reason: 'already_assigned', active };
  }

  const config = await getEarlyBirdSettings();
  if (!config.enabled) return { assigned: false, reason: 'disabled' };

  const realClaimed = await getEarlyBirdClaimedCount();
  if (realClaimed >= config.limit) {
    const pub = getPublicEarlyBirdCounts(config);
    return { assigned: false, reason: 'limit_reached', claimedCount: pub.claimedCount, limit: pub.limit };
  }

  const planId = config.planId || 'GOLD';
  const durationDays = resolveDurationDays(config);
  const startDate = new Date();
  const endDate = new Date(Date.now() + durationDays * 86400000);

  await execute(
    `INSERT INTO subscription (id, userId, plan, status, amount, currency, paymentId, startDate, endDate, createdAt)
     VALUES (?, ?, ?, 'ACTIVE', 0, 'INR', 'EARLY_BIRD', NOW(), ?, NOW())`,
    [randomUUID(), userId, planId, endDate]
  );

  await execute(
    'UPDATE `user` SET isPremium = 1, premiumPlan = ?, premiumExpiry = ?, updatedAt = NOW() WHERE id = ?',
    [planId, endDate, userId]
  );

  const newRealCount = realClaimed + 1;
  const newDisplayClaimed = Math.max(0, parseInt(config.displayClaimed, 10) || 0) + 1;
  const updatedConfig = {
    ...config,
    claimed: newRealCount,
    displayClaimed: newDisplayClaimed,
  };
  await persistEarlyBirdSettings(updatedConfig);

  const pub = getPublicEarlyBirdCounts(updatedConfig);

  return {
    assigned: true,
    planId,
    planDisplayName: (await queryOne('SELECT displayName FROM planconfig WHERE plan = ?', [planId]))?.displayName || planId,
    startDate,
    endDate,
    durationDays,
    durationLabel: formatDurationLabel(config),
    slot: newRealCount,
    limit: pub.limit,
    claimedCount: pub.claimedCount,
    slotsLeft: pub.slotsLeft,
  };
}

/** Auto-assign on signup only when admin enabled it */
export async function tryAutoAssignEarlyBirdOnSignup(userId) {
  const config = await getEarlyBirdSettings();
  if (!config.autoAssignOnSignup) return { assigned: false, reason: 'auto_disabled' };
  return tryAssignEarlyBirdToUser(userId);
}

/** User already claimed Early Bird (has EARLY_BIRD subscription) */
export async function hasUserClaimedEarlyBird(userId) {
  if (!userId) return false;
  const row = await queryOne(
    `SELECT id FROM subscription WHERE userId = ? AND paymentId = 'EARLY_BIRD' LIMIT 1`,
    [userId]
  );
  return !!row;
}

export async function hasSeenEarlyBirdPopup(userId) {
  return hasUserClaimedEarlyBird(userId);
}

export async function markEarlyBirdPopupSeen(userId) {
  if (!userId) return;
  const { ensureFeatureTables } = await import('@/lib/ensureFeatureTables.js');
  await ensureFeatureTables();
  const exists = await queryOne('SELECT userId FROM userpreference WHERE userId = ?', [userId]);
  if (!exists) {
    await execute(
      'INSERT INTO userpreference (userId, earlyBirdPopupSeen, updatedAt) VALUES (?, 1, NOW())',
      [userId]
    );
  } else {
    await execute(
      'UPDATE userpreference SET earlyBirdPopupSeen = 1, updatedAt = NOW() WHERE userId = ?',
      [userId]
    );
  }
}

/** Show popup only if user has not claimed Early Bird yet (ignore old popup-seen flags). */
export async function shouldShowEarlyBirdPopup(userId) {
  if (!userId) return false;
  if (await hasUserClaimedEarlyBird(userId)) return false;
  const offer = await getEarlyBirdOfferForUser(userId);
  return offer.status === 'eligible';
}

export async function getUserEarlyBirdStatus(userId) {
  const sub = await queryOne(
    `SELECT plan, startDate, endDate, status FROM subscription
     WHERE userId = ? AND paymentId = 'EARLY_BIRD'
     ORDER BY endDate DESC LIMIT 1`,
    [userId]
  );
  if (!sub || sub.status !== 'ACTIVE') return null;

  const user = await queryOne(
    'SELECT isPremium, premiumPlan, premiumExpiry FROM `user` WHERE id = ?',
    [userId]
  );
  if (!user?.isPremium) return null;

  const now = new Date();
  const end = user.premiumExpiry ? new Date(user.premiumExpiry) : sub.endDate ? new Date(sub.endDate) : null;
  if (!end || end <= now) return null;

  const start = sub.startDate ? new Date(sub.startDate) : now;
  const totalDays = Math.max(1, Math.ceil((end - start) / 86400000));
  const daysLeft = Math.max(0, Math.ceil((end - now) / 86400000));

  return {
    isEarlyBird: true,
    plan: user.premiumPlan || sub.plan || 'GOLD',
    expiry: end,
    startDate: start,
    daysLeft,
    totalDays,
    label: 'Early Bird — Free Full Access',
  };
}
