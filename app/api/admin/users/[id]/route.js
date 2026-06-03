import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { sendAdminVerificationEmail, sendProfileRejectionEmail } from '@/lib/email';
import { getSiteConfig } from '@/lib/siteconfig';
import { hash } from 'bcryptjs';
import { validateAdminApproval } from '@/lib/profileVerification';
import { ensureFeatureTables } from '@/lib/ensureFeatureTables.js';
import { permanentlyDeleteUserAccount } from '@/lib/deleteUserAccount.js';

export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const data = await req.json();

  if (data.profileCorrectionRequest) {
    const { requestProfileCorrection } = await import('@/lib/profileCorrection.js');
    const result = await requestProfileCorrection(id, {
      message: data.profileCorrectionRequest.message,
      fields: data.profileCorrectionRequest.fields,
      sendEmail: data.profileCorrectionRequest.sendEmail !== false,
      adminId: session.user.id,
      adminName: session.user.name || session.user.email,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status || 400 });
    }
    return NextResponse.json({
      success: true,
      correctionUrl: result.correctionUrl,
      emailSent: result.emailSent,
      fields: result.fields,
    });
  }

  if (data.profileRejection) {
    const reason = (data.profileRejection.reason || '').trim();
    const sendEmail = data.profileRejection.sendEmail !== false;
    if (reason.length < 10) {
      return NextResponse.json(
        { error: 'Please provide a rejection reason (at least 10 characters).' },
        { status: 400 }
      );
    }

    await ensureFeatureTables();

    const user = await prisma.user.findUnique({
      where: { id },
      select: { name: true, email: true, adminVerified: true, isActive: true },
    });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (user.adminVerified) {
      return NextResponse.json({ error: 'Cannot reject an already approved profile.' }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        isActive: false,
        profileRejectionReason: reason,
        profileRejectedAt: new Date(),
      },
    });

    let emailSent = false;
    if (sendEmail && user.email) {
      try {
        await sendProfileRejectionEmail(user.email, user.name || 'User', reason);
        emailSent = true;
      } catch (e) {
        console.error('Rejection email error:', e.message);
      }
    }

    await prisma.notification.create({
      data: {
        userId: id,
        type: 'VERIFICATION_REJECTED',
        title: 'Profile not approved',
        message: reason.length > 200 ? `${reason.slice(0, 197)}…` : reason,
        link: '/contact',
      },
    });

    try {
      const { sendPushToUser } = await import('@/lib/webpush');
      await sendPushToUser(id, {
        title: 'Profile not approved',
        body: reason.length > 120 ? `${reason.slice(0, 117)}…` : reason,
        url: '/contact',
      });
    } catch (e) {
      console.error('Rejection push error:', e.message);
    }

    return NextResponse.json({ ...updated, emailSent });
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: { name: true, email: true, adminVerified: true, freeTrialUsed: true },
  });

  if (data.adminVerified === true && !user?.adminVerified) {
    const approval = await validateAdminApproval(id);
    if (!approval.ok) {
      return NextResponse.json({
        error: approval.message,
        code: approval.code,
        checklist: approval.checklist,
        errors: approval.errors,
      }, { status: 422 });
    }
  }

  // When approving, also activate free trial if not already used
  let updateData = { ...data };
  if (data.adminVerified === true) {
    updateData.profileCorrectionRequired = false;
    updateData.profileCorrectionNote = null;
    updateData.profileCorrectionFields = null;
    updateData.profileCorrectionRequestedAt = null;
    updateData.profileCorrectionToken = null;
  }
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

  if (data.adminVerified === true && !user?.adminVerified) {
    try {
      const { execute } = await import('@/lib/db');
      await execute('UPDATE profile SET profileComplete = 100, updatedAt = NOW() WHERE userId = ?', [id]);
    } catch (e) { console.error('profileComplete sync:', e.message); }
  }

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

    // Notify matching users (same religion/caste, opposite gender)
    try {
      const { notifyMatchingUsersOfNewProfile } = await import('@/lib/newMatchNotifications');
      setTimeout(() => notifyMatchingUsersOfNewProfile(id).catch(e => {
        console.error('Match notification error:', e.message);
      }), 0);
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
  let body = {};
  try {
    body = await req.json();
  } catch {
    // no body
  }

  const confirmEmail = (body.confirmEmail || '').trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { id },
    select: { email: true, isActive: true, role: true },
  });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const expectedEmail = (user.email || '').trim().toLowerCase();
  if (!expectedEmail || confirmEmail !== expectedEmail) {
    return NextResponse.json(
      { error: 'Type the user\'s email exactly to confirm permanent deletion.' },
      { status: 400 }
    );
  }

  const result = await permanentlyDeleteUserAccount(id, {
    adminId: session.user.id,
    adminName: session.user.name || session.user.email,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status || 400 });
  }

  return NextResponse.json({
    success: true,
    deletedUserId: result.deletedUserId,
    message: 'Account and all related data permanently removed from the database.',
  });
}
