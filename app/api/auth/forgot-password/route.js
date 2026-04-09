import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendOTPEmail } from '@/lib/email';

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ error: 'No account found with this email' }, { status: 404 });

  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.oTP.updateMany({ where: { userId: user.id, type: 'PASSWORD_RESET', used: false }, data: { used: true } });
  await prisma.oTP.create({ data: { userId: user.id, code: otp, type: 'PASSWORD_RESET', expiresAt } });

  await sendOTPEmail(email, user.name, otp, 'PASSWORD_RESET');

  return NextResponse.json({ success: true, message: 'OTP sent to your email' });
}
