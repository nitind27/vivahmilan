import { NextResponse } from 'next/server';
import {
  getDonationPublicConfig,
  getDonationStats,
  listActiveCampaigns,
} from '@/lib/donation.js';

export async function GET() {
  const config = await getDonationPublicConfig();
  if (!config.enabled) {
    return NextResponse.json({ enabled: false });
  }
  const [stats, campaigns] = await Promise.all([getDonationStats(), listActiveCampaigns()]);
  return NextResponse.json({ ...config, stats, campaigns });
}
