import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendOTPEmail } from '@/lib/email';

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req) {
  const { email, type = 'EMAIL_VERIFY' } = await req.json();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  // Invalidate old OTPs
  await prisma.oTP.updateMany({ where: { userId: user.id, type, used: false }, data: { used: true } });

  await prisma.oTP.create({ data: { userId: user.id, code: otp, type, expiresAt } });

  await sendOTPEmail(email, user.name, otp, type);

  return NextResponse.json({ success: true, message: 'OTP sent to your email' });
}
