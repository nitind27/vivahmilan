import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getUserAccessSummary } from '@/lib/planPermissions.js';
import { INTEREST_TEMPLATES } from '@/lib/interestTemplates.js';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const access = await getUserAccessSummary(session.user.id);
  return NextResponse.json({ access, interestTemplates: INTEREST_TEMPLATES });
}
