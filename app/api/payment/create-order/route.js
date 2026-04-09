import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { createOrder } from '@/lib/cashfree';

const PLANS = {
  SILVER:   { amount: 749,  duration: 30, label: 'Silver Plan'   },
  GOLD:     { amount: 1499, duration: 30, label: 'Gold Plan'     },
  PLATINUM: { amount: 2999, duration: 30, label: 'Platinum Plan' },
};

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { plan } = await req.json();
  const planKey = plan?.toUpperCase();
  const planDetails = PLANS[planKey];
  if (!planDetails) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, phone: true },
  });

  const orderId = `MILAN_${session.user.id.slice(-8).toUpperCase()}_${Date.now()}`;

  const orderPayload = {
    order_id: orderId,
    order_amount: planDetails.amount,
    order_currency: 'INR',
    order_note: `${planDetails.label} - Milan Matrimony`,
    customer_details: {
      customer_id: session.user.id,
      customer_name: user.name || 'User',
      customer_email: user.email || 'user@example.com',
      customer_phone: user.phone || '9999999999',
    },
    order_meta: {
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/status?order_id={order_id}&plan=${planKey}`,
      notify_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/webhook`,
    },
    order_tags: {
      userId: session.user.id,
      plan: planKey,
    },
  };

  try {
    const orderData = await createOrder(orderPayload);

    // Save pending subscription
    await prisma.subscription.create({
      data: {
        userId: session.user.id,
        plan: planKey,
        status: 'ACTIVE',
        amount: planDetails.amount,
        currency: 'INR',
        paymentId: orderId,
        startDate: new Date(),
        endDate: new Date(Date.now() + planDetails.duration * 86400000),
      },
    });

    return NextResponse.json({
      orderId: orderData.order_id,
      paymentSessionId: orderData.payment_session_id,
      orderAmount: planDetails.amount,
      plan: planKey,
    });
  } catch (err) {
    console.error('Cashfree order error:', err.message);
    return NextResponse.json({ error: err.message || 'Failed to create order' }, { status: 500 });
  }
}
