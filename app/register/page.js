'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, User, Mail, Lock, Phone, ChevronRight, ChevronLeft, Sparkles, Eye, EyeOff } from 'lucide-react';
import { signIn, useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

const steps = ['Account', 'Personal', 'Done'];
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[+]?[\d\s\-()]{7,15}$/;

function ErrMsg({ msg }) {
  if (!msg) return null;
  return (
    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
      <span className="w-3 h-3 rounded-full bg-red-500 text-white text-center leading-3 flex-shrink-0 text-[9px]">!</span>
      {msg}
    </p>
  );
}

export default function RegisterPage() {
  const { status } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', gender: '' });

  useEffect(() => {
    if (status === 'authenticated') router.replace('/dashboard');
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-vd-bg">
        <div className="w-10 h-10 border-2 border-vd-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const update = (k, v) => {
    const updated = { ...form, [k]: v };
    setForm(updated);
    if (touched[k]) setErrors(p => ({ ...p, ...validateField(k, v) }));
  };

  const validateField = (k, v) => {
    const e = {};
    if (k === 'name') {
      if (!v.trim()) e.name = 'Full name is required';
      else if (v.trim().length < 2) e.name = 'Name must be at least 2 characters';
    }
    if (k === 'email') {
      if (!v) e.email = 'Email is required';
      else if (!emailRegex.test(v)) e.email = 'Enter a valid email address';
    }
    if (k === 'password') {
      if (!v) e.password = 'Password is required';
      else if (v.length < 8) e.password = 'Password must be at least 8 characters';
      else if (!/[A-Z]/.test(v) && !/[0-9]/.test(v)) e.password = 'Add a number or uppercase letter';
    }
    if (k === 'phone' && v && !phoneRegex.test(v)) {
      e.phone = 'Enter a valid phone number';
    }
    return e;
  };

  const validateStep0 = () => {
    const e = {
      ...validateField('name', form.name),
      ...validateField('email', form.email),
      ...validateField('password', form.password),
    };
    setTouched(p => ({ ...p, name: true, email: true, password: true }));
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep1 = () => {
    const e = {};
    if (!form.gender) e.gender = 'Please select what you are looking for';
    if (form.phone && !phoneRegex.test(form.phone)) e.phone = 'Enter a valid phone number';
    setTouched(p => ({ ...p, gender: true, phone: true }));
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (step === 0 && !validateStep0()) return;
    if (step === 1 && !validateStep1()) return;
    setStep(s => s + 1);
  };

  const submit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); setLoading(false); return; }
      toast.success('Account created! Please verify your email.');
      router.push(`/verify-email?email=${encodeURIComponent(form.email)}`);
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const inpCls = (field) =>
    `w-full pl-11 pr-4 py-3 border rounded-2xl bg-vd-bg-section text-sm text-vd-text-heading placeholder:text-vd-text-light input-focus transition-all ${
      touched[field] && errors[field] ? 'border-red-400' : 'border-vd-border'
    }`;

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

          <div className="flex justify-center mb-5 pt-4 sm:pt-6">
            <img src="/logo/logo.png" alt="Vivah Dwar" className="h-12 sm:h-16 w-auto object-contain" />
          </div>

          <div className="mb-5">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="w-4 h-4 text-vd-primary" />
              <span className="text-xs font-medium text-vd-primary uppercase tracking-wider">Get Started</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-vd-text-heading">Create your account</h1>
            <p className="text-vd-text-sub text-sm mt-1">Find your perfect life partner</p>
          </div>

          {/* Step progress */}
          <div className="flex items-center justify-center gap-2 mb-5">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  i < step ? 'vd-gradient-gold text-white' :
                  i === step ? 'vd-gradient-gold text-white shadow-md' :
                  'bg-vd-bg-alt border border-vd-border text-vd-text-light'
                }`}>
                  {i < step ? '✓' : i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div className={`w-8 sm:w-10 h-0.5 rounded transition-all ${i < step ? 'vd-gradient-gold' : 'bg-vd-border'}`} />
                )}
              </div>
            ))}
          </div>

          <div className="bg-vd-bg-section rounded-3xl shadow-xl p-5 sm:p-7 border border-vd-border">
            <AnimatePresence mode="wait">

              {/* Step 0 — Account */}
              {step === 0 && (
                <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <button onClick={() => signIn('google', { callbackUrl: '/profile/edit' })}
                    className="w-full flex items-center justify-center gap-3 bg-vd-bg-section border border-vd-border rounded-2xl py-3 font-medium text-sm text-vd-text-heading hover:bg-vd-accent-soft transition-all shadow-sm hover:shadow-md">
                    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                  </button>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-vd-border" />
                    <span className="text-xs text-vd-text-light font-medium px-2">OR</span>
                    <div className="flex-1 h-px bg-vd-border" />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-vd-text-sub mb-1.5">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-vd-text-light" />
                      <input type="text" value={form.name}
                        onChange={e => update('name', e.target.value)}
                        onBlur={() => setTouched(p => ({ ...p, name: true }))}
                        className={inpCls('name')} placeholder="Your full name" />
                    </div>
                    <ErrMsg msg={touched.name && errors.name} />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-vd-text-sub mb-1.5">Email address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-vd-text-light" />
                      <input type="email" value={form.email}
                        onChange={e => update('email', e.target.value)}
                        onBlur={() => setTouched(p => ({ ...p, email: true }))}
                        className={inpCls('email')} placeholder="you@example.com" />
                    </div>
                    <ErrMsg msg={touched.email && errors.email} />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-vd-text-sub mb-1.5">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-vd-text-light" />
                      <input type={showPass ? 'text' : 'password'} value={form.password}
                        onChange={e => update('password', e.target.value)}
                        onBlur={() => setTouched(p => ({ ...p, password: true }))}
                        className={inpCls('password') + ' pr-12'} placeholder="Min 8 characters" />
                      <button type="button" onClick={() => setShowPass(!showPass)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-vd-text-light hover:text-vd-text-sub transition-colors">
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <ErrMsg msg={touched.password && errors.password} />
                    {form.password && !errors.password && (
                      <div className="mt-2 flex gap-1">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${
                            form.password.length >= 8 && i < 2 ? 'bg-vd-primary' :
                            form.password.length >= 10 && i < 3 ? 'bg-vd-primary' :
                            form.password.length >= 12 && i < 4 ? 'bg-green-500' :
                            form.password.length >= 6 && i < 1 ? 'bg-amber-400' :
                            'bg-vd-border'
                          }`} />
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Step 1 — Personal */}
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-vd-text-sub mb-3">I am looking for</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { val: 'FEMALE', label: 'Groom', emoji: '👨', sub: 'I am a Bride' },
                        { val: 'MALE', label: 'Bride', emoji: '👩', sub: 'I am a Groom' },
                      ].map(g => (
                        <button key={g.val} onClick={() => update('gender', g.val === 'MALE' ? 'FEMALE' : 'MALE')}
                          className={`p-3 sm:p-4 rounded-2xl border-2 text-center transition-all ${
                            form.gender === (g.val === 'MALE' ? 'FEMALE' : 'MALE')
                              ? 'border-vd-primary bg-vd-accent-soft'
                              : touched.gender && errors.gender
                              ? 'border-red-300 hover:border-vd-primary'
                              : 'border-vd-border hover:border-vd-primary hover:bg-vd-accent-soft'
                          }`}>
                          <div className="text-2xl sm:text-3xl mb-1">{g.emoji}</div>
                          <div className="font-semibold text-sm text-vd-text-heading">{g.label}</div>
                          <div className="text-xs text-vd-text-light mt-0.5">{g.sub}</div>
                        </button>
                      ))}
                    </div>
                    <ErrMsg msg={touched.gender && errors.gender} />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-vd-text-sub mb-1.5">
                      Phone <span className="text-vd-text-light font-normal">(optional)</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-vd-text-light" />
                      <input type="tel" value={form.phone}
                        onChange={e => update('phone', e.target.value)}
                        onBlur={() => setTouched(p => ({ ...p, phone: true }))}
                        className={inpCls('phone')} placeholder="+91 98765 43210" />
                    </div>
                    <ErrMsg msg={touched.phone && errors.phone} />
                  </div>
                </motion.div>
              )}

              {/* Step 2 — Done */}
              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-2">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 vd-gradient-gold rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ boxShadow: '0 8px 24px rgba(200,164,92,0.4)' }}>
                    <Heart className="w-8 h-8 sm:w-10 sm:h-10 text-white fill-white" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-vd-text-heading mb-2">You're all set!</h3>
                  <p className="text-vd-text-sub text-sm mb-5">Complete your profile to start finding your perfect match.</p>
                  <button onClick={submit} disabled={loading}
                    className="w-full vd-gradient-gold text-white py-3 rounded-2xl font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ boxShadow: '0 4px 20px rgba(200,164,92,0.35)' }}>
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Creating account...
                      </span>
                    ) : 'Complete Profile Setup'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {step < 2 && (
              <div className="flex gap-3 mt-5">
                {step > 0 && (
                  <button onClick={() => setStep(s => s - 1)}
                    className="flex-1 border border-vd-border py-3 rounded-2xl font-medium text-sm text-vd-text-sub flex items-center justify-center gap-2 hover:bg-vd-accent-soft transition-colors">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                )}
                <button onClick={next}
                  className="flex-1 vd-gradient-gold text-white py-3 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all"
                  style={{ boxShadow: '0 4px 20px rgba(200,164,92,0.35)' }}>
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {step === 0 && (
              <p className="text-center text-sm text-vd-text-light mt-4">
                Already have an account?{' '}
                <Link href="/login" className="text-vd-primary font-semibold hover:text-vd-primary-dark">Sign in</Link>
              </p>
            )}
          </div>
          <div className="pb-6" />
        </motion.div>
      </div>
    </div>
  );
}
