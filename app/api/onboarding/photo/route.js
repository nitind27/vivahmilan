import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { saveFile } from '@/lib/upload';

export const maxDuration = 30;

export async function POST(req) {
  const formData = await req.formData();
  const file = formData.get('photo');
  const email = formData.get('email');

  if (!email || !file) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.emailVerified) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: 'Max 8MB' }, { status: 400 });
  if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'Images only' }, { status: 400 });

  const { url } = await saveFile(file, 'photos', user.id);

  await prisma.photo.updateMany({ where: { userId: user.id, isMain: true }, data: { isMain: false } });
  await prisma.user.update({ where: { id: user.id }, data: { image: url } });
  await prisma.photo.create({ data: { userId: user.id, url, isMain: true } });

  return NextResponse.json({ success: true, url });
}
