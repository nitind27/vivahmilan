import { NextResponse } from 'next/server';
import { verifyPhoneVerificationOtp } from '@/lib/phoneVerification';

export async function POST(req) {
  try {
    const { phone, otp } = await req.json();
    if (!phone || !otp) {
      return NextResponse.json({ error: 'Phone and OTP are required' }, { status: 400 });
    }
    const result = await verifyPhoneVerificationOtp(phone, otp);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (e) {
    console.error('[phone/verify-otp]', e.message);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
