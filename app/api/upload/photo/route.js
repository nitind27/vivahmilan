import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export const maxDuration = 30;

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('photo');
  const isMain = formData.get('isMain') === 'true';

  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

  const maxSize = 8 * 1024 * 1024; // 8MB
  if (file.size > maxSize) return NextResponse.json({ error: 'Max size 8MB' }, { status: 400 });

  if (!file.type.startsWith('image/'))
    return NextResponse.json({ error: 'Only images allowed' }, { status: 400 });

  // Compress client-side base64 is sent, or convert here
  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString('base64');
  const dataUrl = `data:${file.type};base64,${base64}`;

  // If setting as main, unset previous main
  if (isMain) {
    await prisma.photo.updateMany({
      where: { userId: session.user.id, isMain: true },
      data: { isMain: false },
    });
    // Also update user.image
    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: dataUrl },
    });
  }

  const photo = await prisma.photo.create({
    data: {
      userId: session.user.id,
      url: dataUrl,
      isMain,
    },
  });

  return NextResponse.json(photo, { status: 201 });
}

export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { photoId } = await req.json();
  await prisma.photo.deleteMany({ where: { id: photoId, userId: session.user.id } });
  return NextResponse.json({ success: true });
}
