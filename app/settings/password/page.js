'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle, Shield } from 'lucide-react';
import Navbar from '@/components/Navbar';
import SiteLoader from '@/components/SiteLoader';
import toast from 'react-hot-toast';

export default function ChangePasswordPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [hasPassword, setHasPassword] = useState(true);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/auth/change-password')
      .then(r => r.json())
      .then(d => setHasPassword(d.hasPassword !== false))
      .catch(() => {})
      .finally(() => setLoadingInfo(false));
  }, [status]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (hasPassword && !currentPassword) {
      toast.error('Enter your current password');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to update password');
        return;
      }
      setDone(true);
      toast.success('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading' || loadingInfo) {
    return <SiteLoader message="Loading…" />;
  }

  if (status !== 'authenticated') return null;

  const inputCls = 'w-full px-4 py-3 pr-11 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-sm focus:outline-none focus:border-vd-primary focus:ring-2 focus:ring-vd-accent-soft transition-all';

  return (
    <div className="min-h-screen bg-vd-bg">
      <Navbar />
      <div className="max-w-md mx-auto px-4 pt-24 pb-12">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-vd-primary mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-vd-bg-section dark:bg-vd-bg-card rounded-3xl border border-vd-border shadow-lg p-6 sm:p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 vd-gradient-gold rounded-2xl flex items-center justify-center">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-vd-text dark:text-white">
                {hasPassword ? 'Change Password' : 'Set Password'}
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                {hasPassword
                  ? 'Update your account password securely'
                  : 'Create a password to also login with email'}
              </p>
            </div>
          </div>

          {done ? (
            <div className="text-center py-6">
              <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
              <h2 className="text-lg font-bold mb-2">Password Updated!</h2>
              <p className="text-sm text-gray-500 mb-6">Your password has been changed successfully.</p>
              <Link href="/dashboard" className="vd-gradient-gold text-white px-6 py-2.5 rounded-xl font-semibold text-sm inline-block hover:opacity-90">
                Go to Dashboard
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {!hasPassword && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40 text-xs text-blue-700 dark:text-blue-300">
                  <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>You signed in with Google. Set a password here to login with email and password too.</span>
                </div>
              )}

              {hasPassword && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className={inputCls}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className={inputCls}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className={inputCls}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {hasPassword && (
                <p className="text-xs text-gray-500">
                  Forgot password?{' '}
                  <Link href="/forgot-password" className="text-vd-primary hover:underline font-medium">
                    Reset via email
                  </Link>
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full vd-gradient-gold text-white py-3 rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-60 transition-opacity mt-2"
              >
                {submitting ? 'Updating…' : hasPassword ? 'Update Password' : 'Set Password'}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
