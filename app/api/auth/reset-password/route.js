import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

export async function POST(req) {
  const { email, otp, password } = await req.json();

  if (!email || !otp || !password)
    return NextResponse.json({ error: 'All fields required' }, { status: 400 });
  if (password.length < 8)
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { email },
    include: { otps: { where: { type: 'PASSWORD_RESET', used: false }, orderBy: { createdAt: 'desc' }, take: 1 } },
  });

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const record = user.otps[0];
  if (!record) return NextResponse.json({ error: 'OTP not found. Request a new one.' }, { status: 400 });
  if (new Date() > record.expiresAt) return NextResponse.json({ error: 'OTP expired' }, { status: 400 });
  if (record.code !== otp) return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });

  const hashed = await bcrypt.hash(password, 12);
  await prisma.oTP.update({ where: { id: record.id }, data: { used: true } });
  await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });

  return NextResponse.json({ success: true, message: 'Password reset successfully' });
}
