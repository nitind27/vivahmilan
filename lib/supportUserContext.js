import { queryOne } from '@/lib/db';
import { getUserEarlyBirdStatus } from '@/lib/earlyBird';

/** Context for support bot — Early Bird counts as full access but chat remains help-only. */
export async function getSupportUserContext(userId) {
  if (!userId) return {};
  try {
    const user = await queryOne(
      'SELECT name, isPremium, premiumPlan, premiumExpiry FROM `user` WHERE id = ?',
      [userId]
    );
    if (!user) return {};

    const premiumActive =
      !!user.isPremium && (!user.premiumExpiry || new Date(user.premiumExpiry) > new Date());
    const earlyBird = await getUserEarlyBirdStatus(userId);

    return {
      userName: user.name,
      isPremium: premiumActive,
      isEarlyBird: !!earlyBird,
      hasFullAccess: premiumActive,
      planLabel: earlyBird?.label || (premiumActive ? user.premiumPlan || 'Premium' : null),
    };
  } catch {
    return {};
  }
}
