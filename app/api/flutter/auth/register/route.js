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

    // Check if email already exists in user table
    const existing = await queryOne('SELECT id FROM `user` WHERE email = ?', [email]);
    if (existing)
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });

    // Check if phone already exists in user table
    if (phone) {
      const existingPhone = await queryOne('SELECT id FROM `user` WHERE phone = ?', [phone]);
      if (existingPhone)
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
      `INSERT INTO pending_registration (id, name, email, phone, password, otp, otpExpiresAt, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [pendingId, name.trim(), email.toLowerCase().trim(), phone || null, hashed, otp, expiresAt]
    );

    await sendOTPEmail(email, name, otp, 'EMAIL_VERIFY');

    try { await sendWelcomeEmail(email, name); } catch {}

    return NextResponse.json({
      success: true,
      message: 'Registration initiated. OTP sent to your email.',
      email: email.toLowerCase().trim(),
    }, { status: 201 });

  } catch (err) {
    console.error('Flutter register error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
