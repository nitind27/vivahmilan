import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { saveFile } from '@/lib/upload';

export const maxDuration = 30;

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('photo');
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'Max size 5MB' }, { status: 400 });
  if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'Only images allowed' }, { status: 400 });

  try {
    const { url } = await saveFile(file, 'photos', session.user.id);
    return NextResponse.json({ url }, { status: 201 });
  } catch (err) {
    console.error('story photo upload:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
