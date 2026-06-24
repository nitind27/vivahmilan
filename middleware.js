import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

/** Edge-safe: live portal check via API (no Node db/crypto imports). */
async function isPortalBlockedForToken(token, req) {
  if (!token) return false;
  if (token.role !== 'USER' && token.role !== 'FAMILY') return false;
  try {
    const url = new URL('/api/portal-access', req.url);
    const res = await fetch(url, {
      headers: { cookie: req.headers.get('cookie') || '' },
    });
    if (res.ok) {
      const data = await res.json();
      return !data.granted;
    }
  } catch { /* ignore */ }
  return token.portalAccessGranted === false;
}

const PUBLIC_PREFIXES = [
  '/login', '/register', '/forgot-password', '/verify-email', '/google-verify',
  '/onboarding', '/register/complete', '/api/auth', '/api/register', '/api/public',
  '/api/stories', '/api/kyc', '/kyc', '/maintenance', '/terms', '/privacy',
  '/api/plans', '/profile-launch', '/api/portal-access', '/api/early-bird',
  '/refund', '/cookies', '/safety', '/help', '/contact', '/report-abuse',
  '/stories', '/share-story', '/blog', '/api/blog', '/payment/status', '/api/chatbot',
];

const USER_PREFIXES = [
  '/dashboard', '/search', '/matches', '/chat', '/interests', '/shortlist',
  '/compare', '/views', '/settings', '/refer', '/premium', '/notifications',
  '/profile/edit', '/blocked', '/share-story',
];

function isPublic(pathname) {
  if (pathname === '/' || pathname.startsWith('/_next') || pathname.startsWith('/uploads')) return true;
  if (pathname.match(/\.(ico|png|jpg|jpeg|svg|webp|js|css|woff2?|json|txt|html|xml|mp4|webm)$/)) return true;
  return PUBLIC_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'));
}

function needsAuth(pathname) {
  if (pathname.startsWith('/profile/') && !pathname.startsWith('/profile/edit')) return true;
  return USER_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'));
}

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // Google Search Console HTML verification (root + mistaken sitemap.xml/ path)
  if (
    pathname === '/google195f37c4f1dfaf5a.html' ||
    pathname === '/sitemap.xml/google195f37c4f1dfaf5a.html'
  ) {
    return NextResponse.next();
  }

  if (isPublic(pathname)) return NextResponse.next();

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (pathname.startsWith('/admin')) {
    if (!token) {
      const url = new URL('/login', req.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }
    if (token.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    return NextResponse.next();
  }

  if (needsAuth(pathname)) {
    if (!token) {
      const url = new URL('/login', req.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }
    if (token.role === 'FAMILY' && (pathname.startsWith('/profile/edit') || pathname.startsWith('/premium') || pathname.startsWith('/settings') || pathname.startsWith('/refer') || pathname.startsWith('/share-story'))) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    if (token.profileCorrectionRequired) {
      if (!pathname.startsWith('/onboarding') && !pathname.startsWith('/api/onboarding')) {
        const email = encodeURIComponent(token.email || '');
        return NextResponse.redirect(new URL(`/onboarding?email=${email}&correction=1`, req.url));
      }
    } else if (await isPortalBlockedForToken(token, req)) {
      return NextResponse.redirect(new URL('/profile-launch', req.url));
    }
  }

  if (
    pathname.startsWith('/profile-launch') &&
    token &&
    (token.role === 'USER' || token.role === 'FAMILY')
  ) {
    if (token.profileCorrectionRequired) {
      const email = encodeURIComponent(token.email || '');
      return NextResponse.redirect(new URL(`/onboarding?email=${email}&correction=1`, req.url));
    }
    if (!(await isPortalBlockedForToken(token, req))) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  // After Google OAuth: logged-in verified user should not stay stuck on /login
  if (
    pathname.startsWith('/login') &&
    token &&
    (token.role === 'USER' || token.role === 'FAMILY') &&
    token.adminVerified === true &&
    (await isPortalBlockedForToken(token, req))
  ) {
    return NextResponse.redirect(new URL('/profile-launch', req.url));
  }

  if (pathname.startsWith('/api/admin')) {
    if (!token || token.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  const PORTAL_API_BYPASS = [
    '/api/auth', '/api/register', '/api/onboarding', '/api/portal-access',
    '/api/public', '/api/admin', '/api/flutter', '/api/plans', '/api/stories',
    '/api/kyc', '/api/maintenance-status', '/api/welcome-gate-status', '/api/login-options', '/api/app-links', '/api/social-links',
    '/api/chatbot', '/api/track', '/api/location', '/api/profile-options',
    '/api/coupons/validate', '/api/marketing-popup', '/api/payment/status',
    '/api/socket',
  ];
  if (
    pathname.startsWith('/api/') &&
    !PORTAL_API_BYPASS.some(p => pathname === p || pathname.startsWith(p + '/'))
  ) {
    if (token && (await isPortalBlockedForToken(token, req))) {
      return NextResponse.json({
        error: 'Your profile will be available soon. Please wait for our update.',
        code: 'PORTAL_CLOSED',
        portalAccess: false,
      }, { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sw.js|logo).*)',
  ],
};
