import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { saveFile, deleteFile } from '@/lib/upload';

export const maxDuration = 120;

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role === 'FAMILY') {
    return NextResponse.json({ error: 'Family login cannot upload videos' }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get('video');
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });
  if (file.size > 50 * 1024 * 1024) return NextResponse.json({ error: 'Max size 50MB' }, { status: 400 });
  if (!file.type.startsWith('video/')) return NextResponse.json({ error: 'Only video files allowed' }, { status: 400 });

  try {
    const { url } = await saveFile(file, 'videos', session.user.id);
    const { queryOne, execute } = await import('@/lib/db');

    const existing = await queryOne('SELECT introVideoUrl FROM profile WHERE userId = ?', [session.user.id]);
    if (existing?.introVideoUrl) await deleteFile(existing.introVideoUrl).catch(() => {});

    await execute('UPDATE profile SET introVideoUrl = ?, updatedAt = NOW() WHERE userId = ?', [url, session.user.id]);
    return NextResponse.json({ url }, { status: 201 });
  } catch (err) {
    console.error('intro video upload:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { queryOne, execute } = await import('@/lib/db');
  const existing = await queryOne('SELECT introVideoUrl FROM profile WHERE userId = ?', [session.user.id]);
  if (existing?.introVideoUrl) await deleteFile(existing.introVideoUrl).catch(() => {});
  await execute('UPDATE profile SET introVideoUrl = NULL, updatedAt = NOW() WHERE userId = ?', [session.user.id]);
  return NextResponse.json({ success: true });
}
