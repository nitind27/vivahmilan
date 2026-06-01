import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/flutter-jwt';
import prisma from '@/lib/prisma';
import { queryOne } from '@/lib/db';
import { isFamilyRole, subscriptionOwnerOnlyResponse } from '@/lib/flutterFamilyGuard';

/**
 * POST /api/flutter/payment/apply-coupon
 * Validate coupon / referral code and return discounted price for a plan.
 */
export async function POST(req) {
  const token = getTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  if (isFamilyRole(decoded)) return subscriptionOwnerOnlyResponse();

  const { code, planId, durationDays, months } = await req.json();
  if (!code || !planId) return NextResponse.json({ error: 'code and planId required' }, { status: 400 });

  const planKey = String(planId).toUpperCase();
  const normalizedCode = String(code).trim().toUpperCase();

  let isAgent = false;
  let discountPct = 0;
  let couponCode = normalizedCode;

  const coupon = await prisma.couponCode.findUnique({ where: { code: normalizedCode } });

  if (coupon) {
    if (!coupon.isActive) return NextResponse.json({ error: 'Coupon is not active' }, { status: 400 });
    if (coupon.usedCount >= coupon.maxUses) return NextResponse.json({ error: 'Coupon usage limit reached' }, { status: 400 });
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Coupon has expired' }, { status: 400 });
    }
    discountPct = coupon.discountPct;
  } else {
    const agent = await queryOne('SELECT id, referralCode FROM agent WHERE referralCode = ?', [normalizedCode]);
    if (!agent) return NextResponse.json({ error: 'Invalid promo or referral code' }, { status: 404 });
    isAgent = true;
    discountPct = 5;
    couponCode = agent.referralCode;
  }

  const plan = await prisma.planConfig.findUnique({ where: { plan: planKey } });
  if (!plan || !plan.isActive) return NextResponse.json({ error: 'Invalid or inactive plan' }, { status: 404 });

  const basePrice = Number(plan.price);
  const baseDays = Number(plan.durationDays || 30);
  const m = months != null ? parseInt(months, 10) : null;
  const days = durationDays != null
    ? parseInt(durationDays, 10)
    : m === 0
      ? 36500
      : m
        ? m * 30
        : baseDays;

  let originalPrice = basePrice;
  if (basePrice > 0 && days) {
    const pricePerDay = baseDays > 0 ? basePrice / baseDays : 0;
    originalPrice = days >= 3650 ? 4999 : Math.round(pricePerDay * days);
  }

  const discountAmount = originalPrice * (discountPct / 100);
  const finalPrice = Math.max(0, Math.round(originalPrice - discountAmount));

  return NextResponse.json({
    code: couponCode,
    discountPct,
    originalPrice,
    finalPrice,
    durationDays: days,
    isAgentRef: isAgent,
    plan: planKey,
  });
}
