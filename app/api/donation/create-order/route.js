import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createOrder } from '@/lib/cashfree';
import {
  isDonationEnabled,
  createDonationPayment,
} from '@/lib/donation.js';
import { queryOne } from '@/lib/db';

export async function POST(req) {
  if (!(await isDonationEnabled())) {
    return NextResponse.json({ error: 'Donation feature is currently disabled' }, { status: 403 });
  }

  const session = await getServerSession(authOptions);
  const body = await req.json().catch(() => ({}));
  const {
    amount,
    campaignId = null,
    donorName,
    donorEmail,
    donorPhone,
    message,
    isAnonymous = false,
  } = body;

  const amt = Math.round(Number(amount));
  if (!amt || amt < 10) {
    return NextResponse.json({ error: 'Minimum donation is ₹10' }, { status: 400 });
  }
  if (amt > 500000) {
    return NextResponse.json({ error: 'Maximum single donation is ₹5,00,000' }, { status: 400 });
  }

  let name = (donorName || session?.user?.name || '').trim();
  let email = (donorEmail || session?.user?.email || '').trim().toLowerCase();
  const phone = (donorPhone || session?.user?.phone || '9999999999').trim();

  if (!name || name.length < 2) {
    return NextResponse.json({ error: 'Please enter your name' }, { status: 400 });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email is required for receipt' }, { status: 400 });
  }

  if (campaignId) {
    const camp = await queryOne(
      'SELECT id FROM donation_campaign WHERE id = ? AND isActive = 1',
      [campaignId]
    );
    if (!camp) return NextResponse.json({ error: 'Invalid campaign' }, { status: 400 });
  }

  const { id: donationId, orderId } = await createDonationPayment({
    userId: session?.user?.id || null,
    donorName: name,
    donorEmail: email,
    donorPhone: phone,
    amount: amt,
    campaignId,
    message: (message || '').trim().slice(0, 500) || null,
    isAnonymous: !!isAnonymous,
  });

  const orderPayload = {
    order_id: orderId,
    order_amount: amt,
    order_currency: 'INR',
    order_note: 'Vivah Dwar — Wedding Support Donation',
    customer_details: {
      customer_id: session?.user?.id || `guest_${donationId.slice(0, 8)}`,
      customer_name: name,
      customer_email: email,
      customer_phone: phone,
    },
    order_meta: {
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/donate/status?order_id={order_id}`,
      notify_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/donation/webhook`,
    },
    order_tags: {
      type: 'donation',
      donationId,
      userId: session?.user?.id || '',
    },
  };

  try {
    const orderData = await createOrder(orderPayload);
    return NextResponse.json({
      orderId: orderData.order_id,
      paymentSessionId: orderData.payment_session_id,
      orderAmount: amt,
      donationId,
    });
  } catch (err) {
    console.error('[donation create-order]', err.message);
    return NextResponse.json({ error: err.message || 'Payment gateway error' }, { status: 500 });
  }
}
