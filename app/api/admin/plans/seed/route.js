import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { seedDefaultPlans, ensureEarlyBirdConfig } from '@/lib/seedPlans';

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const plans = await seedDefaultPlans();
    const earlyBird = await ensureEarlyBirdConfig();
    return NextResponse.json({
      success: true,
      message: `Restored ${plans.length} plans (FREE, SILVER, GOLD, PLATINUM, EARLY_BIRD)`,
      plans,
      earlyBird,
    });
  } catch (err) {
    console.error('[plans/seed]', err);
    return NextResponse.json({ error: err.message || 'Seed failed' }, { status: 500 });
  }
}
