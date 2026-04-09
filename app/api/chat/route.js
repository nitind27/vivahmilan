import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rooms = await prisma.chatRoom.findMany({
    where: { OR: [{ userAId: session.user.id }, { userBId: session.user.id }] },
    include: {
      userA: { include: { profile: true, photos: { where: { isMain: true }, take: 1 } } },
      userB: { include: { profile: true, photos: { where: { isMain: true }, take: 1 } } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(rooms);
}
