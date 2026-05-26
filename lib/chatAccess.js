/** Whether the user may use chat (premium valid or active free trial). */
export function resolveChatAccess(dbUser) {
  if (!dbUser) {
    return { hasAccess: false, reason: 'no_access' };
  }

  const now = new Date();
  const trialExpiry = dbUser.freeTrialExpiry ? new Date(dbUser.freeTrialExpiry) : null;
  const premiumExpiry = dbUser.premiumExpiry ? new Date(dbUser.premiumExpiry) : null;

  if (trialExpiry && trialExpiry > now) {
    return {
      hasAccess: true,
      source: 'trial',
      freeTrialExpiry: trialExpiry.toISOString(),
    };
  }

  const premiumValid =
    !!dbUser.isPremium && (!premiumExpiry || premiumExpiry > now);

  if (premiumValid) {
    return {
      hasAccess: true,
      source: 'premium',
      premiumPlan: dbUser.premiumPlan || null,
      premiumExpiry: premiumExpiry ? premiumExpiry.toISOString() : null,
    };
  }

  if (dbUser.isPremium && premiumExpiry && premiumExpiry <= now) {
    return {
      hasAccess: false,
      reason: 'premium_expired',
      premiumPlan: dbUser.premiumPlan || null,
      premiumExpiry: premiumExpiry.toISOString(),
    };
  }

  if (dbUser.freeTrialExpiry && trialExpiry && trialExpiry <= now) {
    return {
      hasAccess: false,
      reason: 'trial_expired',
      freeTrialExpiry: trialExpiry.toISOString(),
    };
  }

  return { hasAccess: false, reason: 'no_access' };
}
