import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const maxDuration = 30;

export async function POST(req) {
  const formData = await req.formData();
  const file = formData.get('document');
  const email = formData.get('email');
  const docType = formData.get('type');

  if (!email || !file || !docType) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.emailVerified) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'Max 5MB' }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const dataUrl = `data:${file.type};base64,${Buffer.from(bytes).toString('base64')}`;

  await prisma.document.deleteMany({ where: { userId: user.id, type: docType, status: 'PENDING' } });
  const doc = await prisma.document.create({
    data: { userId: user.id, type: docType, url: dataUrl, status: 'PENDING' },
  });

  return NextResponse.json({ id: doc.id, type: doc.type, status: doc.status });
}
