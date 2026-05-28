import { queryOne } from '@/lib/db';

const SUBSCRIPTION_SELECT = `
  SELECT s.id, s.plan, s.status, s.amount, s.currency, s.startDate, s.endDate, s.paymentId,
         pc.displayName, pc.permissions, pc.durationDays, pc.description, pc.price
  FROM subscription s
  LEFT JOIN planconfig pc ON pc.plan = s.plan
  WHERE s.userId = ? AND s.status = 'ACTIVE' AND s.endDate > NOW()`;

const PLAN_PRIORITY_ORDER = `
  ORDER BY
    CASE s.plan WHEN 'PLATINUM' THEN 4 WHEN 'GOLD' THEN 3 WHEN 'SILVER' THEN 2 WHEN 'FREE' THEN 1 ELSE 0 END DESC,
    s.amount DESC,
    s.endDate DESC
  LIMIT 1`;

function parsePermissions(permissions) {
  if (typeof permissions === 'string') {
    try {
      return JSON.parse(permissions || '{}');
    } catch {
      return {};
    }
  }
  return permissions || {};
}

export function formatPremiumPlanDetails(subscription) {
  if (!subscription) return null;
  const { permissions, ...rest } = subscription;
  return {
    ...rest,
    permissions: parsePermissions(permissions),
  };
}

/** Return the user's effective active plan — paid plans beat FREE even if FREE ends later. */
export async function getPremiumPlanDetails(userId, preferredPlan = null) {
  if (preferredPlan && preferredPlan !== 'FREE') {
    const matched = await queryOne(
      `${SUBSCRIPTION_SELECT} AND s.plan = ? ORDER BY s.endDate DESC LIMIT 1`,
      [userId, preferredPlan]
    );
    if (matched) return formatPremiumPlanDetails(matched);
  }

  const subscription = await queryOne(
    `${SUBSCRIPTION_SELECT} ${PLAN_PRIORITY_ORDER}`,
    [userId]
  );
  return formatPremiumPlanDetails(subscription);
}
