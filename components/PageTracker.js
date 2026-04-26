'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

// Generate or retrieve a session ID for this browser session
function getSessionId() {
  if (typeof window === 'undefined') return null;
  let sid = sessionStorage.getItem('_vsid');
  if (!sid) {
    sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem('_vsid', sid);
  }
  return sid;
}

export default function PageTracker() {
  const pathname = usePathname();
  const { data: session } = useSession();

  useEffect(() => {
    // Don't track admin pages
    if (pathname?.startsWith('/admin')) return;

    const sessionId = getSessionId();
    const referrer = document.referrer || null;

    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        page: pathname,
        referrer,
        sessionId,
        userId: session?.user?.id || null,
      }),
      // Fire and forget — don't block anything
      keepalive: true,
    }).catch(() => {});
  }, [pathname, session?.user?.id]);

  return null;
}
