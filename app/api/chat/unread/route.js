import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ count: 0 });

  // Total unread messages across all rooms
  const count = await prisma.message.count({
    where: { receiverId: session.user.id, isRead: false },
  });

  // Per-room unread counts
  const perRoom = await prisma.message.groupBy({
    by: ['chatRoomId'],
    where: { receiverId: session.user.id, isRead: false },
    _count: { id: true },
  });

  return NextResponse.json({
    total: count,
    perRoom: Object.fromEntries(perRoom.map(r => [r.chatRoomId, r._count.id])),
  });
}
