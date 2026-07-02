import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { deleteSeedProfilesBulk } from '@/lib/seedProfiles.js';

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { scope = 'filter', state = '', caste = '', confirm } = body;

  if (confirm !== 'DELETE SEED DATA') {
    return NextResponse.json(
      { error: 'Type DELETE SEED DATA to confirm bulk deletion' },
      { status: 400 }
    );
  }

  const result = await deleteSeedProfilesBulk({ scope, state, caste });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status || 400 });
  }

  return NextResponse.json({
    success: true,
    deleted: result.deleted,
    total: result.total,
    message: `${result.deleted} dummy profile(s) permanently deleted`,
  });
}
