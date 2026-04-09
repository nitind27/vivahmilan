import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const list = await prisma.shortlist.findMany({
    where: { ownerId: session.user.id },
    include: { target: { include: { profile: true, photos: { where: { isMain: true }, take: 1 } } } },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(list);
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { targetId } = await req.json();

  const existing = await prisma.shortlist.findUnique({
    where: { ownerId_targetId: { ownerId: session.user.id, targetId } },
  });

  if (existing) {
    await prisma.shortlist.delete({ where: { ownerId_targetId: { ownerId: session.user.id, targetId } } });
    return NextResponse.json({ shortlisted: false });
  }

  await prisma.shortlist.create({ data: { ownerId: session.user.id, targetId } });
  return NextResponse.json({ shortlisted: true }, { status: 201 });
}
