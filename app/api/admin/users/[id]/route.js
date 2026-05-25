import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { sendAdminVerificationEmail } from '@/lib/email';
import { getSiteConfig } from '@/lib/siteconfig';
import { hash } from 'bcryptjs';

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

  // Hash password if admin is changing it
  if (data.password) {
    updateData.password = await hash(data.password, 10);
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
    // Web Push
    try {
      const { sendPushToUser } = await import('@/lib/webpush');
      await sendPushToUser(id, {
        title: '✅ Profile Approved!',
        body: `Welcome to Milan Matrimony! Your ${trialDays}-day free trial starts now.`,
        url: '/login',
      });
    } catch (e) { console.error('Push error:', e.message); }

    // Notify matching users (same religion, caste, opposite gender)
    try {
      const profile = await prisma.profile.findUnique({ where: { userId: id } });
      if (profile && profile.religion && profile.caste) {
        const matchingProfiles = await prisma.profile.findMany({
          where: {
            religion: profile.religion,
            caste: profile.caste,
            gender: profile.gender === 'MALE' ? 'FEMALE' : 'MALE',
            userId: { not: id }
          },
          select: { userId: true }
        });

        if (matchingProfiles.length > 0) {
          const title = 'New Profile Match!';
          const body = `A new profile matching your religion and caste has joined. Check it out!`;
          const url = `/profile/${id}`;
          const { sendPushToMobile } = await import('@/lib/fcm');
          const { sendPushToUser } = await import('@/lib/webpush');

          // Process in small batches or asynchronously so we don't block the API response
          setTimeout(async () => {
            for (const match of matchingProfiles) {
              try {
                await prisma.notification.create({
                  data: {
                    userId: match.userId,
                    type: 'NEW_MATCH',
                    title,
                    message: body,
                    link: url,
                  }
                });
                await sendPushToMobile(match.userId, {
                  title,
                  body,
                  data: { type: 'NEW_PROFILE', profileId: id, url, isPremiumRequired: 'true' }
                });
                await sendPushToUser(match.userId, {
                  title,
                  body,
                  url,
                });
              } catch (err) {
                console.error('Error sending match notification:', err.message);
              }
            }
          }, 0);
        }
      }
    } catch (e) {
      console.error('Match notification logic error:', e.message);
    }
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
