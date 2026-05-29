import { queryOne } from './db.js';
import { getPremiumPlanDetails } from './premiumPlanDetails.js';

function parsePermissions(raw) {
  if (!raw) return {};
  if (typeof raw === 'object') return raw;
  try { return JSON.parse(raw || '{}'); } catch { return {}; }
}

export async function getUserPlanPermissions(userId) {
  const user = await queryOne(
    'SELECT isPremium, premiumPlan, freeTrialExpiry FROM `user` WHERE id = ?',
    [userId]
  );
  if (!user) return parsePermissions(null);

  const trialActive = user.freeTrialExpiry && new Date(user.freeTrialExpiry) > new Date();
  const active = await getPremiumPlanDetails(userId, user.premiumPlan);

  if (active && active.plan && active.plan !== 'FREE') {
    return { ...parsePermissions(active.permissions), _plan: active.plan, _active: true };
  }

  if (trialActive || user.isPremium) {
    const planKey = user.premiumPlan || 'SILVER';
    const cfg = await queryOne('SELECT permissions FROM planconfig WHERE plan = ?', [planKey]);
    if (cfg) return { ...parsePermissions(cfg.permissions), _plan: planKey, _trial: trialActive };
  }

  const freePlan = await queryOne(`SELECT permissions FROM planconfig WHERE plan = 'FREE'`);
  return { ...parsePermissions(freePlan?.permissions), _plan: 'FREE', _active: false };
}

/** Active paid subscription with feature flag (strict — no free plan). */
export async function hasPremiumFeature(userId, feature) {
  const user = await queryOne(
    'SELECT isPremium, premiumPlan, freeTrialExpiry FROM `user` WHERE id = ?',
    [userId]
  );
  if (!user) return false;

  const trialActive = user.freeTrialExpiry && new Date(user.freeTrialExpiry) > new Date();
  const active = await getPremiumPlanDetails(userId, user.premiumPlan);

  if (active?.plan && active.plan !== 'FREE') {
    const perms = parsePermissions(active.permissions);
    return !!perms[feature];
  }

  if (trialActive) {
    const cfg = await queryOne('SELECT permissions FROM planconfig WHERE plan = ?', [user.premiumPlan || 'SILVER']);
    if (cfg) return !!parsePermissions(cfg.permissions)[feature];
  }

  return false;
}

export async function getUserAccessSummary(userId) {
  const perms = await getUserPlanPermissions(userId);
  const canSeeWhoViewed = await hasPremiumFeature(userId, 'canSeeWhoViewed');
  const aiMatchScore = await hasPremiumFeature(userId, 'aiMatchScore');
  const kundaliMatchPdf = await hasPremiumFeature(userId, 'kundaliMatchPdf');
  return {
    plan: perms._plan || 'FREE',
    isActive: !!perms._active,
    canSeeWhoViewed,
    aiMatchScore,
    kundaliMatchPdf,
    canChat: !!perms.canChat,
    canSeeContact: !!perms.canSeeContact,
    canBoostProfile: !!perms.canBoostProfile,
    unlimitedInterests: !!perms.unlimitedInterests,
    interestLimit: perms.interestLimit ?? 5,
  };
}
