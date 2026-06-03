import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { execute } from '@/lib/db';
import { ensureFeatureTables } from '@/lib/ensureFeatureTables.js';

export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  await ensureFeatureTables();
  await execute('DELETE FROM donation_expenditure WHERE id = ?', [id]);
  return NextResponse.json({ success: true });
}
