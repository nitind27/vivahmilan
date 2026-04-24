import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET() {
  const stories = await prisma.successStory.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });
  return NextResponse.json(stories);
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id, coupleName, location, story, imageUrl, isActive, sortOrder } = await req.json();

  if (id) {
    const updated = await prisma.successStory.update({
      where: { id },
      data: { coupleName, location, story, imageUrl, isActive, sortOrder: sortOrder ?? 0 },
    });
    return NextResponse.json(updated);
  }

  if (!coupleName || !story)
    return NextResponse.json({ error: 'coupleName and story required' }, { status: 400 });

  const created = await prisma.successStory.create({
    data: { coupleName, location: location || '', story, imageUrl: imageUrl || null, isActive: isActive ?? true, sortOrder: sortOrder ?? 0 },
  });
  return NextResponse.json(created, { status: 201 });
}

export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await req.json();
  await prisma.successStory.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
