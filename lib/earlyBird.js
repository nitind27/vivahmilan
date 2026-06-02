import { randomUUID } from 'crypto';
import { queryOne, execute } from '@/lib/db';
import { getSiteConfig } from '@/lib/siteconfig';
import { DEFAULT_EARLY_BIRD_SETTINGS } from '@/lib/defaultPlans';

const CONFIG_KEY = 'early_bird_settings';

export async function getEarlyBirdSettings() {
  try {
    const raw = await getSiteConfig(CONFIG_KEY);
    if (!raw) return { ...DEFAULT_EARLY_BIRD_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_EARLY_BIRD_SETTINGS,
      ...parsed,
      limit: Math.max(0, parseInt(parsed.limit, 10) || 0),
      claimed: Math.max(0, parseInt(parsed.claimed, 10) || 0),
      durationDays: Math.max(1, parseInt(parsed.durationDays, 10) || 365),
    };
  } catch {
    return { ...DEFAULT_EARLY_BIRD_SETTINGS };
  }
}

/**
 * Assign free premium to new user if Early Bird slots remain.
 * @returns {{ assigned: boolean, planId?: string, endDate?: Date, slot?: number, limit?: number, reason?: string }}
 */
export async function tryAssignEarlyBirdToUser(userId) {
  if (!userId) return { assigned: false, reason: 'no_user' };

  const already = await queryOne(
    `SELECT id FROM subscription WHERE userId = ? AND paymentId = 'EARLY_BIRD' AND status = 'ACTIVE' LIMIT 1`,
    [userId]
  );
  if (already) return { assigned: false, reason: 'already_assigned' };

  const config = await getEarlyBirdSettings();
  if (!config.enabled) return { assigned: false, reason: 'disabled' };
  if (config.claimed >= config.limit) return { assigned: false, reason: 'limit_reached' };

  const planId = config.planId || 'GOLD';
  const durationDays = config.durationDays || 365;
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

  const newClaimed = (config.claimed || 0) + 1;
  await execute('UPDATE siteconfig SET value = ?, updatedAt = NOW() WHERE `key` = ?', [
    JSON.stringify({ ...config, claimed: newClaimed }),
    CONFIG_KEY,
  ]);

  return {
    assigned: true,
    planId,
    startDate,
    endDate,
    durationDays,
    slot: newClaimed,
    limit: config.limit,
  };
}

export async function getUserEarlyBirdStatus(userId) {
  const sub = await queryOne(
    `SELECT plan, startDate, endDate FROM subscription
     WHERE userId = ? AND paymentId = 'EARLY_BIRD' AND status = 'ACTIVE'
     ORDER BY endDate DESC LIMIT 1`,
    [userId]
  );
  if (!sub) return null;

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
