'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Heart, Mail, RefreshCw, CheckCircle, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

function VerifyInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get('email') || '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  const handleInput = (i, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    if (val && i < 5) document.getElementById(`otp-${i + 1}`)?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      document.getElementById(`otp-${i - 1}`)?.focus();
    }
  };

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (paste.length === 6) setOtp(paste.split(''));
  };

  const verify = async () => {
    const code = otp.join('');
    if (code.length !== 6) { toast.error('Enter 6-digit OTP'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: code, type: 'EMAIL_VERIFY' }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      setVerified(true);
      toast.success('Email verified!');
      setTimeout(() => router.push(`/onboarding?email=${encodeURIComponent(email)}`), 2000);
    } finally { setLoading(false); }
  };

  const resend = async () => {
    setResending(true);
    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type: 'EMAIL_VERIFY' }),
      });
      const data = await res.json();
      if (res.ok) { toast.success('OTP resent!'); setCountdown(60); }
      else toast.error(data.error);
    } finally { setResending(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 gradient-bg rounded-full flex items-center justify-center">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="text-2xl font-bold gradient-text">Milan</span>
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
          {verified ? (
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-center py-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Email Verified!</h2>
              <p className="text-gray-500 text-sm">Your account is pending admin approval. You'll receive an email once approved.</p>            </motion.div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-pink-50 dark:bg-pink-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-7 h-7 text-pink-500" />
                </div>
                <h2 className="text-2xl font-bold">Verify Your Email</h2>
                <p className="text-gray-500 text-sm mt-2">We sent a 6-digit OTP to</p>
                <p className="font-semibold text-pink-500 text-sm">{email}</p>
              </div>

              {/* OTP inputs */}
              <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
                {otp.map((digit, i) => (
                  <input key={i} id={`otp-${i}`} type="text" inputMode="numeric" maxLength={1} value={digit}
                    onChange={e => handleInput(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    className={`w-12 h-14 text-center text-xl font-bold border-2 rounded-2xl bg-gray-50 dark:bg-gray-700 focus:outline-none transition-all ${digit ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20' : 'border-gray-200 dark:border-gray-600 focus:border-pink-400'}`}
                  />
                ))}
              </div>

              <button onClick={verify} disabled={loading || otp.join('').length !== 6}
                className="w-full gradient-bg text-white py-3 rounded-2xl font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity mb-4">
                {loading ? 'Verifying…' : 'Verify OTP'}
              </button>

              <div className="text-center">
                {countdown > 0 ? (
                  <p className="text-sm text-gray-400">Resend OTP in <span className="text-pink-500 font-medium">{countdown}s</span></p>
                ) : (
                  <button onClick={resend} disabled={resending} className="text-sm text-pink-500 hover:text-pink-600 flex items-center gap-1.5 mx-auto">
                    <RefreshCw className={`w-4 h-4 ${resending ? 'animate-spin' : ''}`} />
                    {resending ? 'Sending…' : 'Resend OTP'}
                  </button>
                )}
              </div>
            </>
          )}

          <Link href="/login" className="flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-gray-600 mt-5 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <VerifyInner />
    </Suspense>
  );
}
