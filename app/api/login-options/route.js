import { NextResponse } from 'next/server';
import { getSiteConfig } from '@/lib/siteconfig';

/** Public: which login methods are visible on /login */
export async function GET() {
  const [email, qr, google, family] = await Promise.all([
    getSiteConfig('login_email_enabled'),
    getSiteConfig('login_qr_enabled'),
    getSiteConfig('login_google_enabled'),
    getSiteConfig('login_family_enabled'),
  ]);

  return NextResponse.json({
    emailEnabled: email !== '0',
    qrEnabled: qr !== '0',
    googleEnabled: google !== '0',
    familyEnabled: family !== '0',
  });
}
