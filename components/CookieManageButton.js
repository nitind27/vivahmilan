'use client';

import { openCookieSettings } from '@/lib/cookieConsent';

export default function CookieManageButton({ className = '' }) {
  return (
    <button
      type="button"
      onClick={openCookieSettings}
      className={`text-sm text-vd-text-sub hover:text-vd-primary-dark transition-colors text-left ${className}`}
    >
      Manage cookies
    </button>
  );
}
