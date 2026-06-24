import { NextResponse } from 'next/server';
import { getHomepageStatsBundle } from '@/lib/homepageStats';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const bundle = await getHomepageStatsBundle();
    return NextResponse.json(
      {
        mode: bundle.mode,
        members: bundle.members,
        countries: bundle.countries,
        happyCouples: bundle.happyCouples,
        successRate: bundle.successRate,
        stats: bundle.stats,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (err) {
    console.error('Public stats error:', err.message);
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 });
  }
}
