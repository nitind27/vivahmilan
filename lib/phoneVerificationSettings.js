import { getSiteConfig } from '@/lib/siteconfig';

/**
 * siteconfig: phone_verification_required
 * '0' or unset (default) = Veriphone only — valid/invalid check, no SMS OTP
 * '1' = also require MSG91/Twilio SMS OTP at registration (paid)
 */
export const PHONE_VERIFICATION_REQUIRED_KEY = 'phone_verification_required';

export async function isPhoneVerificationRequired() {
  const v = await getSiteConfig(PHONE_VERIFICATION_REQUIRED_KEY);
  if (v === null || v === undefined || v === '') return false;
  return v === '1' || v === 'true';
}

/** Default validation for this app: Veriphone API (see https://veriphone.io) */
export async function usesVeriphoneValidation() {
  return true;
}
