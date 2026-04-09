import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      profile: true,
      photos: { where: { isMain: false } },
    },
  });

  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Record profile view
  if (session.user.id !== id) {
    await prisma.profileView.upsert({
      where: { viewerId_viewedId: { viewerId: session.user.id, viewedId: id } },
      create: { viewerId: session.user.id, viewedId: id },
      update: { createdAt: new Date() },
    });
  }

  // Check if blocked
  const blocked = await prisma.block.findFirst({
    where: { OR: [{ blockerId: session.user.id, blockedId: id }, { blockerId: id, blockedId: session.user.id }] },
  });
  if (blocked) return NextResponse.json({ error: 'Profile unavailable' }, { status: 403 });

  // Interest status — include direction (sent/received) and id
  const interest = await prisma.interest.findFirst({
    where: { OR: [{ senderId: session.user.id, receiverId: id }, { senderId: id, receiverId: session.user.id }] },
  });

  // Shortlist status
  const shortlisted = await prisma.shortlist.findUnique({
    where: { ownerId_targetId: { ownerId: session.user.id, targetId: id } },
  });

  // Hide sensitive data based on privacy settings
  const safeUser = { ...user };
  if (user.profile?.hidePhone) safeUser.phone = null;
  if (user.profile?.hidePhoto && !session.user.isPremium) safeUser.photos = [];

  return NextResponse.json({
    ...safeUser,
    interestStatus: interest?.status || null,
    interestDirection: interest ? (interest.senderId === session.user.id ? 'sent' : 'received') : null,
    interestId: interest?.id || null,
    isShortlisted: !!shortlisted,
  });
}
