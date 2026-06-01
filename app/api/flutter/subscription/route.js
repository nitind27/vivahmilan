import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/flutter-jwt';
import { query, queryOne } from '@/lib/db';
import { normalizePlans, parsePlanPermissions } from '@/lib/plans.js';
import { getPremiumPlanDetails } from '@/lib/premiumPlanDetails.js';
import { getUserAccessSummary } from '@/lib/planPermissions.js';
import { isFamilyRole } from '@/lib/flutterFamilyGuard.js';

export const DURATION_OPTIONS = [
  { label: '3 Months', months: 3, durationDays: 90 },
  { label: '6 Months', months: 6, durationDays: 180 },
  { label: '12 Months', months: 12, durationDays: 365 },
  { label: 'Lifetime', months: 0, durationDays: 36500 },
];

async function loadActivePlans() {
  const rows = await query(
    `SELECT plan, displayName, price, durationDays, description, permissions, isActive
     FROM planconfig WHERE isActive = 1 ORDER BY price ASC`
  );
  return normalizePlans(rows || []).filter(p => p.plan !== 'FREE');
}

function planFeaturesList(perms) {
  const p = parsePlanPermissions(perms);
  const list = [];
  if (p.canChat) list.push('Unlimited Chat');
  if (p.unlimitedInterests || p.interestLimit === -1) list.push('Unlimited Interests');
  else if (p.interestLimit) list.push(`${p.interestLimit} Interests / month`);
  if (p.canSeeContact) list.push('View Contact Details');
  if (p.canSeeWhoViewed) list.push('See Who Viewed You');
  if (p.canBoostProfile) list.push('Profile Boost');
  if (p.aiMatchScore) list.push('AI Match Score');
  if (p.kundaliMatchPdf) list.push('Kundali Match PDF');
  return list;
}

/**
 * GET /api/flutter/subscription
 * Single endpoint for Flutter Premium / Subscription screen.
 * Always returns plans. Never returns generic "Access Denied".
 */
export async function GET(req) {
  try {
    const token = getTokenFromRequest(req);
    const decoded = token ? verifyToken(token) : null;

    const plans = await loadActivePlans();
    const plansWithFeatures = plans.map(p => ({
      ...p,
      permissions: parsePlanPermissions(p.permissions),
      features: planFeaturesList(p.permissions),
    }));

    const base = {
      success: true,
      plans: plansWithFeatures,
      durationOptions: DURATION_OPTIONS,
      canPurchase: false,
      purchaseBlockedReason: null,
      code: null,
    };

    if (!decoded) {
      return NextResponse.json({
        ...base,
        code: 'LOGIN_REQUIRED',
        purchaseBlockedReason: 'Please login to purchase a subscription.',
        message: 'Plans loaded. Login required to subscribe.',
      });
    }

    const user = await queryOne(
      `SELECT id, name, email, isPremium, premiumPlan, premiumExpiry, freeTrialExpiry, adminVerified
       FROM \`user\` WHERE id = ?`,
      [decoded.id]
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found', code: 'USER_NOT_FOUND' }, { status: 404 });
    }

    const trialActive = user.freeTrialExpiry && new Date(user.freeTrialExpiry) > new Date();
    const premiumActive = user.isPremium && user.premiumExpiry && new Date(user.premiumExpiry) > new Date();
    const activePlan = await getPremiumPlanDetails(decoded.id, user.premiumPlan);
    const access = await getUserAccessSummary(decoded.id);

    let canPurchase = true;
    let purchaseBlockedReason = null;
    let code = null;

    if (isFamilyRole(decoded)) {
      canPurchase = false;
      code = 'SUBSCRIPTION_OWNER_ONLY';
      purchaseBlockedReason = 'Only the profile owner can purchase a subscription. Please login with the member account, not Family Login.';
    } else if (!user.adminVerified) {
      canPurchase = false;
      code = 'PROFILE_NOT_VERIFIED';
      purchaseBlockedReason = 'Your profile must be verified before purchasing premium. You can still view plans below.';
    }

    return NextResponse.json({
      ...base,
      canPurchase,
      purchaseBlockedReason,
      code,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isPremium: !!user.isPremium,
        premiumPlan: user.premiumPlan || null,
        premiumExpiry: user.premiumExpiry || null,
        freeTrialActive: !!trialActive,
        freeTrialExpiry: user.freeTrialExpiry || null,
        adminVerified: !!user.adminVerified,
        isFamilyLogin: isFamilyRole(decoded),
      },
      subscription: activePlan
        ? {
            plan: activePlan.plan,
            displayName: activePlan.displayName,
            status: activePlan.status,
            amount: activePlan.amount,
            startDate: activePlan.startDate,
            endDate: activePlan.endDate,
            permissions: activePlan.permissions,
            isActive: premiumActive,
          }
        : null,
      access,
      message: canPurchase
        ? 'Ready to subscribe'
        : purchaseBlockedReason,
    });
  } catch (err) {
    console.error('[flutter/subscription]', err);
    return NextResponse.json({ error: 'Failed to load subscription data', code: 'SERVER_ERROR' }, { status: 500 });
  }
}
