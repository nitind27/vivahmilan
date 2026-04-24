import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req) {
  const { code } = await req.json();
  if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 });

  const coupon = await prisma.couponCode.findUnique({ where: { code: code.toUpperCase() } });

  if (!coupon || !coupon.isActive)
    return NextResponse.json({ error: 'Invalid or inactive coupon' }, { status: 404 });

  if (coupon.expiresAt && new Date() > new Date(coupon.expiresAt))
    return NextResponse.json({ error: 'Coupon has expired' }, { status: 410 });

  if (coupon.usedCount >= coupon.maxUses)
    return NextResponse.json({ error: 'Coupon usage limit reached' }, { status: 410 });

  return NextResponse.json({
    valid: true,
    discountPct: coupon.discountPct,
    code: coupon.code,
  });
}
