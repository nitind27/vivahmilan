'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Mail, ArrowLeft, Lock, Eye, EyeOff, RefreshCw, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const STEPS = ['email', 'otp', 'password', 'done'];

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const startCountdown = () => {
    setCountdown(60);
    const t = setInterval(() => setCountdown(c => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; }), 1000);
  };

  const sendOTP = async () => {
    if (!email) { toast.error('Enter your email'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success('OTP sent to your email!');
      setStep('otp');
      startCountdown();
    } finally { setLoading(false); }
  };

  const resendOTP = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type: 'PASSWORD_RESET' }),
      });
      if (res.ok) { toast.success('OTP resent!'); startCountdown(); }
    } finally { setLoading(false); }
  };

  const verifyOTP = async () => {
    const code = otp.join('');
    if (code.length !== 6) { toast.error('Enter 6-digit OTP'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: code, type: 'PASSWORD_RESET' }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      setStep('password');
    } finally { setLoading(false); }
  };

  const resetPassword = async () => {
    if (password.length < 8) { toast.error('Min 8 characters'); return; }
    if (password !== confirm) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otp.join(''), password }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      setStep('done');
      setTimeout(() => router.push('/login'), 2500);
    } finally { setLoading(false); }
  };

  const handleOtpInput = (i, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp]; next[i] = val.slice(-1); setOtp(next);
    if (val && i < 5) document.getElementById(`fp-otp-${i + 1}`)?.focus();
  };

  const handleOtpKey = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) document.getElementById(`fp-otp-${i - 1}`)?.focus();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-vd-bg px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 vd-gradient-gold rounded-full flex items-center justify-center">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="text-2xl font-bold vd-gradient-text">Milan</span>
          </Link>
          <h1 className="text-3xl font-bold">Reset Password</h1>
          <p className="text-gray-500 mt-2 text-sm">
            {step === 'email' && 'Enter your email to receive an OTP'}
            {step === 'otp' && `Enter the 6-digit OTP sent to ${email}`}
            {step === 'password' && 'Create your new password'}
            {step === 'done' && 'Password reset successfully!'}
          </p>
        </div>

        <div className="bg-vd-bg-section dark:bg-vd-bg-card rounded-3xl shadow-xl p-8 border border-vd-border">
          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-6">
            {['email','otp','password'].map((s, i) => (
              <div key={s} className={`h-1.5 rounded-full transition-all ${
                STEPS.indexOf(step) > i ? 'w-8 vd-gradient-gold' :
                step === s ? 'w-8 vd-gradient-gold' : 'w-4 bg-gray-200 dark:bg-gray-600'
              }`} />
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Email */}
            {step === 'email' && (
              <motion.div key="email" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendOTP()}
                      className="w-full pl-10 pr-4 py-3 border border-vd-border rounded-2xl bg-vd-bg input-focus text-sm"
                      placeholder="your@email.com" />
                  </div>
                </div>
                <button onClick={sendOTP} disabled={loading || !email}
                  className="w-full vd-gradient-gold text-white py-3 rounded-2xl font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity">
                  {loading ? 'Sending OTP…' : 'Send OTP'}
                </button>
              </motion.div>
            )}

            {/* Step 2: OTP */}
            {step === 'otp' && (
              <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <div className="flex gap-2 justify-center">
                  {otp.map((digit, i) => (
                    <input key={i} id={`fp-otp-${i}`} type="text" inputMode="numeric" maxLength={1} value={digit}
                      onChange={e => handleOtpInput(i, e.target.value)}
                      onKeyDown={e => handleOtpKey(i, e)}
                      className={`w-12 h-14 text-center text-xl font-bold border-2 rounded-2xl bg-vd-bg focus:outline-none transition-all ${digit ? 'border-vd-primary bg-vd-accent-soft dark:bg-vd-accent/20' : 'border-vd-border focus:border-vd-primary'}`}
                    />
                  ))}
                </div>
                <button onClick={verifyOTP} disabled={loading || otp.join('').length !== 6}
                  className="w-full vd-gradient-gold text-white py-3 rounded-2xl font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity">
                  {loading ? 'Verifying…' : 'Verify OTP'}
                </button>
                <div className="text-center">
                  {countdown > 0 ? (
                    <p className="text-sm text-gray-400">Resend in <span className="text-vd-primary font-medium">{countdown}s</span></p>
                  ) : (
                    <button onClick={resendOTP} disabled={loading} className="text-sm text-vd-primary hover:text-vd-primary-dark flex items-center gap-1.5 mx-auto">
                      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Resend OTP
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 3: New Password */}
            {step === 'password' && (
              <motion.div key="password" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 border border-vd-border rounded-2xl bg-vd-bg input-focus text-sm"
                      placeholder="Min 8 characters" />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-vd-border rounded-2xl bg-vd-bg input-focus text-sm"
                      placeholder="Repeat password" />
                  </div>
                  {confirm && password !== confirm && <p className="text-xs text-red-500 mt-1">Passwords don't match</p>}
                </div>
                <button onClick={resetPassword} disabled={loading || !password || password !== confirm}
                  className="w-full vd-gradient-gold text-white py-3 rounded-2xl font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity">
                  {loading ? 'Resetting…' : 'Reset Password'}
                </button>
              </motion.div>
            )}

            {/* Done */}
            {step === 'done' && (
              <motion.div key="done" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-4">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Password Reset!</h3>
                <p className="text-gray-500 text-sm">Redirecting to login…</p>
              </motion.div>
            )}
          </AnimatePresence>

          <Link href="/login" className="flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-gray-600 mt-5 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
