import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { queryOne, execute } from '@/lib/db';
import { sendOTPEmail, sendWelcomeEmail } from '@/lib/email';
import { randomUUID } from 'crypto';

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req) {
  try {
    const { name, email, phone, password } = await req.json();

    if (!name || !email || !password)
      return NextResponse.json({ error: 'name, email and password are required' }, { status: 400 });
    if (password.length < 8)
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });

    const existing = await queryOne('SELECT id FROM `user` WHERE email = ?', [email]);
    if (existing)
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });

    const hashed = await bcrypt.hash(password, 12);
    const userId = randomUUID();
    const profileId = randomUUID();
    const now = new Date();

    // Create user
    await execute(
      `INSERT INTO \`user\` (id, name, email, phone, password, role, isActive, isVerified,
        adminVerified, verificationBadge, isPremium, profileBoost, phoneVerified,
        loginOtpEnabled, needsPassword, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, 'USER', 1, 0, 0, 0, 0, 0, 0, 0, 0, ?, ?)`,
      [userId, name.trim(), email.toLowerCase().trim(), phone || null, hashed, now, now]
    );

    // Create empty profile
    await execute(
      `INSERT INTO profile (id, userId, profileComplete, maritalStatus, smoking, drinking,
        hidePhone, hidePhoto, createdAt, updatedAt)
       VALUES (?, ?, 10, 'NEVER_MARRIED', 'NO', 'NO', 0, 0, ?, ?)`,
      [profileId, userId, now, now]
    );

    // Generate & send OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const otpId = randomUUID();

    await execute(
      `INSERT INTO otp (id, userId, code, type, expiresAt, used, createdAt)
       VALUES (?, ?, ?, 'EMAIL_VERIFY', ?, 0, NOW())`,
      [otpId, userId, otp, expiresAt]
    );

    await sendOTPEmail(email, name, otp, 'EMAIL_VERIFY');

    try { await sendWelcomeEmail(email, name); } catch {}

    return NextResponse.json({
      success: true,
      message: 'Registration successful. OTP sent to your email.',
      userId,
      email,
    }, { status: 201 });

  } catch (err) {
    console.error('Flutter register error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
