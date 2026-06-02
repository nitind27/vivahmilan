/**
 * Send OTP SMS — MSG91 (India) or Twilio. Set SMS_PROVIDER=console for local dev.
 */

function otpMessage(code) {
  return `Your Vivah Dwar verification code is ${code}. Valid for 10 minutes. Do not share this OTP with anyone.`;
}

async function sendViaMsg91(mobileDigits, otp) {
  const authkey = process.env.MSG91_AUTH_KEY?.trim();
  const templateId = process.env.MSG91_TEMPLATE_ID?.trim();
  if (!authkey) throw new Error('MSG91_AUTH_KEY not configured');

  const body = {
    mobile: mobileDigits,
    otp,
    ...(templateId ? { template_id: templateId } : {}),
  };

  const res = await fetch('https://control.msg91.com/api/v5/otp', {
    method: 'POST',
    headers: {
      authkey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.type === 'error') {
    throw new Error(data.message || 'MSG91 OTP send failed');
  }
  return { provider: 'msg91', messageId: data.request_id || null };
}

async function sendViaTwilio(e164, otp) {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_PHONE_NUMBER?.trim();
  if (!sid || !token || !from) throw new Error('Twilio SMS not configured');

  const auth = Buffer.from(`${sid}:${token}`).toString('base64');
  const body = new URLSearchParams({
    To: e164,
    From: from,
    Body: otpMessage(otp),
  });
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
    signal: AbortSignal.timeout(15000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Twilio SMS failed');
  return { provider: 'twilio', messageId: data.sid };
}

/**
 * @param {string} e164 e.g. +918735995467
 */
export async function sendPhoneOtpSms(e164, otp) {
  const provider = (process.env.SMS_PROVIDER || 'msg91').toLowerCase();
  const digits = e164.replace(/\D/g, '');

  if (provider === 'console' || process.env.SMS_OTP_CONSOLE === '1') {
    console.log(`[SMS OTP] ${e164} → ${otp}`);
    return { provider: 'console', dev: true };
  }

  if (provider === 'twilio') {
    return sendViaTwilio(e164, otp);
  }

  // Default MSG91 — expects 91XXXXXXXXXX (no +)
  const mobile = digits.startsWith('91') ? digits : `91${digits}`;
  return sendViaMsg91(mobile, otp);
}

export function isSmsConfigured() {
  const provider = (process.env.SMS_PROVIDER || 'msg91').toLowerCase();
  if (provider === 'console' || process.env.SMS_OTP_CONSOLE === '1') return true;
  if (provider === 'twilio') {
    return !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER);
  }
  return !!process.env.MSG91_AUTH_KEY?.trim();
}
