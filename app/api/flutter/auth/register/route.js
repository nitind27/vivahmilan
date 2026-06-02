import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { queryOne, execute } from '@/lib/db';
import { sendOTPEmail, sendWelcomeEmail } from '@/lib/email';
import { capturePendingRegistrationGeo } from '@/lib/geoTracking';
import { isDisposableEmail, DISPOSABLE_EMAIL_MESSAGE } from '@/lib/disposableEmails';
import { resolvePhoneForRegistration } from '@/lib/phoneVerification';
import { randomUUID } from 'crypto';

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, email, phone, password, phoneVerificationToken } = body;
    const geo = await capturePendingRegistrationGeo(req, body);

    if (!name || !email || !password)
      return NextResponse.json({ error: 'name, email and password are required' }, { status: 400 });
    if (password.length < 8)
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    if (isDisposableEmail(email))
      return NextResponse.json({ error: DISPOSABLE_EMAIL_MESSAGE }, { status: 400 });

    if (!phone?.trim()) {
      return NextResponse.json({ error: 'phone is required' }, { status: 400 });
    }

    const phoneCheck = await resolvePhoneForRegistration(phone, phoneVerificationToken);
    if (!phoneCheck.ok) {
      return NextResponse.json({ error: phoneCheck.error }, { status: 400 });
    }
    const phoneE164 = phoneCheck.e164;
    const phoneVerifiedFlag = phoneCheck.phoneVerified ? 1 : 0;

    // Check if email already exists in user table
    const existing = await queryOne('SELECT id FROM `user` WHERE email = ?', [email]);
    if (existing)
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });

    // Check if phone already exists in user table
    const existingPhone = await queryOne(
      'SELECT id FROM `user` WHERE phone = ? OR phone = ?',
      [phoneE164, phone]
    );
    if (existingPhone) {
      return NextResponse.json({ error: 'Phone number already registered' }, { status: 409 });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 12);
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const pendingId = randomUUID();

    // Delete any existing pending registration for this email
    await execute('DELETE FROM pending_registration WHERE email = ?', [email.toLowerCase().trim()]);

    // Store in pending_registration table (NOT in user table yet)
    await execute(
      `INSERT INTO pending_registration
        (id, name, email, phone, phoneE164, phoneVerified, password, otp, otpExpiresAt,
         registrationIp, registrationCountry, registrationCity, registrationLat, registrationLon, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        pendingId, name.trim(), email.toLowerCase().trim(), phoneE164, phoneE164, phoneVerifiedFlag, hashed, otp, expiresAt,
        geo.ip, geo.country, geo.city, geo.latitude, geo.longitude,
      ]
    );

    await sendOTPEmail(email, name, otp, 'EMAIL_VERIFY');

    try { await sendWelcomeEmail(email, name); } catch {}

    return NextResponse.json({
      success: true,
      message: phoneCheck.phoneVerified
        ? 'Registration initiated. Mobile verified. OTP sent to your email.'
        : 'Registration initiated. OTP sent to your email.',
      email: email.toLowerCase().trim(),
      phoneVerified: !!phoneCheck.phoneVerified,
    }, { status: 201 });

  } catch (err) {
    console.error('Flutter register error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
