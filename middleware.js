import { NextResponse } from 'next/server';

const BYPASS_PATHS = [
  '/maintenance',
  '/api/maintenance-status',
  '/api/auth',
  '/_next',
  '/favicon.ico',
  '/logo',
  '/images',
  '/uploads',
  '/audio',
  '/video',
];

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Skip bypass paths
  const isBypassed = BYPASS_PATHS.some((p) => pathname.startsWith(p));
  if (isBypassed) return NextResponse.next();

  // Admin always bypasses maintenance
  const isAdminPath = pathname.startsWith('/admin');

  try {
    const url = new URL('/api/maintenance-status', request.url);
    const res = await fetch(url.toString(), { cache: 'no-store' });
    const data = await res.json();

    if (data.maintenance && !isAdminPath) {
      const maintenanceUrl = new URL('/maintenance', request.url);
      return NextResponse.rewrite(maintenanceUrl);
    }
  } catch {
    // DB unreachable — don't block
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
