import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { receiverId, message } = await req.json();

  const existing = await prisma.interest.findUnique({
    where: { senderId_receiverId: { senderId: session.user.id, receiverId } },
  });
  if (existing) return NextResponse.json({ error: 'Interest already sent' }, { status: 409 });

  const interest = await prisma.interest.create({
    data: { senderId: session.user.id, receiverId, message },
  });

  // Create notification
  await prisma.notification.create({
    data: {
      userId: receiverId,
      type: 'INTEREST_RECEIVED',
      title: 'New Interest Received',
      message: `${session.user.name} has sent you an interest request.`,
      link: `/profile/${session.user.id}`,
    },
  });

  return NextResponse.json(interest, { status: 201 });
}

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'received'; // received | sent

  const interests = await prisma.interest.findMany({
    where: type === 'received' ? { receiverId: session.user.id } : { senderId: session.user.id },
    include: {
      sender: { include: { profile: true, photos: { where: { isMain: true }, take: 1 } } },
      receiver: { include: { profile: true, photos: { where: { isMain: true }, take: 1 } } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(interests);
}
