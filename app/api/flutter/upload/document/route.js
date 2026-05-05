import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/flutter-jwt';
import prisma from '@/lib/prisma';
import { saveFile, deleteFile } from '@/lib/upload';

export const maxDuration = 30;

const ALLOWED_TYPES = ['Aadhaar Card', 'PAN Card', 'Voter ID Card', 'Passport', 'Driving License'];

export async function POST(req) {
  const token = getTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('document');
  const docType = formData.get('type');

  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });
  if (!ALLOWED_TYPES.includes(docType)) return NextResponse.json({ error: 'Invalid document type. Allowed: ' + ALLOWED_TYPES.join(', ') }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'Max size 5MB' }, { status: 400 });

  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (!allowed.includes(file.type)) return NextResponse.json({ error: 'Only JPG, PNG, WebP or PDF allowed' }, { status: 400 });

  const existing = await prisma.document.findFirst({ where: { userId: decoded.id, type: docType, status: 'PENDING' } });
  if (existing) {
    await deleteFile(existing.url);
    await prisma.document.delete({ where: { id: existing.id } });
  }

  const { url } = await saveFile(file, 'documents', decoded.id);
  const doc = await prisma.document.create({ data: { userId: decoded.id, type: docType, url, status: 'PENDING' } });

  return NextResponse.json({ id: doc.id, type: doc.type, status: doc.status }, { status: 201 });
}

export async function GET(req) {
  const token = getTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

  const docs = await prisma.document.findMany({
    where: { userId: decoded.id },
    select: { id: true, type: true, status: true, adminNote: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(docs);
}
