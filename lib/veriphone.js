import { normalizePhoneToE164 } from '@/lib/phoneNormalize';
import { PHONE_PLACEHOLDER } from '@/lib/phonePlaceholder';

const API_BASE = 'https://api.veriphone.io/v2/verify';

/**
 * Validate phone via Veriphone (https://veriphone.io/docs).
 * Without API key, falls back to local format check only (dev).
 */
export async function verifyPhoneWithVeriphone(phone) {
  const e164 = normalizePhoneToE164(phone);
  if (!e164 || e164.length < 11) {
    return { ok: false, error: `Enter a valid mobile number with country code (e.g. ${PHONE_PLACEHOLDER}).` };
  }

  const apiKey = process.env.VERIPHONE_API_KEY?.trim();
  if (!apiKey) {
    if (process.env.NODE_ENV === 'production') {
      return { ok: false, error: 'Phone verification service is not configured. Contact support.' };
    }
    return {
      ok: true,
      skipped: true,
      e164,
      phone_valid: true,
      phone_type: 'mobile',
      carrier: null,
      international_number: e164,
    };
  }

  try {
    const url = `${API_BASE}?phone=${encodeURIComponent(e164)}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(12000),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || data.status === 'error') {
      const msg = data.message || 'Could not validate this phone number.';
      if (res.status === 402) {
        return { ok: false, error: 'Phone validation credits exhausted. Please try again later.' };
      }
      return { ok: false, error: msg };
    }

    if (!data.phone_valid) {
      return { ok: false, error: 'This phone number is not valid. Please check and try again.' };
    }

    const type = (data.phone_type || '').toLowerCase();
    if (type && type !== 'mobile' && type !== 'unknown') {
      return {
        ok: false,
        error: 'Please enter a valid mobile number. Landline and VoIP numbers are not accepted.',
        phone_type: type,
      };
    }

    return {
      ok: true,
      e164: data.e164 || e164,
      phone_valid: true,
      phone_type: data.phone_type || 'mobile',
      carrier: data.carrier || null,
      country: data.country || null,
      international_number: data.international_number || e164,
    };
  } catch (e) {
    console.error('[veriphone]', e.message);
    return { ok: false, error: 'Phone validation service is temporarily unavailable. Try again.' };
  }
}
