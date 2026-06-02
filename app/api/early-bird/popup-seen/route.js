import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { markEarlyBirdPopupSeen } from '@/lib/earlyBird';

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await markEarlyBirdPopupSeen(session.user.id);
  return NextResponse.json({ success: true, showPopup: false });
}
