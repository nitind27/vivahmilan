import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getSeedProfileSummary, listSeedProfiles } from '@/lib/seedProfiles.js';

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const includeSummary = searchParams.get('summary') === '1';

  const result = await listSeedProfiles({
    state: searchParams.get('state') || '',
    caste: searchParams.get('caste') || '',
    gender: searchParams.get('gender') || '',
    search: searchParams.get('search') || '',
    page: searchParams.get('page') || '1',
    limit: searchParams.get('limit') || '10',
  });

  if (includeSummary) {
    const summary = await getSeedProfileSummary();
    return NextResponse.json({ ...result, summary });
  }

  return NextResponse.json(result);
}
