import { NextResponse } from 'next/server';
import {
  isPhoneVerificationRequired,
  isRequirePhoneValidation,
} from '@/lib/phoneVerificationSettings';

export async function GET() {
  try {
    const [phoneSmsOtpRequired, requirePhoneValidation] = await Promise.all([
      isPhoneVerificationRequired(),
      isRequirePhoneValidation(),
    ]);
    return NextResponse.json({
      phoneVerificationRequired: phoneSmsOtpRequired,
      phoneSmsOtpRequired,
      requirePhoneValidation,
      phoneValidationMethod: phoneSmsOtpRequired
        ? 'sms_otp'
        : requirePhoneValidation
          ? 'veriphone'
          : 'none',
      veriphoneEnabled: !!process.env.VERIPHONE_API_KEY?.trim(),
    });
  } catch (e) {
    console.error('[registration-settings]', e.message);
    return NextResponse.json({
      phoneVerificationRequired: false,
      phoneSmsOtpRequired: false,
      requirePhoneValidation: true,
      phoneValidationMethod: 'veriphone',
      veriphoneEnabled: false,
    });
  }
}
