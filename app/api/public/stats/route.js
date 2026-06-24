import { NextResponse } from 'next/server';
import { getHomepageStatsBundle } from '@/lib/homepageStats';

export const revalidate = 300;

export async function GET() {
  try {
    const bundle = await getHomepageStatsBundle();
    return NextResponse.json({
      mode: bundle.mode,
      members: bundle.members,
      countries: bundle.countries,
      happyCouples: bundle.happyCouples,
      successRate: bundle.successRate,
      stats: bundle.stats,
    });
  } catch (err) {
    console.error('Public stats error:', err.message);
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 });
  }
}
