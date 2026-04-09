import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { blockedId } = await req.json();

  const existing = await prisma.block.findUnique({
    where: { blockerId_blockedId: { blockerId: session.user.id, blockedId } },
  });

  if (existing) {
    await prisma.block.delete({ where: { blockerId_blockedId: { blockerId: session.user.id, blockedId } } });
    return NextResponse.json({ blocked: false });
  }

  await prisma.block.create({ data: { blockerId: session.user.id, blockedId } });
  return NextResponse.json({ blocked: true }, { status: 201 });
}
