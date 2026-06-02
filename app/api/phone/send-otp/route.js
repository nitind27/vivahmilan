import { NextResponse } from 'next/server';
import { sendPhoneVerificationOtp } from '@/lib/phoneVerification';
import { isPhoneVerificationRequired } from '@/lib/phoneVerificationSettings';

export async function POST(req) {
  try {
    if (!(await isPhoneVerificationRequired())) {
      return NextResponse.json(
        {
          error:
            'SMS OTP is disabled. Use Check mobile number (Veriphone validation) instead.',
          useVeriphone: true,
        },
        { status: 400 }
      );
    }
    const { phone } = await req.json();
    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }
    const result = await sendPhoneVerificationOtp(phone);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (e) {
    console.error('[phone/send-otp]', e.message);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
