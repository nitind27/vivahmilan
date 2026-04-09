'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, User, Mail, Lock, Phone, ChevronRight, ChevronLeft } from 'lucide-react';
import { signIn } from 'next-auth/react';
import toast from 'react-hot-toast';

const steps = ['Account', 'Personal', 'Done'];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '', gender: '',
  });

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const next = () => {
    if (step === 0 && (!form.name || !form.email || !form.password)) {
      toast.error('Please fill all fields'); return;
    }
    if (step === 1 && !form.gender) {
      toast.error('Please select gender'); return;
    }
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950 px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 gradient-bg rounded-full flex items-center justify-center">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="text-2xl font-bold gradient-text">Milan</span>
          </Link>
          <h1 className="text-3xl font-bold">Create Account</h1>
          <p className="text-gray-500 mt-2">Find your perfect life partner</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${i <= step ? 'gradient-bg text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                {i + 1}
              </div>
              {i < steps.length - 1 && <div className={`w-12 h-1 rounded transition-all ${i < step ? 'gradient-bg' : 'bg-gray-200 dark:bg-gray-700'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <button onClick={() => signIn('google', { callbackUrl: '/profile/edit' })}
                  className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 dark:border-gray-600 rounded-2xl py-3 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  Continue with Google
                </button>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600" />
                  <span className="text-sm text-gray-400">or</span>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="text" value={form.name} onChange={e => update('name', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-2xl bg-gray-50 dark:bg-gray-700 input-focus text-sm"
                      placeholder="Your full name" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="email" value={form.email} onChange={e => update('email', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-2xl bg-gray-50 dark:bg-gray-700 input-focus text-sm"
                      placeholder="your@email.com" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="password" value={form.password} onChange={e => update('password', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-2xl bg-gray-50 dark:bg-gray-700 input-focus text-sm"
                      placeholder="Min 8 characters" minLength={8} />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-3">I am looking for</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[{ val: 'MALE', label: '👨 Groom', sub: 'I am a Bride' }, { val: 'FEMALE', label: '👩 Bride', sub: 'I am a Groom' }].map(g => (
                      <button key={g.val} onClick={() => update('gender', g.val === 'MALE' ? 'FEMALE' : 'MALE')}
                        className={`p-4 rounded-2xl border-2 text-center transition-all ${form.gender === (g.val === 'MALE' ? 'FEMALE' : 'MALE') ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20' : 'border-gray-200 dark:border-gray-600 hover:border-pink-300'}`}>
                        <div className="text-2xl mb-1">{g.label.split(' ')[0]}</div>
                        <div className="font-semibold text-sm">{g.label.split(' ')[1]}</div>
                        <div className="text-xs text-gray-500">{g.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone (optional)</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-2xl bg-gray-50 dark:bg-gray-700 input-focus text-sm"
                      placeholder="+1 234 567 8900" />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
                <div className="w-20 h-20 gradient-bg rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-10 h-10 text-white fill-white" />
                </div>
                <h3 className="text-2xl font-bold mb-2">You're all set!</h3>
                <p className="text-gray-500 mb-6">Complete your profile to start finding matches.</p>
                <button onClick={submit} disabled={loading} className="w-full gradient-bg text-white py-3 rounded-2xl font-semibold hover:opacity-90 disabled:opacity-60">
                  {loading ? 'Creating account...' : 'Complete Profile Setup'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {step < 2 && (
            <div className="flex gap-3 mt-6">
              {step > 0 && (
                <button onClick={() => setStep(s => s - 1)} className="flex-1 border-2 border-gray-200 dark:border-gray-600 py-3 rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
              )}
              <button onClick={next} className="flex-1 gradient-bg text-white py-3 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:opacity-90">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 0 && (
            <p className="text-center text-sm text-gray-500 mt-4">
              Already have an account? <Link href="/login" className="text-pink-500 font-medium">Sign in</Link>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
