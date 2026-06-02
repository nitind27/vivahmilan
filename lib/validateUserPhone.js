import { queryOne } from '@/lib/db';
import { normalizePhoneToE164 } from '@/lib/phoneNormalize';
import { validateAndFormatPhone } from '@/lib/phoneVerification';

/**
 * Validate mobile via Veriphone before saving to user profile.
 * Does not send SMS — checks number is valid and a mobile line.
 */
export async function validateUserPhoneForSave(phone, userId, { required = false } = {}) {
  const trimmed = phone?.trim?.() || '';
  if (!trimmed) {
    if (required) return { ok: false, error: 'Phone number is required.' };
    return { ok: true, skip: true };
  }

  const formatted = await validateAndFormatPhone(trimmed);
  if (!formatted.ok) return formatted;

  const e164 = formatted.e164;
  const existing = await queryOne(
    'SELECT id FROM `user` WHERE (phone = ? OR phone = ?) AND id != ? LIMIT 1',
    [e164, trimmed, userId]
  );
  if (existing) {
    return { ok: false, error: 'This phone number is already registered to another account.' };
  }

  return {
    ok: true,
    e164,
    display: formatted.international_number || e164,
  };
}

/** True if normalized phone differs from stored user phone */
export function phoneNumberChanged(storedPhone, newPhone) {
  const a = normalizePhoneToE164(storedPhone || '');
  const b = normalizePhoneToE164(newPhone || '');
  if (!b) return !!a;
  return a !== b;
}
