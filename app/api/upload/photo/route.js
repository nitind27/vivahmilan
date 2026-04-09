import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { saveFile, deleteFile } from '@/lib/upload';

export const maxDuration = 30;

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('photo');
  const isMain = formData.get('isMain') === 'true';

  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });
  if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: 'Max size 8MB' }, { status: 400 });
  if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'Only images allowed' }, { status: 400 });

  const { url } = await saveFile(file, 'photos', session.user.id);

  if (isMain) {
    // Unset previous main
    await prisma.photo.updateMany({
      where: { userId: session.user.id, isMain: true },
      data: { isMain: false },
    });
    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: url },
    });
  }

  const photo = await prisma.photo.create({
    data: { userId: session.user.id, url, isMain },
  });

  return NextResponse.json(photo, { status: 201 });
}

export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { photoId } = await req.json();
  const photo = await prisma.photo.findFirst({ where: { id: photoId, userId: session.user.id } });
  if (photo) {
    await deleteFile(photo.url);
    await prisma.photo.delete({ where: { id: photoId } });
  }
  return NextResponse.json({ success: true });
}
