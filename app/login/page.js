'use client';
import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { signIn, getSession, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Lock, Eye, EyeOff, Clock, CheckCircle, Sparkles,
  QrCode, RefreshCw, Smartphone, ArrowLeft, ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { logWebLogin } from '@/lib/clientGeo';
import SiteLoader from '@/components/SiteLoader';
import { getRememberedEmail, getRememberPreference, saveRememberLogin } from '@/lib/rememberLogin';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const QR_POLL_INTERVAL = 2000;
const QR_TTL = 5 * 60 * 1000;

function QRLoginPanel({ onBack }) {
  const router = useRouter();
  const [sessionId, setSessionId] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [qrStatus, setQrStatus] = useState('loading');
  const [timeLeft, setTimeLeft] = useState(QR_TTL);
  const pollRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  const generateQR = useCallback(async () => {
    setQrStatus('loading');
    setQrDataUrl(null);
    setTimeLeft(QR_TTL);
    startTimeRef.current = Date.now();
    try {
      const res = await fetch('/api/auth/qr-session', { method: 'POST' });
      const data = await res.json();
      if (!data.sessionId) throw new Error('No session ID');
      setSessionId(data.sessionId);
      const qrUrl = `${window.location.origin}/mobile/qr-scan?session=${data.sessionId}`;
      const qrRes = await fetch(`/api/auth/qr-image?data=${encodeURIComponent(qrUrl)}`);
      const qrData = await qrRes.json();
      setQrDataUrl(qrData.dataUrl);
      setQrStatus('pending');
    } catch {
      setQrStatus('error');
    }
  }, []);

  useEffect(() => {
    if (!sessionId || qrStatus === 'confirmed' || qrStatus === 'expired' || qrStatus === 'error') return;
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/auth/qr-session?id=${sessionId}`);
        const data = await res.json();
        if (data.status === 'scanned') {
          setQrStatus('scanned');
        } else if (data.status === 'confirmed' && data.token) {
          setQrStatus('confirmed');
          clearInterval(pollRef.current);
          clearInterval(timerRef.current);
          const result = await signIn('qr-login', { qrToken: data.token, redirect: false });
          if (result?.ok) {
            toast.success('Logged in via QR code!');
            logWebLogin();
            const s = await getSession();
            router.push(s?.user?.role === 'ADMIN' ? '/admin' : s?.user?.portalAccessGranted === false ? '/profile-launch' : '/dashboard');
          } else {
            toast.error('QR login failed. Please try again.');
            setQrStatus('error');
          }
        } else if (data.status === 'expired') {
          setQrStatus('expired');
          clearInterval(pollRef.current);
          clearInterval(timerRef.current);
        }
      } catch { /* silent */ }
    }, QR_POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [sessionId, qrStatus, router]);

  useEffect(() => {
    if (qrStatus !== 'pending' && qrStatus !== 'scanned') return;
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, QR_TTL - elapsed);
      setTimeLeft(remaining);
      if (remaining === 0) {
        setQrStatus('expired');
        clearInterval(timerRef.current);
        clearInterval(pollRef.current);
      }
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [qrStatus]);

  useEffect(() => {
    generateQR();
    return () => { clearInterval(pollRef.current); clearInterval(timerRef.current); };
  }, [generateQR]);

  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);
  const progress = timeLeft / QR_TTL;
  const circumference = 2 * Math.PI * 106;

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }} className="w-full">
      <button onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-vd-text-light hover:text-vd-primary transition-colors mb-5">
        <ArrowLeft className="w-4 h-4" /> Back to login
      </button>
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1.5">
          <QrCode className="w-4 h-4 text-vd-primary" />
          <span className="text-xs font-medium text-vd-primary uppercase tracking-wider">QR Login</span>
        </div>
        <h2 className="text-2xl font-bold text-vd-text-heading">Scan to sign in</h2>
        <p className="text-vd-text-sub text-sm mt-1">Open the app on your phone and scan this code</p>
      </div>

      <div className="bg-vd-bg-section border border-vd-border rounded-3xl p-6 flex flex-col items-center gap-4">
        <div className="relative w-[220px] h-[220px]">
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 220 220">
            <circle cx="110" cy="110" r="106" fill="none" stroke="var(--color-vd-border,#e5e7eb)" strokeWidth="3" />
            <circle cx="110" cy="110" r="106" fill="none" stroke="url(#qrGrad)" strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              style={{ transition: 'stroke-dashoffset 1s linear' }} />
            <defs>
              <linearGradient id="qrGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#c8a45c" />
                <stop offset="100%" stopColor="#e8c97a" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <AnimatePresence mode="wait">
              {qrStatus === 'loading' && (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-2 border-vd-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-vd-text-light">Generating...</span>
                </motion.div>
              )}
              {(qrStatus === 'pending' || qrStatus === 'scanned') && qrDataUrl && (
                <motion.div key="qr" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="relative">
                  <img src={qrDataUrl} alt="QR Code"
                    className="w-[180px] h-[180px] rounded-2xl"
                    style={{ imageRendering: 'pixelated' }} />
                  {qrStatus === 'scanned' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="absolute inset-0 bg-vd-bg-section/90 rounded-2xl flex flex-col items-center justify-center gap-2">
                      <div className="w-8 h-8 border-2 border-vd-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-semibold text-vd-primary">Confirming...</span>
                    </motion.div>
                  )}
                </motion.div>
              )}
              {qrStatus === 'confirmed' && (
                <motion.div key="confirmed" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <CheckCircle className="w-9 h-9 text-green-500" />
                  </div>
                  <span className="text-sm font-semibold text-green-600">Logging in...</span>
                </motion.div>
              )}
              {(qrStatus === 'expired' || qrStatus === 'error') && (
                <motion.div key="expired" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-3 text-center px-4">
                  <div className="w-14 h-14 rounded-full bg-vd-accent-soft flex items-center justify-center">
                    <QrCode className="w-7 h-7 text-vd-primary" />
                  </div>
                  <p className="text-sm text-vd-text-sub">
                    {qrStatus === 'expired' ? 'QR code expired' : 'Something went wrong'}
                  </p>
                  <button onClick={generateQR}
                    className="flex items-center gap-1.5 text-sm font-semibold text-vd-primary hover:opacity-80 transition-opacity">
                    <RefreshCw className="w-4 h-4" /> Refresh code
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {(qrStatus === 'pending' || qrStatus === 'scanned') && (
          <div className="flex items-center gap-1.5 text-xs text-vd-text-light">
            <Clock className="w-3.5 h-3.5" />
            <span>Expires in <span className="font-semibold text-vd-text-sub tabular-nums">
              {minutes}:{String(seconds).padStart(2, '0')}
            </span></span>
          </div>
        )}

        <AnimatePresence>
          {qrStatus === 'scanned' && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2 bg-vd-accent-soft border border-vd-primary/20 rounded-full px-4 py-1.5">
              <ShieldCheck className="w-4 h-4 text-vd-primary" />
              <span className="text-xs font-semibold text-vd-primary">Scanned — confirm on your phone</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-5 space-y-3">
        {[
          { icon: Smartphone, text: 'Open Vivah Dwar app on your phone' },
          { icon: QrCode, text: 'Tap "Scan QR" in the app menu' },
          { icon: ShieldCheck, text: 'Point camera at the code above' },
        ].map(({ icon: Icon, text }, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-vd-accent-soft flex items-center justify-center flex-shrink-0">
              <Icon className="w-3.5 h-3.5 text-vd-primary" />
            </div>
            <span className="text-xs text-vd-text-sub">{text}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}


function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState(null);
  const [showQR, setShowQR] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginMode, setLoginMode] = useState('member');

  useEffect(() => {
    setRememberMe(getRememberPreference());
    const savedEmail = getRememberedEmail();
    if (savedEmail) setForm(prev => ({ ...prev, email: savedEmail }));
  }, []);

  useEffect(() => {
    const error = searchParams?.get('error');
    if (error === 'PENDING_APPROVAL') setPendingEmail('your account');
    else if (error === 'AccountSuspended') toast.error('Your account has been suspended.');
    else if (error === 'ServerError') toast.error('Something went wrong. Please try again.');
    else if (error === 'AccessDenied') toast.error('Access denied. Please try again or contact support.');
    else if (error === 'OAuthCallback' || error === 'Callback' || error === 'OAuthSignin') {
      toast.error('Google sign-in failed. Use the same browser, allow cookies, and open vivahdwar.com (not www).');
    }
  }, [searchParams]);

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user) return;
    if (session.user.isNewUser) {
      const email = encodeURIComponent(session.user.email || '');
      const name = encodeURIComponent(session.user.name || '');
      router.replace(`/onboarding?email=${email}&name=${name}`);
      return;
    }
    const defaultPath =
      session.user.role === 'ADMIN'
        ? '/admin'
        : session.user.portalAccessGranted === false
          ? '/profile-launch'
          : '/dashboard';
    const callbackUrl = searchParams?.get('callbackUrl');
    if (callbackUrl && callbackUrl.startsWith('/') && session.user.portalAccessGranted !== false) {
      router.replace(callbackUrl);
    } else {
      router.replace(defaultPath);
    }
  }, [status, session, router, searchParams]);

  const validate = (f) => {
    const e = {};
    if (!f.email) e.email = 'Email is required';
    else if (!emailRegex.test(f.email)) e.email = 'Enter a valid email address';
    if (!f.password) e.password = 'Password is required';
    else if (f.password.length < 6) e.password = 'Password must be at least 6 characters';
    return e;
  };

  const handleBlur = (field) => {
    setTouched(p => ({ ...p, [field]: true }));
    setErrors(validate({ ...form }));
  };

  const handleChange = (field, value) => {
    const updated = { ...form, [field]: value };
    setForm(updated);
    if (touched[field]) setErrors(validate(updated));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    const provider = loginMode === 'family' ? 'family-login' : 'credentials';
    const res = await signIn(provider, {
      email: form.email.trim(),
      password: form.password,
      remember: rememberMe ? 'true' : 'false',
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      if (res.error === 'PENDING_APPROVAL') { setPendingEmail(form.email); return; }
      if (res.error.startsWith('PROFILE_INCOMPLETE:')) {
        const email = res.error.split(':')[1] || form.email;
        toast('Please complete your profile first.', { icon: '📝' });
        router.push(`/onboarding?email=${encodeURIComponent(email)}`);
        return;
      }
      toast.error(res.error === 'CredentialsSignin' ? 'Invalid email or password' : res.error);
    } else {
      saveRememberLogin(form.email, rememberMe);
      toast.success(rememberMe ? 'Welcome back! You will stay signed in for 30 days.' : loginMode === 'family' ? 'Family login successful' : 'Welcome back!');
      logWebLogin();
      const s = await getSession();
      const callbackUrl = searchParams?.get('callbackUrl');
      const defaultPath = s?.user?.role === 'ADMIN'
        ? '/admin'
        : s?.user?.portalAccessGranted === false
          ? '/profile-launch'
          : '/dashboard';
      if (callbackUrl && callbackUrl.startsWith('/') && s?.user?.portalAccessGranted !== false) {
        router.push(callbackUrl);
      } else {
        router.push(defaultPath);
      }
    }
  };

  const fieldCls = (field) =>
    `w-full pl-11 pr-4 py-3 border rounded-2xl bg-vd-bg-section text-sm text-vd-text-heading placeholder:text-vd-text-light input-focus transition-all ${
      touched[field] && errors[field] ? 'border-red-400 focus:ring-red-200' : 'border-vd-border'
    }`;

  if (pendingEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-vd-bg px-4 py-8">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
          <div className="bg-vd-bg-section rounded-3xl shadow-2xl p-6 sm:p-8 border border-vd-border text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-vd-accent-soft rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 sm:w-10 sm:h-10 text-vd-primary" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-vd-text-heading mb-2">Profile Under Review</h2>
            <p className="text-vd-text-sub text-sm mb-4">
              Your profile is awaiting admin approval. This usually takes up to <strong className="text-vd-text-heading">24 hours</strong>.
            </p>
            <div className="bg-vd-bg-alt border border-vd-border rounded-2xl p-4 mb-5 text-left space-y-2">
              {[
                { icon: CheckCircle, text: 'Registration complete', done: true },
                { icon: CheckCircle, text: 'Profile submitted', done: true },
                { icon: Clock, text: 'Waiting for admin verification', done: false },
              ].map(({ icon: Icon, text, done }) => (
                <div key={text} className="flex items-center gap-2 text-sm">
                  <Icon className={`w-4 h-4 flex-shrink-0 ${done ? 'text-green-500' : 'text-vd-primary'}`} />
                  <span className="text-vd-text-sub">{text}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-vd-text-light mb-5">
              We'll email <strong className="text-vd-primary">{pendingEmail}</strong> once approved.
            </p>
            <button onClick={() => setPendingEmail(null)}
              className="w-full border border-vd-border py-3 rounded-2xl text-sm font-medium text-vd-text-sub hover:bg-vd-accent-soft transition-colors">
              Back to Login
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen lg:h-screen flex flex-col lg:flex-row bg-vd-bg lg:overflow-hidden">
      {/* Left image panel */}
      <div className="hidden lg:block lg:w-1/2 relative flex-shrink-0">
        <img src="/images/logo-img-light.png" alt="Vivah Dwar"
          className="absolute inset-0 w-full h-full object-cover dark:hidden" />
        <img src="/images/logo-image.png" alt="Vivah Dwar"
          className="absolute inset-0 w-full h-full object-cover hidden dark:block" />
      </div>

      {/* Right form panel */}
      <div className="flex-1 lg:overflow-y-auto flex items-center justify-center px-4 sm:px-6 py-8 bg-vd-bg">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="w-full max-w-sm sm:max-w-md">

          <AnimatePresence mode="wait">
            {showQR ? (
              <QRLoginPanel key="qr" onBack={() => setShowQR(false)} />
            ) : (
              <motion.div key="form" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>

                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Sparkles className="w-4 h-4 text-vd-primary" />
                    <span className="text-xs font-medium text-vd-primary uppercase tracking-wider">Welcome Back</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-vd-text-heading">Sign in to your account</h1>
                  <p className="text-vd-text-sub text-sm mt-1">
                    {loginMode === 'family' ? 'Family member login — browse profiles read-only' : 'Continue your journey to find the perfect match'}
                  </p>
                </div>

                <div className="flex bg-vd-bg-alt rounded-xl p-1 border border-vd-border mb-4">
                  <button type="button" onClick={() => setLoginMode('member')}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${loginMode === 'member' ? 'bg-vd-primary text-white' : 'text-vd-text-sub'}`}>
                    Member Login
                  </button>
                  <button type="button" onClick={() => setLoginMode('family')}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${loginMode === 'family' ? 'bg-vd-primary text-white' : 'text-vd-text-sub'}`}>
                    Family Login
                  </button>
                </div>

                {loginMode === 'member' && (
                <>
                {/* Google */}
                <button
                  type="button"
                  onClick={() => {
                    setGoogleLoading(true);
                    const callbackUrl = searchParams?.get('callbackUrl');
                    signIn('google', {
                      callbackUrl:
                        callbackUrl && callbackUrl.startsWith('/')
                          ? callbackUrl
                          : '/profile-launch',
                    });
                  }}
                  disabled={googleLoading}
                  className="w-full flex items-center justify-center gap-3 px-4 sm:px-5 py-3.5 sm:py-4 bg-vd-bg-section border border-vd-border rounded-2xl font-medium text-sm text-vd-text-heading hover:bg-vd-accent-soft hover:border-vd-primary/25 transition-all shadow-sm hover:shadow-md mb-3 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {googleLoading ? (
                    <>
                      <span className="w-5 h-5 border-2 border-vd-primary/40 border-t-vd-primary rounded-full animate-spin flex-shrink-0" />
                      Redirecting to Google...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      Continue with Google
                    </>
                  )}
                </button>

                {/* QR Login */}
                <button
                  type="button"
                  onClick={() => setShowQR(true)}
                  className="w-full flex items-center gap-3 px-4 sm:px-5 py-3.5 sm:py-4 mb-5 rounded-2xl border border-vd-border bg-vd-bg-section text-sm font-medium text-vd-text-heading hover:bg-vd-accent-soft hover:border-vd-primary/25 transition-all shadow-sm hover:shadow-md group"
                >
                  <QrCode className="w-5 h-5 flex-shrink-0 text-vd-primary group-hover:scale-105 transition-transform" />
                  <span className="flex-1 min-w-0 text-left leading-snug">Login with QR Code</span>
                  <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wide text-vd-primary bg-vd-accent-soft px-2.5 py-1 rounded-full leading-none">
                    Mobile
                  </span>
                </button>

                <div className="flex items-center gap-3 mb-5">
                  <div className="flex-1 h-px bg-vd-border" />
                  <span className="text-xs text-vd-text-light font-medium px-2">OR</span>
                  <div className="flex-1 h-px bg-vd-border" />
                </div>
                </>
                )}

                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-vd-text-sub mb-1.5">Email address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-vd-text-light" />
                      <input type="email" value={form.email}
                        onChange={e => handleChange('email', e.target.value)}
                        onBlur={() => handleBlur('email')}
                        className={fieldCls('email')}
                        placeholder="you@example.com" />
                    </div>
                    {touched.email && errors.email && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full bg-red-500 text-white text-center leading-3 flex-shrink-0 text-[9px]">!</span>
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-sm font-semibold text-vd-text-sub">Password</label>
                      {loginMode === 'member' && (
                      <Link href="/forgot-password" className="text-xs text-vd-primary hover:text-vd-primary-dark font-medium">Forgot password?</Link>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-vd-text-light" />
                      <input type={showPass ? 'text' : 'password'} value={form.password}
                        onChange={e => handleChange('password', e.target.value)}
                        onBlur={() => handleBlur('password')}
                        className={fieldCls('password') + ' pr-12'}
                        placeholder="••••••••" />
                      <button type="button" onClick={() => setShowPass(!showPass)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-vd-text-light hover:text-vd-text-sub transition-colors">
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {touched.password && errors.password && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full bg-red-500 text-white text-center leading-3 flex-shrink-0 text-[9px]">!</span>
                        {errors.password}
                      </p>
                    )}
                  </div>

                  <div className="rounded-2xl border border-vd-border bg-vd-bg-alt/60 px-4 py-3.5">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-vd-border text-vd-primary focus:ring-vd-primary/30 focus:ring-offset-0 cursor-pointer accent-[#C8A45C]"
                      />
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-semibold text-vd-text-heading group-hover:text-vd-primary transition-colors">
                          Remember me
                        </span>
                        <span className="block text-xs text-vd-text-light mt-0.5 leading-relaxed">
                          Stay signed in for 30 days on this device. We only save your email — never your password.
                        </span>
                      </span>
                    </label>
                  </div>

                  <button type="submit" disabled={loading}
                    className="w-full vd-gradient-gold text-white py-3 rounded-2xl font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ boxShadow: '0 4px 20px rgba(200,164,92,0.35)' }}>
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Signing in...
                      </span>
                    ) : 'Sign In'}
                  </button>
                </form>

                <p className="text-center text-sm text-vd-text-light mt-5 pb-4">
                  Don't have an account?{' '}
                  <Link href="/register" className="text-vd-primary font-semibold hover:text-vd-primary-dark">Register free</Link>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<SiteLoader message="Loading…" size="lg" />}>
      <LoginInner />
    </Suspense>
  );
}
