'use client';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '@/components/ThemeProvider';
import LoginGeoTracker from '@/components/LoginGeoTracker';

export default function Providers({ children }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <LoginGeoTracker />
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}
