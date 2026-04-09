import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export const maxDuration = 30;

const ALLOWED_TYPES = ['Aadhaar Card', 'PAN Card', 'Voter ID Card', 'Passport', 'Driving License'];

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('document');
  const docType = formData.get('type');

  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });
  if (!ALLOWED_TYPES.includes(docType))
    return NextResponse.json({ error: 'Invalid document type' }, { status: 400 });

  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) return NextResponse.json({ error: 'Max size 5MB' }, { status: 400 });

  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (!allowed.includes(file.type))
    return NextResponse.json({ error: 'Only JPG, PNG, WebP or PDF allowed' }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString('base64');
  const dataUrl = `data:${file.type};base64,${base64}`;

  // Delete previous pending document of same type
  await prisma.document.deleteMany({
    where: { userId: session.user.id, type: docType, status: 'PENDING' },
  });

  const doc = await prisma.document.create({
    data: {
      userId: session.user.id,
      type: docType,
      url: dataUrl,
      status: 'PENDING',
    },
  });

  return NextResponse.json({ id: doc.id, type: doc.type, status: doc.status }, { status: 201 });
}

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const docs = await prisma.document.findMany({
    where: { userId: session.user.id },
    select: { id: true, type: true, status: true, adminNote: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(docs);
}
