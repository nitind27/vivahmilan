import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import { dispatchSubscriptionReceipt } from '@/lib/subscriptionReceipt';

const PLAN_DURATIONS = { SILVER: 30, GOLD: 30, PLATINUM: 30 };

export async function POST(req) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-webhook-signature');
    const timestamp = req.headers.get('x-webhook-timestamp');

    // Verify Cashfree webhook signature
    if (signature && timestamp) {
      const signedPayload = `${timestamp}${rawBody}`;
      const expectedSig = crypto
        .createHmac('sha256', process.env.CASHFREE_SECRET_KEY)
        .update(signedPayload)
        .digest('base64');

      if (signature !== expectedSig) {
        console.error('Webhook signature mismatch');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const event = JSON.parse(rawBody);
    const { type, data } = event;

    if (type === 'PAYMENT_SUCCESS_WEBHOOK') {
      const { order } = data;
      const orderId = order.order_id;
      const userId  = order.order_tags?.userId;
      const plan    = order.order_tags?.plan?.toUpperCase();

      if (!userId || !plan) return NextResponse.json({ ok: true });

      // Fetch the pending subscription to get the correct endDate calculated during create-order
      const pendingSub = await prisma.subscription.findFirst({
        where: { userId, paymentId: orderId },
      });
      const premiumExpiry = pendingSub?.endDate || new Date(Date.now() + 30 * 86400000);

      await prisma.user.update({
        where: { id: userId },
        data: { isPremium: true, premiumPlan: plan, premiumExpiry },
      });

      await prisma.subscription.updateMany({
        where: { userId, paymentId: orderId },
        data: { status: 'ACTIVE', endDate: premiumExpiry },
      });

      await prisma.notification.create({
        data: {
          userId,
          type: 'SUBSCRIPTION_EXPIRY',
          title: '🎉 Premium Activated!',
          message: `Your ${plan} plan is now active until ${premiumExpiry.toLocaleDateString()}.`,
          link: '/dashboard',
        },
      });

      try {
        const payer = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
        const { notifyAdmins } = await import('@/lib/adminNotifications');
        await notifyAdmins({
          title: '💳 New Premium Subscription',
          message: `${payer?.name || 'A user'} purchased the ${plan} plan.`,
          link: '/admin/subscriptions',
        });
      } catch {}

      try {
        await dispatchSubscriptionReceipt(orderId);
      } catch (err) {
        console.error('[webhook] receipt email error:', err?.message || err);
      }
    }

    if (type === 'PAYMENT_FAILED_WEBHOOK') {
      const { order } = data;
      const userId  = order.order_tags?.userId;
      const orderId = order.order_id;
      if (userId) {
        await prisma.subscription.updateMany({
          where: { userId, paymentId: orderId },
          data: { status: 'CANCELLED' },
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
