import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query, execute, queryOne } from '@/lib/db';
import { sendOTPEmail, sendWelcomeEmail } from '@/lib/email';
import { randomUUID } from 'crypto';

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req) {
  try {
    const { name, email, password, phone, gender } = await req.json();

    if (!name || !email || !password)
      return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 });
    if (password.length < 8)
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });

    const existing = await queryOne('SELECT id FROM `user` WHERE email = ?', [email]);
    if (existing)
      return NextResponse.json({ error: 'This email is already registered. Please login.' }, { status: 409 });

    if (phone) {
      const existingPhone = await queryOne('SELECT id FROM `user` WHERE phone = ?', [phone]);
      if (existingPhone)
        return NextResponse.json({ error: 'This phone number is already registered.' }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    const userId = randomUUID();
    const profileId = randomUUID();
    const otpId = randomUUID();
    const now = new Date();

    await execute(
      `INSERT INTO \`user\` (id, name, email, password, phone, role, isActive, isVerified, adminVerified, verificationBadge, isPremium, profileBoost, phoneVerified, loginOtpEnabled, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, 'USER', 1, 0, 0, 0, 0, 0, 0, 0, ?, ?)`,
      [userId, name, email, hashed, phone || null, now, now]
    );

    await execute(
      `INSERT INTO profile (id, userId, gender, profileComplete, maritalStatus, smoking, drinking, hidePhone, hidePhoto, createdAt, updatedAt)
       VALUES (?, ?, ?, 10, 'NEVER_MARRIED', 'NO', 'NO', 0, 0, ?, ?)`,
      [profileId, userId, gender || null, now, now]
    );

    await execute(
      `INSERT INTO otp (id, userId, code, type, expiresAt, used, createdAt)
       VALUES (?, ?, ?, 'EMAIL_VERIFY', ?, 0, ?)`,
      [otpId, userId, otp, otpExpiry, now]
    );

    try {
      await sendOTPEmail(email, name, otp, 'EMAIL_VERIFY');
      await sendWelcomeEmail(email, name);
    } catch (emailErr) {
      console.error('Email send failed:', emailErr.message, emailErr.code, emailErr.response);
      // Don't block registration — user can resend OTP
    }

    return NextResponse.json({
      user: { id: userId, name, email },
      message: 'Registration successful. Please verify your email.',
      requiresOTP: true,
    }, { status: 201 });

  } catch (err) {
    if (err?.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Email or phone already registered.' }, { status: 409 });
    }
    console.error('Register error:', err);
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 });
  }
}
