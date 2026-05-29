export function isPlanActive(plan) {  if (!plan) return false;
  const v = plan.isActive;
  return v === true || v === 1 || v === '1';
}

export function parsePlanPermissions(permissions) {
  if (!permissions) return {};
  if (typeof permissions === 'object') return permissions;
  try {
    return JSON.parse(permissions);
  } catch {
    return {};
  }
}

export function normalizePlan(plan) {
  if (!plan) return null;
  return {
    ...plan,
    price: Number(plan.price) || 0,
    durationDays: Number(plan.durationDays) || 30,
    isActive: isPlanActive(plan),
    permissions: typeof plan.permissions === 'string'
      ? plan.permissions
      : JSON.stringify(plan.permissions || {}),
  };
}

export function normalizePlans(plans) {
  if (!Array.isArray(plans)) return [];
  return plans.map(normalizePlan).filter(Boolean).filter(isPlanActive);
}
