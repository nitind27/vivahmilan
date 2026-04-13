'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle, Shield } from 'lucide-react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

export default function SetPasswordModal() {
  const { data: session, update } = useSession();
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [show, setShow] = useState({ password: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Only show if user is approved AND needs to set password
  if (!session?.user?.needsPassword || !session?.user?.adminVerified || done) return null;

  const strength = (() => {
    const p = form.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8)  s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthColor = ['', 'bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'][strength];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }

      // Update session so modal disappears
      await update({ needsPassword: false });
      setDone(true);
      toast.success('Password set successfully! You can now login with email too.');
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden"
        >
          {/* Top gradient bar */}
          <div className="h-1.5 gradient-bg w-full" />

          <div className="p-7">
            {/* Icon + heading */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-16 h-16 gradient-bg rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Set Your Password</h2>
              <p className="text-gray-500 text-sm mt-2 max-w-xs">
                You signed in with Google. Please set a password so you can also login with your email.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={show.password ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Min. 8 characters"
                    required
                    className="w-full pl-10 pr-10 py-3 border border-gray-200 dark:border-gray-600 rounded-2xl bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:border-pink-500 transition-colors"
                  />
                  <button type="button" onClick={() => setShow(s => ({ ...s, password: !s.password }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {show.password ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Strength bar */}
                {form.password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1,2,3,4].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? strengthColor : 'bg-gray-200 dark:bg-gray-700'}`} />
                      ))}
                    </div>
                    <p className={`text-xs font-medium ${['','text-red-500','text-yellow-500','text-blue-500','text-green-500'][strength]}`}>
                      {strengthLabel}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={show.confirm ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                    placeholder="Re-enter password"
                    required
                    className={`w-full pl-10 pr-10 py-3 border rounded-2xl bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none transition-colors ${
                      form.confirmPassword && form.password !== form.confirmPassword
                        ? 'border-red-400 focus:border-red-500'
                        : form.confirmPassword && form.password === form.confirmPassword
                        ? 'border-green-400 focus:border-green-500'
                        : 'border-gray-200 dark:border-gray-600 focus:border-pink-500'
                    }`}
                  />
                  <button type="button" onClick={() => setShow(s => ({ ...s, confirm: !s.confirm }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {show.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  {form.confirmPassword && form.password === form.confirmPassword && (
                    <CheckCircle className="absolute right-9 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                  )}
                </div>
                {form.confirmPassword && form.password !== form.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                )}
              </div>

              {/* Tips */}
              <div className="bg-blue-50 dark:bg-blue-900/10 rounded-2xl p-3 text-xs text-blue-700 dark:text-blue-400 space-y-1">
                <p className="font-semibold mb-1">Password tips:</p>
                {[
                  ['At least 8 characters', form.password.length >= 8],
                  ['One uppercase letter', /[A-Z]/.test(form.password)],
                  ['One number', /[0-9]/.test(form.password)],
                  ['One special character', /[^A-Za-z0-9]/.test(form.password)],
                ].map(([tip, met]) => (
                  <div key={tip} className="flex items-center gap-1.5">
                    <span className={met ? 'text-green-500' : 'text-gray-400'}>
                      {met ? '✓' : '○'}
                    </span>
                    <span className={met ? 'text-green-600 dark:text-green-400' : ''}>{tip}</span>
                  </div>
                ))}
              </div>

              <button
                type="submit"
                disabled={loading || form.password !== form.confirmPassword || form.password.length < 8}
                className="w-full gradient-bg text-white py-3.5 rounded-2xl font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity text-sm"
              >
                {loading ? 'Setting password...' : 'Set Password & Continue'}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
