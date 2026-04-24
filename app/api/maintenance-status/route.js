import { NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const row = await queryOne(
      "SELECT value FROM siteconfig WHERE `key` = 'maintenance_mode' LIMIT 1"
    );
    // value '1' = site is LIVE, value '0' = maintenance mode ON
    const isOn = row?.value !== '1';
    return NextResponse.json({ maintenance: isOn }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    // If DB error, don't block the site
    return NextResponse.json({ maintenance: false });
  }
}
