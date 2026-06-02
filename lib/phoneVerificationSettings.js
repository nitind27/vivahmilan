import { getSiteConfig } from '@/lib/siteconfig';

/** siteconfig key — '1' = SMS OTP required at registration (default) */
export const PHONE_VERIFICATION_REQUIRED_KEY = 'phone_verification_required';

export async function isPhoneVerificationRequired() {
  const v = await getSiteConfig(PHONE_VERIFICATION_REQUIRED_KEY);
  if (v === null || v === undefined || v === '') return true;
  return v === '1' || v === 'true';
}
