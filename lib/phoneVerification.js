import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
import { execute, queryOne, query } from '@/lib/db';
import { ensureFeatureTables } from '@/lib/ensureFeatureTables';
import { normalizePhoneToE164 } from '@/lib/phoneNormalize';
import { verifyPhoneWithVeriphone } from '@/lib/veriphone';
import { sendPhoneOtpSms, isSmsConfigured } from '@/lib/smsOtp';

const OTP_TTL_MS = 10 * 60 * 1000;
const TOKEN_TTL_MS = 30 * 60 * 1000;
const MAX_SENDS_PER_HOUR = 5;
const MAX_VERIFY_ATTEMPTS = 5;

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function tokenSecret() {
  return process.env.NEXTAUTH_SECRET || process.env.PHONE_VERIFY_SECRET || 'phone-verify-dev-secret';
}

function signPayload(payload) {
  return createHmac('sha256', tokenSecret()).update(JSON.stringify(payload)).digest('hex');
}

export function signPhoneVerificationToken(phoneE164) {
  const exp = Date.now() + TOKEN_TTL_MS;
  const payload = { phone: phoneE164, exp, v: 1 };
  const sig = signPayload(payload);
  return Buffer.from(JSON.stringify({ ...payload, sig })).toString('base64url');
}

export function verifyPhoneVerificationToken(token, phoneE164) {
  if (!token || !phoneE164) return false;
  try {
    const parsed = JSON.parse(Buffer.from(token, 'base64url').toString('utf8'));
    if (parsed.phone !== phoneE164 || Date.now() > parsed.exp) return false;
    const payload = { phone: parsed.phone, exp: parsed.exp, v: parsed.v ?? 1 };
    const expected = signPayload(payload);
    const a = Buffer.from(expected);
    const b = Buffer.from(parsed.sig || '');
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function validateAndFormatPhone(phone) {
  const check = await verifyPhoneWithVeriphone(phone);
  if (!check.ok) return check;
  return {
    ok: true,
    e164: check.e164,
    phone_type: check.phone_type,
    carrier: check.carrier,
    international_number: check.international_number,
    skipped: !!check.skipped,
  };
}

export async function sendPhoneVerificationOtp(phone) {
  await ensureFeatureTables();

  if (!isSmsConfigured()) {
    return { ok: false, error: 'SMS service is not configured. Add MSG91_AUTH_KEY or set SMS_PROVIDER=console for testing.' };
  }

  const formatted = await validateAndFormatPhone(phone);
  if (!formatted.ok) return formatted;

  const e164 = formatted.e164;

  const existingUser = await queryOne('SELECT id FROM `user` WHERE phone = ? OR phone = ?', [e164, phone]);
  if (existingUser) {
    return { ok: false, error: 'This phone number is already registered.' };
  }

  const recent = await queryOne(
    `SELECT COUNT(*) AS cnt FROM phone_verification
     WHERE phoneE164 = ? AND createdAt >= DATE_SUB(NOW(), INTERVAL 1 HOUR)`,
    [e164]
  );
  if (Number(recent?.cnt || 0) >= MAX_SENDS_PER_HOUR) {
    return { ok: false, error: 'Too many OTP requests for this number. Try again after an hour.' };
  }

  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);
  const id = randomUUID();

  await execute(
    `INSERT INTO phone_verification (id, phoneE164, otp, expiresAt, verified, attempts, carrier, phoneType, createdAt)
     VALUES (?, ?, ?, ?, 0, 0, ?, ?, NOW())`,
    [id, e164, otp, expiresAt, formatted.carrier || null, formatted.phone_type || null]
  );

  try {
    await sendPhoneOtpSms(e164, otp);
  } catch (e) {
    console.error('[phone OTP SMS]', e.message);
    return { ok: false, error: 'Failed to send SMS. Please check the number and try again.' };
  }

  const devHint = process.env.SMS_PROVIDER === 'console' || process.env.SMS_OTP_CONSOLE === '1';

  return {
    ok: true,
    e164,
    phoneDisplay: formatted.international_number || e164,
    message: 'Verification code sent via SMS.',
    expiresInSeconds: OTP_TTL_MS / 1000,
    ...(devHint ? { devOtp: otp } : {}),
  };
}

export async function verifyPhoneVerificationOtp(phone, otp) {
  await ensureFeatureTables();

  const e164 = normalizePhoneToE164(phone);
  if (!e164) return { ok: false, error: 'Invalid phone number.' };

  const row = await queryOne(
    `SELECT * FROM phone_verification
     WHERE phoneE164 = ? AND verified = 0
     ORDER BY createdAt DESC LIMIT 1`,
    [e164]
  );

  if (!row) {
    return { ok: false, error: 'No OTP found. Please request a new code.' };
  }

  if (new Date() > new Date(row.expiresAt)) {
    return { ok: false, error: 'OTP expired. Please request a new code.' };
  }

  if (Number(row.attempts || 0) >= MAX_VERIFY_ATTEMPTS) {
    return { ok: false, error: 'Too many incorrect attempts. Request a new OTP.' };
  }

  if (String(row.otp) !== String(otp).trim()) {
    await execute('UPDATE phone_verification SET attempts = attempts + 1 WHERE id = ?', [row.id]);
    return { ok: false, error: 'Invalid OTP. Please try again.' };
  }

  await execute('UPDATE phone_verification SET verified = 1 WHERE id = ?', [row.id]);

  const phoneVerificationToken = signPhoneVerificationToken(e164);

  return {
    ok: true,
    e164,
    phoneVerificationToken,
    message: 'Phone number verified successfully.',
  };
}

/** Require token on register — must match submitted phone */
export function assertPhoneVerifiedForRegister(phone, phoneVerificationToken) {
  const e164 = normalizePhoneToE164(phone);
  if (!e164) return { ok: false, error: 'Invalid phone number.' };
  if (!phoneVerificationToken || !verifyPhoneVerificationToken(phoneVerificationToken, e164)) {
    return { ok: false, error: 'Please verify your mobile number with the SMS OTP before continuing.' };
  }
  return { ok: true, e164 };
}
