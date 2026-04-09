import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const docs = await prisma.document.findMany({
    where: { status: 'PENDING' },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(docs);
}

export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { docId, status, adminNote } = await req.json();

  const doc = await prisma.document.update({
    where: { id: docId },
    data: { status, adminNote },
  });

  if (status === 'APPROVED') {
    await prisma.user.update({
      where: { id: doc.userId },
      data: { isVerified: true, verificationBadge: true },
    });
    await prisma.notification.create({
      data: {
        userId: doc.userId,
        type: 'VERIFICATION_APPROVED',
        title: 'Profile Verified',
        message: 'Your profile has been verified successfully.',
      },
    });
  }

  return NextResponse.json(doc);
}
