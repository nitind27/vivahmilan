/** Normalize user input to E.164 (India default +91). */
export function normalizePhoneToE164(phone, defaultCountry = 'IN') {
  if (!phone || typeof phone !== 'string') return '';
  let digits = phone.replace(/\D/g, '');
  if (!digits) return '';

  if (digits.startsWith('91') && digits.length === 12) {
    return `+${digits}`;
  }
  if (digits.length === 10 && defaultCountry === 'IN') {
    return `+91${digits}`;
  }
  if (phone.trim().startsWith('+')) {
    return `+${digits}`;
  }
  if (digits.length >= 10 && digits.length <= 15) {
    return `+${digits}`;
  }
  return '';
}

export function displayPhone(e164) {
  if (!e164) return '';
  const d = e164.replace(/\D/g, '');
  if (d.startsWith('91') && d.length === 12) {
    return `+91 ${d.slice(2, 7)} ${d.slice(7)}`;
  }
  return e164;
}
