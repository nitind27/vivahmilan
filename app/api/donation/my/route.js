import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import {
  isDonationEnabled,
  getDonationStats,
  listDonationsForUser,
  listExpenditures,
} from '@/lib/donation.js';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await isDonationEnabled())) {
    return NextResponse.json({ error: 'Donations disabled' }, { status: 403 });
  }

  const [donations, stats, expenditures] = await Promise.all([
    listDonationsForUser(session.user.id, session.user.email),
    getDonationStats(),
    listExpenditures({ limit: 50 }),
  ]);

  const myTotal = donations.reduce((s, d) => s + Number(d.amount || 0), 0);

  return NextResponse.json({
    donations,
    myTotal,
    stats,
    expenditures,
  });
}
