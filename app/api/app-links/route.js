import { NextResponse } from 'next/server';
import { getSiteConfig } from '@/lib/siteconfig';

/** Public: mobile app store links for navbar / marketing */
export async function GET() {
  const [playStoreUrl, appStoreUrl, enabled] = await Promise.all([
    getSiteConfig('play_store_url'),
    getSiteConfig('app_store_url'),
    getSiteConfig('app_nav_enabled'),
  ]);

  return NextResponse.json({
    playStoreUrl: playStoreUrl?.trim() || '',
    appStoreUrl: appStoreUrl?.trim() || '',
    enabled: enabled !== '0',
  });
}
