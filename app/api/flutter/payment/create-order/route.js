import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/flutter-jwt';
import prisma from '@/lib/prisma';
import { queryOne, execute } from '@/lib/db';
import { createOrder } from '@/lib/cashfree';
import { dispatchSubscriptionReceipt } from '@/lib/subscriptionReceipt';
import { v4 as uuidv4 } from 'uuid';
import { isFamilyRole, subscriptionOwnerOnlyResponse } from '@/lib/flutterFamilyGuard';

export async function POST(req) {
  const token = getTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  if (isFamilyRole(decoded)) return subscriptionOwnerOnlyResponse();

  const owner = await queryOne('SELECT adminVerified FROM `user` WHERE id = ?', [decoded.id]);
  if (owner && !owner.adminVerified) {
    return NextResponse.json({
      error: 'Your profile must be verified before purchasing premium.',
      code: 'PROFILE_NOT_VERIFIED',
    }, { status: 403 });
  }

  const { plan, couponCode, durationDays, months } = await req.json();
  const planKey = plan?.toUpperCase();

  const planConfig = await prisma.planConfig.findUnique({ where: { plan: planKey } });
  if (!planConfig || !planConfig.isActive) {
    return NextResponse.json({ error: 'Invalid or inactive plan' }, { status: 400 });
  }

  let amount = Number(planConfig.price);
  let finalDurationDays = Number(planConfig.durationDays || 30);

  const m = months != null ? parseInt(months, 10) : null;
  if (durationDays != null) {
    finalDurationDays = parseInt(durationDays, 10);
  } else if (m === 0) {
    finalDurationDays = 36500;
  } else if (m) {
    finalDurationDays = m * 30;
  }

  const basePrice = Number(planConfig.price);
  const baseDays = Number(planConfig.durationDays || 30);
  const pricePerDay = baseDays > 0 ? basePrice / baseDays : 0;

  if (finalDurationDays >= 3650) {
    amount = basePrice === 0 ? 0 : 4999;
  } else if (basePrice > 0) {
    amount = Math.round(pricePerDay * finalDurationDays);
  }

  let appliedCoupon = null;
  let appliedAgent = null;

  if (couponCode) {
    const normalizedCoupon = String(couponCode).trim().toUpperCase();
    const coupon = await prisma.couponCode.findUnique({ where: { code: normalizedCoupon } });

    if (coupon && coupon.isActive && coupon.usedCount < coupon.maxUses
        && (!coupon.expiresAt || new Date(coupon.expiresAt) > new Date())) {
      amount = Math.max(0, Math.round(amount * (1 - coupon.discountPct / 100)));
      appliedCoupon = coupon;
    } else {
      const agent = await queryOne('SELECT * FROM agent WHERE referralCode = ?', [normalizedCoupon]);
      if (agent) {
        amount = Math.max(0, Math.round(amount * 0.95));
        appliedAgent = agent;
      } else {
        return NextResponse.json({ error: 'Invalid or expired promo code' }, { status: 400 });
      }
    }
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: { id: true, name: true, email: true, phone: true },
  });

  const orderId = `MILAN_${decoded.id.slice(-8).toUpperCase()}_${Date.now()}`;

  if (amount === 0) {
    const endDate = new Date(Date.now() + finalDurationDays * 86400000);
    const freePaymentId = 'FREE_COUPON_' + orderId;

    await prisma.subscription.create({
      data: {
        userId: decoded.id,
        plan: planKey,
        status: 'ACTIVE',
        amount: 0,
        currency: 'INR',
        paymentId: freePaymentId,
        startDate: new Date(),
        endDate,
      },
    });

    await prisma.user.update({
      where: { id: decoded.id },
      data: { isPremium: true, premiumPlan: planKey, premiumExpiry: endDate },
    });

    if (appliedCoupon) {
      await prisma.couponCode.update({
        where: { id: appliedCoupon.id },
        data: { usedCount: appliedCoupon.usedCount + 1 },
      });
    }

    try {
      await dispatchSubscriptionReceipt(freePaymentId);
    } catch (err) {
      console.error('[flutter create-order] receipt email error:', err?.message || err);
    }

    return NextResponse.json({
      instantActivation: true,
      plan: planKey,
      orderAmount: 0,
      premiumExpiry: endDate,
    });
  }

  const orderPayload = {
    order_id: orderId,
    order_amount: amount,
    order_currency: 'INR',
    order_note: `${planConfig.displayName || planKey} - Vivah Dwar`,
    customer_details: {
      customer_id: decoded.id,
      customer_name: user.name || 'User',
      customer_email: user.email || 'user@example.com',
      customer_phone: user.phone || '9999999999',
    },
    order_meta: {
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/status?order_id={order_id}&plan=${planKey}`,
      notify_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/webhook`,
    },
    order_tags: { userId: decoded.id, plan: planKey },
  };

  try {
    const orderData = await createOrder(orderPayload);

    const sub = await prisma.subscription.create({
      data: {
        userId: decoded.id,
        plan: planKey,
        status: 'PENDING',
        amount,
        currency: 'INR',
        paymentId: orderId,
        startDate: new Date(),
        endDate: new Date(Date.now() + finalDurationDays * 86400000),
      },
    });

    if (appliedCoupon) {
      await prisma.couponCode.update({
        where: { id: appliedCoupon.id },
        data: { usedCount: appliedCoupon.usedCount + 1 },
      });
    }

    if (appliedAgent && amount > 0) {
      const commission = amount * (appliedAgent.commissionPct / 100);
      await execute(
        'INSERT INTO agentsale (id, agentId, buyerId, subscriptionId, planName, amountPaid, commissionEarned, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
        [uuidv4(), appliedAgent.id, decoded.id, sub.id, planKey, amount, commission]
      );
      await execute('UPDATE agent SET totalEarnings = totalEarnings + ? WHERE id = ?', [commission, appliedAgent.id]);
    }

    return NextResponse.json({
      orderId: orderData.order_id,
      paymentSessionId: orderData.payment_session_id,
      orderAmount: amount,
      plan: planKey,
      durationDays: finalDurationDays,
      couponApplied: appliedCoupon?.code || (appliedAgent ? appliedAgent.referralCode : null),
    });
  } catch (err) {
    console.error('Cashfree order error:', err.message);
    return NextResponse.json({ error: err.message || 'Failed to create order' }, { status: 500 });
  }
}
