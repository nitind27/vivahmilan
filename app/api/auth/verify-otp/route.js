import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req) {
  const { email, otp, type = 'EMAIL_VERIFY' } = await req.json();

  const user = await prisma.user.findUnique({
    where: { email },
    include: { otps: { where: { type, used: false }, orderBy: { createdAt: 'desc' }, take: 1 } },
  });

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const record = user.otps[0];
  if (!record) return NextResponse.json({ error: 'OTP not found. Request a new one.' }, { status: 400 });
  if (new Date() > record.expiresAt) return NextResponse.json({ error: 'OTP expired. Request a new one.' }, { status: 400 });
  if (record.code !== otp) return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });

  // Mark OTP used
  await prisma.oTP.update({ where: { id: record.id }, data: { used: true } });

  if (type === 'EMAIL_VERIFY') {
    await prisma.user.update({ where: { id: user.id }, data: { emailVerified: new Date() } });
  }

  return NextResponse.json({ success: true, message: 'OTP verified successfully' });
}
