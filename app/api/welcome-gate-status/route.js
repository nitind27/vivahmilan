import { NextResponse } from 'next/server';
import { getSiteConfig } from '@/lib/siteconfig';

/** Public: whether visitors must pass welcome.html login first */
export async function GET() {
  const enabled = (await getSiteConfig('welcome_gate_enabled')) === '1';
  return NextResponse.json({ enabled });
}
