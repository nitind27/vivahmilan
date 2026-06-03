'use client';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';

const SKIP_PREFIXES = [
  '/profile-launch',
  '/login',
  '/register',
  '/onboarding',
  '/admin',
  '/verify-email',
  '/forgot-password',
  '/google-verify',
  '/maintenance',
  '/welcome',
  '/kyc',
  '/terms',
  '/privacy',
  '/contact',
  '/help',
];

export default function PortalAccessGuard() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user) return;
    if (session.user.role === 'ADMIN') return;
    if (SKIP_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'))) return;

    let cancelled = false;

    const check = () => {
      fetch('/api/portal-access')
        .then(r => r.json())
        .then(data => {
          if (cancelled) return;
          if (data.granted) {
            if (pathname.startsWith('/profile-launch')) {
              router.replace('/dashboard');
            }
            return;
          }
          if (!pathname.startsWith('/profile-launch')) {
            router.replace('/profile-launch');
          }
        })
        .catch(() => {});
    };

    check();
    const id = setInterval(check, 45000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [status, session, pathname, router]);

  return null;
}
