import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { processSavedSearchAlerts } from '@/lib/savedSearchAlerts.js';

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const result = await processSavedSearchAlerts(session.user.id);
    return NextResponse.json(result);
  } catch (err) {
    console.error('check-alerts error:', err);
    return NextResponse.json({ error: 'Failed', sent: 0 }, { status: 500 });
  }
}
