import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/flutter-jwt';
import { fetchOrder } from '@/lib/cashfree';
import prisma from '@/lib/prisma';
import { dispatchSubscriptionReceipt } from '@/lib/subscriptionReceipt';

export async function POST(req) {
  const token = getTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

  const { orderId, plan } = await req.json();
  if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 });

  try {
    const order = await fetchOrder(orderId);

    if (order.order_status === 'PAID') {
      const planKey = plan?.toUpperCase() || order.order_tags?.plan?.toUpperCase() || 'GOLD';

      const pendingSub = await prisma.subscription.findFirst({
        where: { userId: decoded.id, paymentId: orderId },
      });
      const premiumExpiry = pendingSub?.endDate || new Date(Date.now() + 30 * 86400000);

      await prisma.user.update({
        where: { id: decoded.id },
        data: { isPremium: true, premiumPlan: planKey, premiumExpiry },
      });

      await prisma.subscription.updateMany({
        where: { userId: decoded.id, paymentId: orderId },
        data: { status: 'ACTIVE', endDate: premiumExpiry },
      });

      try {
        await dispatchSubscriptionReceipt(orderId);
      } catch (err) {
        console.error('[flutter verify] receipt email error:', err?.message || err);
      }

      return NextResponse.json({ status: 'PAID', isPremium: true, premiumExpiry });
    }

    return NextResponse.json({ status: order.order_status });
  } catch (err) {
    console.error('Verify error:', err.message);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
