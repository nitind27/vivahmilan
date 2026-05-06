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

    // Check if email already exists in user table
    const existing = await queryOne('SELECT id FROM `user` WHERE email = ?', [email]);
    if (existing)
      return NextResponse.json({ error: 'This email is already registered. Please login.' }, { status: 409 });

    // Check if phone already exists in user table
    if (phone) {
      const existingPhone = await queryOne('SELECT id FROM `user` WHERE phone = ?', [phone]);
      if (existingPhone)
        return NextResponse.json({ error: 'This phone number is already registered.' }, { status: 409 });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 12);
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    const pendingId = randomUUID();

    // Delete any existing pending registration for this email
    await execute('DELETE FROM pending_registration WHERE email = ?', [email]);

    // Store in pending_registration table (NOT in user table yet)
    await execute(
      `INSERT INTO pending_registration (id, name, email, phone, password, gender, otp, otpExpiresAt, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [pendingId, name, email, phone || null, hashed, gender || null, otp, otpExpiry]
    );

    try {
      await sendOTPEmail(email, name, otp, 'EMAIL_VERIFY');
      await sendWelcomeEmail(email, name);
    } catch (emailErr) {
      console.error('Email send failed:', emailErr.message, emailErr.code, emailErr.response);
      // Don't block registration — user can resend OTP
    }

    return NextResponse.json({
      message: 'Registration initiated. Please verify your email with the OTP sent.',
      email,
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
