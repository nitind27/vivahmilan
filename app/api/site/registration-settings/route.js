import { NextResponse } from 'next/server';
import { isPhoneVerificationRequired } from '@/lib/phoneVerificationSettings';

export async function GET() {
  try {
    const phoneSmsOtpRequired = await isPhoneVerificationRequired();
    return NextResponse.json({
      /** @deprecated use phoneSmsOtpRequired */
      phoneVerificationRequired: phoneSmsOtpRequired,
      phoneSmsOtpRequired,
      /** Always on: number valid/invalid via Veriphone (no SMS) */
      phoneValidationMethod: phoneSmsOtpRequired ? 'veriphone_and_sms' : 'veriphone',
      veriphoneEnabled: !!process.env.VERIPHONE_API_KEY?.trim(),
    });
  } catch (e) {
    console.error('[registration-settings]', e.message);
    return NextResponse.json({
      phoneVerificationRequired: false,
      phoneSmsOtpRequired: false,
      phoneValidationMethod: 'veriphone',
      veriphoneEnabled: false,
    });
  }
}
