import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { sendAdminVerificationEmail } from '@/lib/email';

export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const data = await req.json();

  // If adminVerified is being set to true, send email
  const user = await prisma.user.findUnique({ where: { id }, select: { name: true, email: true, adminVerified: true } });

  const updated = await prisma.user.update({ where: { id }, data });

  if (data.adminVerified === true && !user?.adminVerified && user?.email) {
    try { await sendAdminVerificationEmail(user.email, user.name || 'User'); } catch (e) { console.error('Email error:', e.message); }
    // Create notification
    await prisma.notification.create({
      data: { userId: id, type: 'VERIFICATION_APPROVED', title: '✅ Profile Approved!', message: 'Your profile has been verified by admin. You can now login.', link: '/login' },
    });
  }

  return NextResponse.json(updated);
}

export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
