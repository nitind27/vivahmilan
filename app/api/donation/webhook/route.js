import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { markDonationPaid, markDonationFailed } from '@/lib/donation.js';

export async function POST(req) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-webhook-signature');
    const timestamp = req.headers.get('x-webhook-timestamp');

    if (signature && timestamp && process.env.CASHFREE_SECRET_KEY) {
      const signedPayload = `${timestamp}${rawBody}`;
      const expectedSig = crypto
        .createHmac('sha256', process.env.CASHFREE_SECRET_KEY)
        .update(signedPayload)
        .digest('base64');
      if (signature !== expectedSig) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const event = JSON.parse(rawBody);
    const { type, data } = event;
    const order = data?.order;
    if (!order?.order_id) return NextResponse.json({ ok: true });

    if (order.order_tags?.type !== 'donation') {
      return NextResponse.json({ ok: true, skipped: 'not_donation' });
    }

    const orderId = order.order_id;

    if (type === 'PAYMENT_SUCCESS_WEBHOOK') {
      await markDonationPaid(orderId, { paymentRef: order.cf_order_id || orderId });
      try {
        const { notifyAdmins } = await import('@/lib/adminNotifications');
        await notifyAdmins({
          title: '💝 New Donation Received',
          message: `₹${order.order_amount} donation — order ${orderId}`,
          link: '/admin/donations',
        });
      } catch {}
    }

    if (type === 'PAYMENT_FAILED_WEBHOOK') {
      await markDonationFailed(orderId);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[donation webhook]', err);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
