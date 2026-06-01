import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * POST /api/flutter/coupons/validate
 * Quick coupon check (no plan price). Public — no auth required.
 */
export async function POST(req) {
  const { code } = await req.json();
  if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 });

  const normalized = String(code).trim().toUpperCase();
  const coupon = await prisma.couponCode.findUnique({ where: { code: normalized } });

  if (!coupon || !coupon.isActive) {
    return NextResponse.json({ error: 'Invalid or inactive coupon', valid: false }, { status: 404 });
  }
  if (coupon.expiresAt && new Date() > new Date(coupon.expiresAt)) {
    return NextResponse.json({ error: 'Coupon has expired', valid: false }, { status: 410 });
  }
  if (coupon.usedCount >= coupon.maxUses) {
    return NextResponse.json({ error: 'Coupon usage limit reached', valid: false }, { status: 410 });
  }

  return NextResponse.json({
    valid: true,
    discountPct: coupon.discountPct,
    code: coupon.code,
  });
}
