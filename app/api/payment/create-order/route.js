import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { execute, queryOne } from '@/lib/db';
import { createOrder } from '@/lib/cashfree';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { plan, couponCode, durationDays } = await req.json();
  const planKey = plan?.toUpperCase();

  const planConfig = await prisma.planConfig.findUnique({ where: { plan: planKey } });
  if (!planConfig || !planConfig.isActive) return NextResponse.json({ error: 'Invalid or inactive plan' }, { status: 400 });

  let amount = Number(planConfig.price);
  let finalDurationDays = planConfig.durationDays;

  // Dynamic pricing based on selected duration
  if (durationDays) {
    finalDurationDays = durationDays;
    const basePrice = Number(planConfig.price);
    const baseDays = Number(planConfig.durationDays || 30);
    const pricePerDay = baseDays > 0 ? basePrice / baseDays : 0;
    
    if (durationDays >= 3650) { // Lifetime
      amount = basePrice === 0 ? 0 : 4999;
    } else {
      amount = basePrice === 0 ? 0 : Math.round(pricePerDay * durationDays);
    }
  }

  let appliedCoupon = null;
  let appliedAgent = null;

  if (couponCode) {
    const coupon = await prisma.couponcode.findUnique({ where: { code: couponCode } });
    if (coupon && coupon.isActive && coupon.usedCount < coupon.maxUses && (!coupon.expiresAt || new Date(coupon.expiresAt) > new Date())) {
      const discount = amount * (coupon.discountPct / 100);
      amount = Math.max(0, amount - discount);
      appliedCoupon = coupon;
    } else {
      // Check if it's an agent referral code instead
      const agent = await queryOne('SELECT * FROM agent WHERE referralCode = ?', [couponCode.toUpperCase()]);
      if (agent) {
        // Apply 5% discount for using agent code
        const discount = amount * 0.05;
        amount = Math.max(0, amount - discount);
        appliedAgent = agent;
      } else {
        return NextResponse.json({ error: 'Invalid or expired promo code' }, { status: 400 });
      }
    }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, phone: true },
  });

  const orderId = `MILAN_${session.user.id.slice(-8).toUpperCase()}_${Date.now()}`;

  // IF amount is 0, instant activation without Cashfree
  if (amount === 0) {
    const endDate = new Date(Date.now() + finalDurationDays * 86400000);
    
    // Create subscription
    await prisma.subscription.create({
      data: {
        userId: session.user.id,
        plan: planKey,
        status: 'ACTIVE',
        amount: 0,
        currency: 'INR',
        paymentId: 'FREE_COUPON_' + orderId,
        startDate: new Date(),
        endDate,
      },
    });

    // Update user
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        isPremium: true,
        premiumPlan: planKey,
        premiumExpiry: endDate,
      },
    });

    // Mark coupon as used
    if (appliedCoupon) {
      await prisma.couponcode.update({
        where: { id: appliedCoupon.id },
        data: { usedCount: appliedCoupon.usedCount + 1 }
      });
    }

    return NextResponse.json({ instantActivation: true, plan: planKey });
  }

  // Otherwise, create Cashfree order
  const orderPayload = {
    order_id: orderId,
    order_amount: amount,
    order_currency: 'INR',
    order_note: `${planConfig.displayName} - Milan Matrimony`,
    customer_details: {
      customer_id: session.user.id,
      customer_name: user.name || 'User',
      customer_email: user.email || 'user@example.com',
      customer_phone: user.phone || '9999999999',
    },
    order_meta: {
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/status?order_id={order_id}&plan=${planKey}&coupon=${appliedCoupon ? appliedCoupon.code : ''}`,
      notify_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/webhook`,
    },
    order_tags: {
      userId: session.user.id,
      plan: planKey,
    },
  };

  try {
    const orderData = await createOrder(orderPayload);

    // NOTE: Creating subscription as PENDING so they don't get free access if they cancel payment
    const sub = await prisma.subscription.create({
      data: {
        userId: session.user.id,
        plan: planKey,
        status: 'PENDING', 
        amount: amount,
        currency: 'INR',
        paymentId: orderId,
        startDate: new Date(),
        endDate: new Date(Date.now() + finalDurationDays * 86400000),
      },
    });
    
    if (appliedCoupon) {
      await prisma.couponcode.update({
        where: { id: appliedCoupon.id },
        data: { usedCount: appliedCoupon.usedCount + 1 }
      });
    }

    if (appliedAgent && amount > 0) {
      const commission = amount * (appliedAgent.commissionPct / 100);
      await execute(
        'INSERT INTO agentsale (id, agentId, buyerId, subscriptionId, planName, amountPaid, commissionEarned, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
        [uuidv4(), appliedAgent.id, session.user.id, sub.id, planKey, amount, commission]
      );
      // Automatically add to agent's total earnings
      await execute('UPDATE agent SET totalEarnings = totalEarnings + ? WHERE id = ?', [commission, appliedAgent.id]);
    }

    return NextResponse.json({
      orderId: orderData.order_id,
      paymentSessionId: orderData.payment_session_id,
      orderAmount: amount,
      plan: planKey,
    });
  } catch (err) {
    console.error('Cashfree order error:', err.message);
    return NextResponse.json({ error: err.message || 'Failed to create order' }, { status: 500 });
  }
}
