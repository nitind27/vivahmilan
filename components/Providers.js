'use client';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '@/components/ThemeProvider';
import LoginGeoTracker from '@/components/LoginGeoTracker';
import PortalAccessGuard from '@/components/PortalAccessGuard';

export default function Providers({ children }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <LoginGeoTracker />
        <PortalAccessGuard />
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}
