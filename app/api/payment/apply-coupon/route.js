import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { queryOne } from '@/lib/db';

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { code, planId } = await req.json();
  if (!code || !planId) return NextResponse.json({ error: 'Code and planId required' }, { status: 400 });

  let isAgent = false;
  let discountPct = 0;
  let couponCode = code;

  const coupon = await prisma.couponcode.findUnique({ where: { code } });
  
  if (coupon) {
    if (!coupon.isActive) return NextResponse.json({ error: 'Coupon is not active' }, { status: 400 });
    if (coupon.usedCount >= coupon.maxUses) return NextResponse.json({ error: 'Coupon usage limit reached' }, { status: 400 });
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) return NextResponse.json({ error: 'Coupon has expired' }, { status: 400 });
    discountPct = coupon.discountPct;
  } else {
    // Check if it's an agent referral code
    const agent = await queryOne('SELECT id, referralCode FROM agent WHERE referralCode = ?', [code.toUpperCase()]);
    if (!agent) return NextResponse.json({ error: 'Invalid promo or referral code' }, { status: 404 });
    isAgent = true;
    discountPct = 5; // Give buyer a 5% incentive to use referral codes
    couponCode = agent.referralCode;
  }

  const plan = await prisma.planConfig.findUnique({ where: { plan: planId } });
  if (!plan) return NextResponse.json({ error: 'Invalid plan' }, { status: 404 });

  const discountAmount = Number(plan.price) * (discountPct / 100);
  const finalPrice = Math.max(0, Number(plan.price) - discountAmount);

  return NextResponse.json({
    code: couponCode,
    discountPct,
    originalPrice: Number(plan.price),
    finalPrice,
    isAgentRef: isAgent
  });
}
