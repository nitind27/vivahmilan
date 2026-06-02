import { getSiteConfig } from '@/lib/siteconfig';

/**
 * siteconfig: require_phone_validation
 * '1' or unset (default) = user must Verify (Veriphone) before Next on register
 * '0' = phone field only, no Veriphone check
 */
export const REQUIRE_PHONE_VALIDATION_KEY = 'require_phone_validation';

/**
 * siteconfig: phone_verification_required
 * '1' = require MSG91/Twilio SMS OTP at registration (paid)
 * '0' or unset (default) = no SMS OTP
 */
export const PHONE_VERIFICATION_REQUIRED_KEY = 'phone_verification_required';

export async function isRequirePhoneValidation() {
  const v = await getSiteConfig(REQUIRE_PHONE_VALIDATION_KEY);
  if (v === null || v === undefined || v === '') return true;
  return v === '1' || v === 'true';
}

export async function isPhoneVerificationRequired() {
  const v = await getSiteConfig(PHONE_VERIFICATION_REQUIRED_KEY);
  if (v === null || v === undefined || v === '') return false;
  return v === '1' || v === 'true';
}

export async function usesVeriphoneValidation() {
  return isRequirePhoneValidation();
}
