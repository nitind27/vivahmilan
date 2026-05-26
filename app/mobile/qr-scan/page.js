'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, AlertCircle, CheckCircle, Loader2, QrCode, LogIn } from 'lucide-react';
import Link from 'next/link';
import SiteLoader from '@/components/SiteLoader';

function QRScanInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const sessionId = searchParams.get('session');

  const [step, setStep] = useState('loading'); // loading | confirm | confirming | success | error | invalid | login-required
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!sessionId) { setStep('invalid'); return; }
    if (status === 'loading') return;
    if (status === 'unauthenticated') { setStep('login-required'); return; }

    // Mark as scanned
    fetch('/api/auth/qr-confirm', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    }).catch(() => {});

    setStep('confirm');
  }, [sessionId, status]);

  const handleConfirm = async () => {
    setStep('confirming');
    try {
      const res = await fetch('/api/auth/qr-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to confirm login');
        setStep('error');
        return;
      }
      setStep('success');
    } catch {
      setErrorMsg('Network error. Please try again.');
      setStep('error');
    }
  };

  const handleCancel = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-vd-bg flex items-center justify-center px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm">
        <div className="bg-vd-bg-section border border-vd-border rounded-3xl shadow-2xl p-6 sm:p-8">

          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-vd-accent-soft flex items-center justify-center">
              <QrCode className="w-7 h-7 text-vd-primary" />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === 'loading' && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-center space-y-3">
                <Loader2 className="w-8 h-8 text-vd-primary animate-spin mx-auto" />
                <p className="text-sm text-vd-text-sub">Verifying QR session...</p>
              </motion.div>
            )}

            {step === 'confirm' && (
              <motion.div key="confirm" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="space-y-5">
                <div className="text-center">
                  <h2 className="text-xl font-bold text-vd-text-heading mb-1">Confirm Login</h2>
                  <p className="text-sm text-vd-text-sub">
                    You're about to sign in to <span className="font-semibold text-vd-text-heading">Vivah Dwar</span> on a new device
                  </p>
                </div>

                {/* User info */}
                {session?.user && (
                  <div className="bg-vd-bg-alt border border-vd-border rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-vd-accent-soft flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-vd-primary">
                        {session.user.name?.[0]?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-vd-text-heading truncate">{session.user.name}</p>
                      <p className="text-xs text-vd-text-light truncate">{session.user.email}</p>
                    </div>
                    <ShieldCheck className="w-5 h-5 text-green-500 flex-shrink-0 ml-auto" />
                  </div>
                )}

                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-3 flex gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    Only confirm if you initiated this login on a trusted device. Never share QR codes.
                  </p>
                </div>

                <div className="space-y-2.5">
                  <button onClick={handleConfirm}
                    className="w-full vd-gradient-gold text-white py-3 rounded-2xl font-semibold text-sm hover:opacity-90 transition-all"
                    style={{ boxShadow: '0 4px 20px rgba(200,164,92,0.35)' }}>
                    Yes, Log Me In
                  </button>
                  <button onClick={handleCancel}
                    className="w-full border border-vd-border py-3 rounded-2xl text-sm font-medium text-vd-text-sub hover:bg-vd-accent-soft transition-colors">
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'confirming' && (
              <motion.div key="confirming" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-center space-y-3 py-4">
                <Loader2 className="w-10 h-10 text-vd-primary animate-spin mx-auto" />
                <p className="text-sm font-medium text-vd-text-heading">Confirming login...</p>
                <p className="text-xs text-vd-text-light">The browser will sign in automatically</p>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }} className="text-center space-y-4 py-4">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-9 h-9 text-green-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-vd-text-heading">Login Confirmed!</h3>
                  <p className="text-sm text-vd-text-sub mt-1">The browser is now signing you in. You can close this page.</p>
                </div>
                <button onClick={() => router.push('/dashboard')}
                  className="w-full vd-gradient-gold text-white py-3 rounded-2xl font-semibold text-sm hover:opacity-90 transition-all">
                  Go to Dashboard
                </button>
              </motion.div>
            )}

            {step === 'error' && (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-center space-y-4 py-4">
                <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-9 h-9 text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-vd-text-heading">Login Failed</h3>
                  <p className="text-sm text-vd-text-sub mt-1">{errorMsg}</p>
                </div>
                <button onClick={() => router.push('/dashboard')}
                  className="w-full border border-vd-border py-3 rounded-2xl text-sm font-medium text-vd-text-sub hover:bg-vd-accent-soft transition-colors">
                  Back to App
                </button>
              </motion.div>
            )}

            {step === 'invalid' && (
              <motion.div key="invalid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-center space-y-4 py-4">
                <div className="w-16 h-16 rounded-full bg-vd-accent-soft flex items-center justify-center mx-auto">
                  <QrCode className="w-8 h-8 text-vd-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-vd-text-heading">Invalid QR Code</h3>
                  <p className="text-sm text-vd-text-sub mt-1">This QR code is invalid or has expired. Please scan a fresh code.</p>
                </div>
              </motion.div>
            )}

            {step === 'login-required' && (
              <motion.div key="login-required" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-center space-y-4 py-4">
                <div className="w-16 h-16 rounded-full bg-vd-accent-soft flex items-center justify-center mx-auto">
                  <LogIn className="w-8 h-8 text-vd-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-vd-text-heading">Sign In Required</h3>
                  <p className="text-sm text-vd-text-sub mt-1">
                    You need to be logged in on your phone to use QR login.
                  </p>
                </div>
                <Link href={`/login?redirect=/mobile/qr-scan?session=${sessionId}`}
                  className="w-full vd-gradient-gold text-white py-3 rounded-2xl font-semibold text-sm hover:opacity-90 transition-all flex items-center justify-center"
                  style={{ boxShadow: '0 4px 20px rgba(200,164,92,0.35)' }}>
                  Sign In First
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

export default function QRScanPage() {
  return (
    <Suspense fallback={<SiteLoader message="Loading…" size="lg" />}>
      <QRScanInner />
    </Suspense>
  );
}
