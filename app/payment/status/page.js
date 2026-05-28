'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  CheckCircle, XCircle, Clock, Loader2, Heart, Crown,
  Sparkles, Mail, ArrowRight, Shield,
} from 'lucide-react';
import { useSession } from 'next-auth/react';

function StatusInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { update } = useSession();

  const orderId = searchParams.get('order_id');
  const plan = searchParams.get('plan');

  const [status, setStatus] = useState('verifying');

  useEffect(() => {
    if (!orderId) { setStatus('failed'); return; }

    const verify = async () => {
      try {
        const res = await fetch('/api/payment/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId, plan }),
        });
        const data = await res.json();

        if (data.status === 'PAID') {
          setStatus('success');
          await update({ isPremium: true });
          setTimeout(() => router.push('/dashboard'), 4000);
        } else if (data.status === 'ACTIVE' || data.status === 'PENDING') {
          setStatus('pending');
        } else {
          setStatus('failed');
        }
      } catch {
        setStatus('failed');
      }
    };

    verify();
  }, [orderId, plan, router, update]);

  const states = {
    verifying: {
      icon: <Loader2 className="w-14 h-14 text-vd-primary animate-spin" />,
      title: 'Confirming Payment',
      desc: 'Please wait while we verify your transaction with Cashfree.',
      badge: 'Processing',
      badgeClass: 'bg-vd-primary/15 text-vd-primary-dark border-vd-primary/30',
    },
    success: {
      icon: <CheckCircle className="w-14 h-14 text-green-500" />,
      title: 'Payment Successful!',
      desc: `Your ${plan || 'Premium'} plan is now active. Welcome to Vivah Dwar Premium!`,
      badge: 'Paid',
      badgeClass: 'bg-green-500/15 text-green-600 border-green-500/30',
    },
    pending: {
      icon: <Clock className="w-14 h-14 text-amber-500" />,
      title: 'Payment Pending',
      desc: 'Your payment is being processed. Premium will activate once confirmed.',
      badge: 'Pending',
      badgeClass: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
    },
    failed: {
      icon: <XCircle className="w-14 h-14 text-red-500" />,
      title: 'Payment Failed',
      desc: 'Something went wrong or the payment was cancelled. No amount was charged.',
      badge: 'Failed',
      badgeClass: 'bg-red-500/15 text-red-600 border-red-500/30',
    },
  };

  const s = states[status];

  return (
    <div className="min-h-screen bg-vd-bg relative overflow-hidden flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-vd-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-vd-accent/15 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        {/* Card */}
        <div className="rounded-3xl border border-vd-border bg-vd-bg-section shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="vd-gradient-gold px-6 py-5 text-center text-white">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Heart className="w-5 h-5 fill-white" />
              <span className="font-bold text-lg tracking-wide">Vivah Dwar</span>
            </div>
            <p className="text-white/80 text-xs uppercase tracking-widest">Payment Status</p>
          </div>

          <div className="p-8 text-center">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border mb-6 ${s.badgeClass}`}>
              {s.badge}
            </span>

            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', delay: 0.15 }}
              className="flex justify-center mb-5"
            >
              <div className="w-20 h-20 rounded-full bg-vd-bg-alt flex items-center justify-center">
                {s.icon}
              </div>
            </motion.div>

            <h2 className="text-2xl font-bold text-vd-text-heading mb-2">{s.title}</h2>
            <p className="text-vd-text-sub text-sm leading-relaxed mb-6">{s.desc}</p>

            {orderId && (
              <div className="rounded-xl bg-vd-bg-alt border border-vd-border px-4 py-3 mb-6 text-left">
                <p className="text-[10px] font-bold uppercase tracking-widest text-vd-text-light mb-1">Transaction ID</p>
                <p className="text-xs font-mono text-vd-text-sub break-all">{orderId}</p>
                {plan && (
                  <p className="text-xs text-vd-text-sub mt-2 flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5 text-vd-primary" /> Plan: {plan}
                  </p>
                )}
              </div>
            )}

            {status === 'success' && (
              <div className="flex items-center justify-center gap-2 text-xs text-vd-text-sub mb-6 bg-vd-primary/5 border border-vd-primary/20 rounded-xl px-4 py-3">
                <Mail className="w-4 h-4 text-vd-primary flex-shrink-0" />
                Payment receipt sent to your registered email
              </div>
            )}

            {status === 'success' && (
              <div className="flex justify-center gap-1.5 mb-6">
                {[0, 1, 2, 3, 4].map(i => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full vd-gradient-gold"
                    animate={{ y: [0, -10, 0], opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1, delay: i * 0.12 }}
                  />
                ))}
              </div>
            )}

            <div className="flex flex-col gap-3">
              {status === 'success' && (
                <Link
                  href="/dashboard"
                  className="vd-gradient-gold text-white py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-95 transition-opacity shadow-md"
                >
                  Go to Dashboard <ArrowRight className="w-4 h-4" />
                </Link>
              )}
              {status === 'failed' && (
                <>
                  <Link href="/payment/checkout" className="vd-gradient-gold text-white py-3.5 rounded-2xl font-bold hover:opacity-95 transition-opacity shadow-md">
                    Try Again
                  </Link>
                  <Link href="/premium" className="py-3 rounded-2xl text-sm text-vd-text-sub border border-vd-border hover:bg-vd-bg-alt transition-colors">
                    View Plans
                  </Link>
                </>
              )}
              {status === 'pending' && (
                <Link href="/dashboard" className="vd-gradient-gold text-white py-3.5 rounded-2xl font-bold hover:opacity-95 transition-opacity">
                  Go to Dashboard
                </Link>
              )}
              {status === 'verifying' && (
                <p className="text-xs text-vd-text-light flex items-center justify-center gap-1">
                  <Shield className="w-3.5 h-3.5" /> Secured by Cashfree
                </p>
              )}
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-vd-text-light mt-4 flex items-center justify-center gap-1">
          <Sparkles className="w-3 h-3 text-vd-primary" />
          Thank you for choosing Vivah Dwar Matrimony
        </p>
      </motion.div>
    </div>
  );
}

export default function PaymentStatusPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-vd-bg">
        <Loader2 className="w-8 h-8 text-vd-primary animate-spin" />
      </div>
    }>
      <StatusInner />
    </Suspense>
  );
}
