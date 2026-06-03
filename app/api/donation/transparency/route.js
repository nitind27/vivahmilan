import { NextResponse } from 'next/server';
import { isDonationEnabled, getDonationStats, listExpenditures } from '@/lib/donation.js';

export async function GET() {
  if (!(await isDonationEnabled())) {
    return NextResponse.json({ error: 'Donations are currently disabled' }, { status: 403 });
  }
  const [stats, expenditures] = await Promise.all([getDonationStats(), listExpenditures({ limit: 100 })]);
  return NextResponse.json({ stats, expenditures });
}
