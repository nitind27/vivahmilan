'use client';
import { useState, useEffect, Suspense } from 'react';
import { signIn, getSession, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Clock, CheckCircle, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState(null);

  useEffect(() => {
    const error = searchParams?.get('error');
    if (error === 'PENDING_APPROVAL') setPendingEmail('your Google account');
    else if (error === 'AccountSuspended') toast.error('Your account has been suspended.');
    else if (error === 'ServerError') toast.error('Something went wrong. Please try again.');
    else if (error === 'AccessDenied') toast.error('Access denied. Please try again or contact support.');
  }, [searchParams]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      router.replace(session.user.role === 'ADMIN' ? '/admin' : '/dashboard');
    }
  }, [status, session, router]);

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
    const allTouched = { email: true, password: true };
    setTouched(allTouched);
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    const res = await signIn('credentials', { ...form, redirect: false });
    setLoading(false);
    if (res?.error) {
      if (res.error === 'PENDING_APPROVAL') { setPendingEmail(form.email); return; }
      // Profile incomplete — redirect to onboarding to fill remaining fields
      if (res.error.startsWith('PROFILE_INCOMPLETE:')) {
        const email = res.error.split(':')[1] || form.email;
        toast('Please complete your profile first.', { icon: '📝' });
        router.push(`/onboarding?email=${encodeURIComponent(email)}`);
        return;
      }
      toast.error(res.error === 'CredentialsSignin' ? 'Invalid email or password' : res.error);
    } else {
      toast.success('Welcome back!');
      const s = await getSession();
      router.push(s?.user?.role === 'ADMIN' ? '/admin' : '/dashboard');
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
                { icon: CheckCircle, text: 'Registration complete' },
                { icon: CheckCircle, text: 'Profile submitted' },
                { icon: Clock, text: 'Waiting for admin verification' },
              ].map(({ icon: Icon, text }, i) => (
                <div key={text} className="flex items-center gap-2 text-sm">
                  <Icon className={`w-4 h-4 flex-shrink-0 ${i < 2 ? 'text-green-500' : 'text-vd-primary'}`} />
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
      <div className="hidden lg:block lg:w-1/2 relative flex-shrink-0">
        <img src="/images/logo-img-light.png" alt="Vivah Dwar"
          className="absolute inset-0 w-full h-full object-cover dark:hidden" />
        <img src="/images/logo-image.png" alt="Vivah Dwar"
          className="absolute inset-0 w-full h-full object-cover hidden dark:block" />
      </div>

      <div className="flex-1 lg:overflow-y-auto flex items-center justify-center px-4 sm:px-6 py-8 bg-vd-bg">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="w-full max-w-sm sm:max-w-md">

          <div className="flex justify-center mb-6">
            <img src="/logo/logo.png" alt="Vivah Dwar" className="h-12 sm:h-16 w-auto object-contain" />
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="w-4 h-4 text-vd-primary" />
              <span className="text-xs font-medium text-vd-primary uppercase tracking-wider">Welcome Back</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-vd-text-heading">Sign in to your account</h1>
            <p className="text-vd-text-sub text-sm mt-1">Continue your journey to find the perfect match</p>
          </div>

          <button onClick={() => signIn('google', { callbackUrl: '/login' })}
            className="w-full flex items-center justify-center gap-3 bg-vd-bg-section border border-vd-border rounded-2xl py-3 sm:py-3.5 font-medium text-sm text-vd-text-heading hover:bg-vd-accent-soft transition-all shadow-sm hover:shadow-md mb-5">
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-vd-border" />
            <span className="text-xs text-vd-text-light font-medium px-2">OR</span>
            <div className="flex-1 h-px bg-vd-border" />
          </div>

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
                  <span className="w-3 h-3 rounded-full bg-red-500 text-white text-center leading-3 flex-shrink-0">!</span>
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-vd-text-sub">Password</label>
                <Link href="/forgot-password" className="text-xs text-vd-primary hover:text-vd-primary-dark font-medium">Forgot password?</Link>
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
                  <span className="w-3 h-3 rounded-full bg-red-500 text-white text-center leading-3 flex-shrink-0">!</span>
                  {errors.password}
                </p>
              )}
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
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-vd-bg">
        <div className="w-10 h-10 border-2 border-vd-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginInner />
    </Suspense>
  );
}
