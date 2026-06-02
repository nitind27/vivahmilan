import { NextResponse } from 'next/server';
import { isPhoneVerificationRequired } from '@/lib/phoneVerificationSettings';

export async function GET() {
  try {
    const phoneVerificationRequired = await isPhoneVerificationRequired();
    return NextResponse.json({ phoneVerificationRequired });
  } catch (e) {
    console.error('[registration-settings]', e.message);
    return NextResponse.json({ phoneVerificationRequired: true });
  }
}
