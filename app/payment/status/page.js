'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { CheckCircle, XCircle, Clock, Loader2, Heart } from 'lucide-react';
import { useSession } from 'next-auth/react';

function StatusInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { update } = useSession();

  const orderId = searchParams.get('order_id');
  const plan    = searchParams.get('plan');

  const [status, setStatus] = useState('verifying'); // verifying | success | failed | pending

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
          // Refresh session so isPremium updates
          await update({ isPremium: true });
          // Redirect to dashboard after 3s
          setTimeout(() => router.push('/dashboard'), 3000);
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
      icon: <Loader2 className="w-16 h-16 text-vd-primary animate-spin" />,
      title: 'Verifying Payment…',
      desc: 'Please wait while we confirm your payment.',
      color: 'text-vd-primary',
    },
    success: {
      icon: <CheckCircle className="w-16 h-16 text-green-500" />,
      title: '🎉 Payment Successful!',
      desc: `Your ${plan || 'Premium'} plan is now active. Redirecting to dashboard…`,
      color: 'text-green-500',
    },
    pending: {
      icon: <Clock className="w-16 h-16 text-yellow-500" />,
      title: 'Payment Pending',
      desc: 'Your payment is being processed. Premium will activate shortly.',
      color: 'text-yellow-500',
    },
    failed: {
      icon: <XCircle className="w-16 h-16 text-red-500" />,
      title: 'Payment Failed',
      desc: 'Something went wrong. Your account has not been charged.',
      color: 'text-red-500',
    },
  };

  const s = states[status];

  return (
    <div className="min-h-screen bg-vd-bg flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-vd-bg-section dark:bg-vd-bg-card rounded-3xl shadow-2xl p-10 max-w-md w-full text-center border border-vd-border">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 vd-gradient-gold rounded-full flex items-center justify-center">
            <Heart className="w-4 h-4 text-white fill-white" />
          </div>
          <span className="text-xl font-bold vd-gradient-text">Milan</span>
        </div>

        {/* Status icon */}
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}
          className="flex justify-center mb-5">
          {s.icon}
        </motion.div>

        <h2 className={`text-2xl font-bold mb-3 ${s.color}`}>{s.title}</h2>
        <p className="text-gray-500 text-sm mb-2">{s.desc}</p>

        {orderId && (
          <p className="text-xs text-gray-400 mt-2 font-mono bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded-lg">
            Order ID: {orderId}
          </p>
        )}

        {/* Success confetti dots */}
        {status === 'success' && (
          <div className="flex justify-center gap-2 mt-4">
            {['bg-vd-primary', 'bg-vd-primary', 'bg-yellow-400', 'bg-green-400', 'bg-blue-400'].map((c, i) => (
              <motion.div key={i} className={`w-2 h-2 rounded-full ${c}`}
                animate={{ y: [0, -12, 0] }}
                transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.1 }} />
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3 mt-8">
          {status === 'success' && (
            <Link href="/dashboard" className="vd-gradient-gold text-white py-3 rounded-2xl font-semibold hover:opacity-90 transition-opacity">
              Go to Dashboard
            </Link>
          )}
          {status === 'failed' && (
            <>
              <Link href="/premium" className="vd-gradient-gold text-white py-3 rounded-2xl font-semibold hover:opacity-90 transition-opacity">
                Try Again
              </Link>
              <Link href="/dashboard" className="border border-gray-200 dark:border-gray-600 py-3 rounded-2xl text-sm text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Back to Dashboard
              </Link>
            </>
          )}
          {status === 'pending' && (
            <Link href="/dashboard" className="vd-gradient-gold text-white py-3 rounded-2xl font-semibold hover:opacity-90 transition-opacity">
              Go to Dashboard
            </Link>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function PaymentStatusPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-vd-primary animate-spin" />
      </div>
    }>
      <StatusInner />
    </Suspense>
  );
}
