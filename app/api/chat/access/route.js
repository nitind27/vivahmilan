import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { queryOne } from '@/lib/db';
import { resolveChatAccess } from '@/lib/chatAccess';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const dbUser = await queryOne(
    'SELECT isPremium, premiumPlan, premiumExpiry, freeTrialExpiry FROM `user` WHERE id = ?',
    [session.user.id]
  );

  return NextResponse.json(resolveChatAccess(dbUser));
}
