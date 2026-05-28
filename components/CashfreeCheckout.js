'use client';

import { useEffect, useState, useCallback } from 'react';

export function useCashfreeSdk() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.Cashfree) { setReady(true); return; }
    if (document.getElementById('cashfree-sdk')) {
      const t = setInterval(() => {
        if (window.Cashfree) { setReady(true); clearInterval(t); }
      }, 200);
      return () => clearInterval(t);
    }
    const script = document.createElement('script');
    script.id = 'cashfree-sdk';
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.onload = () => setReady(true);
    script.onerror = () => setReady(false);
    document.head.appendChild(script);
  }, []);

  const openCheckout = useCallback(async (paymentSessionId, redirectTarget = '_modal') => {
    if (!window.Cashfree) throw new Error('Payment SDK not loaded');
    const cashfree = await window.Cashfree({
      mode: process.env.NEXT_PUBLIC_CASHFREE_ENV === 'production' ? 'production' : 'sandbox',
    });
    await cashfree.checkout({ paymentSessionId, redirectTarget });
  }, []);

  return { ready, openCheckout };
}
