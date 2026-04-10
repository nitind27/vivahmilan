import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { sendAdminVerificationEmail } from '@/lib/email';
import { getSiteConfig } from '@/lib/siteconfig';

export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const data = await req.json();

  const user = await prisma.user.findUnique({
    where: { id },
    select: { name: true, email: true, adminVerified: true, freeTrialUsed: true },
  });

  // When approving, also activate free trial if not already used
  let updateData = { ...data };
  if (data.adminVerified === true && !user?.adminVerified && !user?.freeTrialUsed) {
    const trialDays = parseInt(await getSiteConfig('freeTrialDays') || '1');
    if (trialDays > 0) {
      updateData.freeTrialUsed = true;
      updateData.freeTrialExpiry = new Date(Date.now() + trialDays * 86400000);
    }
  }

  const updated = await prisma.user.update({ where: { id }, data: updateData });

  if (data.adminVerified === true && !user?.adminVerified && user?.email) {
    const trialDays = parseInt(await getSiteConfig('freeTrialDays') || '1');
    try { await sendAdminVerificationEmail(user.email, user.name || 'User', trialDays); } catch (e) { console.error('Email error:', e.message); }
    await prisma.notification.create({
      data: {
        userId: id,
        type: 'VERIFICATION_APPROVED',
        title: '✅ Profile Approved!',
        message: 'Your profile has been verified by admin. You can now login and enjoy your free trial!',
        link: '/login',
      },
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
