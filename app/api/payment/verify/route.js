import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { fetchOrder } from '@/lib/cashfree';
import prisma from '@/lib/prisma';

const PLAN_DURATIONS = { SILVER: 30, GOLD: 30, PLATINUM: 30 };

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { orderId, plan } = await req.json();

  try {
    const order = await fetchOrder(orderId);

    if (order.order_status === 'PAID') {
      const planKey = plan?.toUpperCase() || 'GOLD';
      const durationDays = PLAN_DURATIONS[planKey] || 30;
      const premiumExpiry = new Date(Date.now() + durationDays * 86400000);

      await prisma.user.update({
        where: { id: session.user.id },
        data: { isPremium: true, premiumExpiry },
      });

      await prisma.subscription.updateMany({
        where: { userId: session.user.id, paymentId: orderId },
        data: { status: 'ACTIVE', endDate: premiumExpiry },
      });

      return NextResponse.json({ status: 'PAID', isPremium: true, premiumExpiry });
    }

    return NextResponse.json({ status: order.order_status });
  } catch (err) {
    console.error('Verify error:', err.message);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
