'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import SiteLoader from '@/components/SiteLoader';
import { CheckCircle2, XCircle, Loader2, Heart } from 'lucide-react';

function formatINR(n) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

function StatusInner() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');
  const [state, setState] = useState({ loading: true, status: null, donation: null });

  useEffect(() => {
    if (!orderId) {
      setState({ loading: false, status: 'MISSING', donation: null });
      return;
    }
    fetch('/api/donation/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    })
      .then((r) => r.json())
      .then((d) => setState({ loading: false, status: d.status, donation: d.donation }))
      .catch(() => setState({ loading: false, status: 'ERROR', donation: null }));
  }, [orderId]);

  if (state.loading) return <SiteLoader message="Confirming payment…" />;

  const paid = state.status === 'PAID';

  return (
    <div className="min-h-screen bg-vd-bg">
      <Navbar />
      <div className="max-w-md mx-auto px-4 pt-28 text-center">
        {paid ? (
          <>
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-vd-text-heading">Thank you!</h1>
            <p className="text-vd-text-sub mt-2 text-sm">
              Your donation of {formatINR(state.donation?.amount)} was received. You can track how funds are used on the donate page.
            </p>
          </>
        ) : (
          <>
            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-vd-text-heading">Payment not completed</h1>
            <p className="text-vd-text-sub mt-2 text-sm">Status: {state.status || 'Unknown'}. No charge if payment was cancelled.</p>
          </>
        )}
        <Link
          href="/donate"
          className="inline-flex items-center gap-2 mt-8 px-6 py-3 vd-gradient-gold text-white rounded-2xl font-semibold"
        >
          <Heart className="w-4 h-4" /> Back to donate
        </Link>
      </div>
    </div>
  );
}

export default function DonateStatusPage() {
  return (
    <Suspense fallback={<SiteLoader message="Loading…" />}>
      <StatusInner />
    </Suspense>
  );
}
