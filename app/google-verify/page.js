'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Mail, RefreshCw, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

function GoogleVerifyInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get('email') || '';
  const name  = searchParams.get('name')  || '';

  const [otp, setOtp]           = useState(['', '', '', '', '', '']);
  const [loading, setLoading]   = useState(false);
  const [sending, setSending]   = useState(false);
  const [verified, setVerified] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const sentRef = useRef(false);

  // Send OTP on mount (once)
  useEffect(() => {
    if (!email || sentRef.current) return;
    sentRef.current = true;
    sendOtp();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const sendOtp = async () => {
    setSending(true);
    try {
      const res  = await fetch('/api/auth/google-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed to send OTP'); return; }
      if (data.alreadyExists) {
        // User already registered — just redirect to login
        toast('Account already exists. Please sign in with Google.', { icon: 'ℹ️' });
        router.replace('/login');
        return;
      }
      toast.success('OTP sent to your email');
      setCountdown(60);
    } catch {
      toast.error('Failed to send OTP');
    } finally {
      setSending(false);
    }
  };

  const handleInput = (i, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    if (val && i < 5) document.getElementById(`gotp-${i + 1}`)?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      document.getElementById(`gotp-${i - 1}`)?.focus();
    }
  };

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (paste.length === 6) setOtp(paste.split(''));
  };

  const verify = async () => {
    const code = otp.join('');
    if (code.length !== 6) { toast.error('Enter the 6-digit OTP'); return; }
    setLoading(true);
    try {
      const res  = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: code, type: 'EMAIL_VERIFY' }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }

      setVerified(true);
      toast.success('Email verified!');

      // Account created — now redirect to onboarding to fill profile
      setTimeout(() => {
        router.replace(`/onboarding?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`);
      }, 1800);
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-vd-bg px-4">
        <p className="text-vd-text-sub text-sm">
          Invalid link.{' '}
          <Link href="/login" className="text-vd-primary font-semibold">Back to login</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-vd-bg px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md">

        <div className="text-center mb-8">
          <Link href="/">
            <img src="/logo/logo.png" alt="Vivah Dwar" className="h-16 w-auto object-contain mx-auto" />
          </Link>
        </div>

        <div className="bg-vd-bg-section rounded-3xl shadow-xl p-8 border border-vd-border">
          {verified ? (
            <motion.div initial={{ scale: 0.85 }} animate={{ scale: 1 }} className="text-center py-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-vd-text-heading mb-2">Email Verified!</h2>
              <p className="text-vd-text-sub text-sm">Taking you to complete your profile…</p>
            </motion.div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-vd-accent-soft rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-7 h-7 text-vd-primary" />
                </div>
                <h2 className="text-2xl font-bold text-vd-text-heading">Verify Your Email</h2>
                <p className="text-vd-text-sub text-sm mt-2">We sent a 6-digit OTP to</p>
                <p className="font-semibold text-vd-primary text-sm mt-0.5">{email}</p>
              </div>

              {sending && !otp.some(Boolean) ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-8 h-8 text-vd-primary animate-spin" />
                </div>
              ) : (
                <>
                  <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
                    {otp.map((digit, i) => (
                      <input key={i} id={`gotp-${i}`}
                        type="text" inputMode="numeric" maxLength={1} value={digit}
                        onChange={e => handleInput(i, e.target.value)}
                        onKeyDown={e => handleKeyDown(i, e)}
                        className={`w-12 h-14 text-center text-xl font-bold border-2 rounded-2xl bg-vd-bg focus:outline-none transition-all ${
                          digit
                            ? 'border-vd-primary bg-vd-accent-soft'
                            : 'border-vd-border focus:border-vd-primary'
                        }`}
                      />
                    ))}
                  </div>

                  <button onClick={verify}
                    disabled={loading || otp.join('').length !== 6}
                    className="w-full vd-gradient-gold text-white py-3 rounded-2xl font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity mb-4">
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Verifying…
                      </span>
                    ) : 'Verify OTP'}
                  </button>

                  <div className="text-center">
                    {countdown > 0 ? (
                      <p className="text-sm text-vd-text-light">
                        Resend OTP in <span className="text-vd-primary font-medium">{countdown}s</span>
                      </p>
                    ) : (
                      <button onClick={sendOtp} disabled={sending}
                        className="text-sm text-vd-primary hover:opacity-80 flex items-center gap-1.5 mx-auto transition-opacity">
                        <RefreshCw className={`w-4 h-4 ${sending ? 'animate-spin' : ''}`} />
                        {sending ? 'Sending…' : 'Resend OTP'}
                      </button>
                    )}
                  </div>
                </>
              )}
            </>
          )}

          <Link href="/login"
            className="flex items-center justify-center gap-2 text-sm text-vd-text-light hover:text-vd-text-sub mt-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function GoogleVerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-vd-bg">
        <div className="w-10 h-10 border-2 border-vd-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <GoogleVerifyInner />
    </Suspense>
  );
}
