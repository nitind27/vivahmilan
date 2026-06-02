'use client';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '@/components/ThemeProvider';
import LoginGeoTracker from '@/components/LoginGeoTracker';
import PortalAccessGuard from '@/components/PortalAccessGuard';
import EarlyBirdLoginPopup from '@/components/EarlyBirdLoginPopup';

export default function Providers({ children }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <LoginGeoTracker />
        <PortalAccessGuard />
        <EarlyBirdLoginPopup />
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}
