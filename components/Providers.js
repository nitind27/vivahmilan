'use client';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '@/components/ThemeProvider';
import LoginGeoTracker from '@/components/LoginGeoTracker';
import PortalAccessGuard from '@/components/PortalAccessGuard';
import EarlyBirdLoginPopup from '@/components/EarlyBirdLoginPopup';
import EarlyBirdGuestPopup from '@/components/EarlyBirdGuestPopup';

export default function Providers({ children }) {
  return (
    <SessionProvider refetchOnWindowFocus>
      <ThemeProvider>
        <LoginGeoTracker />
        <PortalAccessGuard />
        <EarlyBirdGuestPopup />
        <EarlyBirdLoginPopup />
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}
