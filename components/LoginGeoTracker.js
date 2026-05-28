'use client';
import { useSession } from 'next-auth/react';
import { useEffect, useRef } from 'react';
import { logWebLoginIfNeeded } from '@/lib/clientGeo';

/** Captures GPS + IP after Google OAuth or when user lands on app without login page geo call. */
export default function LoginGeoTracker() {
  const { status } = useSession();
  const started = useRef(false);

  useEffect(() => {
    if (status !== 'authenticated' || started.current) return;
    started.current = true;
    logWebLoginIfNeeded();
  }, [status]);

  return null;
}
