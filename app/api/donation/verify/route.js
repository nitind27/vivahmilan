import { NextResponse } from 'next/server';
import { fetchOrder } from '@/lib/cashfree';
import { markDonationPaid, getDonationByOrderId } from '@/lib/donation.js';

export async function POST(req) {
  const { orderId } = await req.json().catch(() => ({}));
  if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 });

  try {
    const order = await fetchOrder(orderId);
    if (order.order_status === 'PAID') {
      await markDonationPaid(orderId, { paymentRef: order.cf_order_id || orderId });
      const donation = await getDonationByOrderId(orderId);
      return NextResponse.json({ status: 'PAID', donation });
    }
    return NextResponse.json({ status: order.order_status });
  } catch (err) {
    console.error('[donation verify]', err.message);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
