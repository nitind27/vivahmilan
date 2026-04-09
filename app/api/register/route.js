import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { sendOTPEmail, sendWelcomeEmail } from '@/lib/email';

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

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing)
      return NextResponse.json({ error: 'This email is already registered. Please login.' }, { status: 409 });

    if (phone) {
      const existingPhone = await prisma.user.findUnique({ where: { phone } });
      if (existingPhone)
        return NextResponse.json({ error: 'This phone number is already registered.' }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    const user = await prisma.user.create({
      data: {
        name, email,
        password: hashed,
        phone: phone || null,
        adminVerified: false, // requires admin approval
        profile: { create: { gender: gender || null, profileComplete: 10 } },
        otps: {
          create: { code: otp, type: 'EMAIL_VERIFY', expiresAt: otpExpiry },
        },
      },
      select: { id: true, name: true, email: true },
    });

    // Send OTP email
    try {
      await sendOTPEmail(email, name, otp, 'EMAIL_VERIFY');
      await sendWelcomeEmail(email, name);
    } catch (emailErr) {
      console.error('Email send failed:', emailErr.message);
    }

    return NextResponse.json({
      user,
      message: 'Registration successful. Please verify your email.',
      requiresOTP: true,
    }, { status: 201 });
  } catch (err) {
    if (err?.message?.includes('Unique') || err?.code === 'P2002') {
      return NextResponse.json({ error: 'Email or phone already registered.' }, { status: 409 });
    }
    console.error('Register error:', err);
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 });
  }
}
