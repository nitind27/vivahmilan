import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { listDeletedUserArchive } from '@/lib/deletedUserArchive.js';

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const limit = searchParams.get('limit') || '50';
  const offset = searchParams.get('offset') || '0';

  const data = await listDeletedUserArchive({ search, limit, offset });
  return NextResponse.json(data);
}
