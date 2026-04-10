'use client';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import { Flag, AlertTriangle, CheckCircle, User, MessageCircle, CreditCard, Camera, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

const REASONS = [
  { value: 'FAKE_PROFILE', label: 'Fake or Impersonation Profile', icon: User },
  { value: 'HARASSMENT', label: 'Harassment or Threatening Behavior', icon: MessageCircle },
  { value: 'SCAM', label: 'Scam or Financial Fraud', icon: CreditCard },
  { value: 'INAPPROPRIATE_CONTENT', label: 'Inappropriate Photos or Content', icon: Camera },
  { value: 'SPAM', label: 'Spam or Unsolicited Messages', icon: Flag },
  { value: 'UNDERAGE', label: 'Underage User', icon: Shield },
  { value: 'OTHER', label: 'Other', icon: AlertTriangle },
];

export default function ReportAbusePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [form, setForm] = useState({ profileUrl: '', reason: '', details: '', email: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.reason) { toast.error('Please select a reason'); return; }
    if (!form.details.trim()) { toast.error('Please provide details'); return; }
    if (!session && !form.email) { toast.error('Please enter your email'); return; }

    setLoading(true);
    try {
      // If logged in, use the report API
      if (session && form.profileUrl) {
        const urlParts = form.profileUrl.split('/');
        const targetId = urlParts[urlParts.length - 1];
        if (targetId && targetId.length > 5) {
          await fetch('/api/report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetId, reason: form.reason, details: form.details }),
          });
        }
      }
      setSubmitted(true);
    } catch {
      toast.error('Submission failed. Please try again.');
    } finally { setLoading(false); }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />
        <div className="pt-24 flex items-center justify-center px-4 pb-12">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-3xl p-10 max-w-md w-full text-center border border-gray-100 dark:border-gray-700 shadow-xl">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Report Submitted</h2>
            <p className="text-gray-500 text-sm mb-6">Thank you for helping keep Vivah Milan safe. Our team will review your report within 24 hours and take appropriate action.</p>
            <div className="space-y-2">
              <Link href="/dashboard" className="block gradient-bg text-white py-3 rounded-2xl font-semibold text-sm hover:opacity-90 transition-opacity">
                Back to Dashboard
              </Link>
              <button onClick={() => { setSubmitted(false); setForm({ profileUrl: '', reason: '', details: '', email: '' }); }}
                className="block w-full border border-gray-200 dark:border-gray-600 py-3 rounded-2xl text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Submit Another Report
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="pt-16">
        {/* Hero */}
        <div className="bg-red-600 py-12 px-4 text-center">
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <Flag className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Report Abuse</h1>
          <p className="text-red-100 text-sm max-w-md mx-auto">Help us maintain a safe community. All reports are confidential and reviewed within 24 hours.</p>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile URL */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
              <label className="block text-sm font-semibold mb-2">Profile URL or Name (optional)</label>
              <input
                value={form.profileUrl}
                onChange={e => setForm(p => ({ ...p, profileUrl: e.target.value }))}
                placeholder="e.g. https://vivahmilan.com/profile/abc123 or person's name"
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:border-pink-400"
              />
            </div>

            {/* Reason */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
              <label className="block text-sm font-semibold mb-3">Reason for Report <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {REASONS.map(r => (
                  <button key={r.value} type="button" onClick={() => setForm(p => ({ ...p, reason: r.value }))}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all text-sm ${form.reason === r.value ? 'border-red-500 bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400' : 'border-gray-200 dark:border-gray-600 hover:border-red-300'}`}>
                    <r.icon className="w-4 h-4 flex-shrink-0" />
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Details */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
              <label className="block text-sm font-semibold mb-2">Details <span className="text-red-500">*</span></label>
              <textarea
                value={form.details}
                onChange={e => setForm(p => ({ ...p, details: e.target.value }))}
                rows={4} maxLength={1000}
                placeholder="Please describe the issue in detail. Include any relevant information that will help our team investigate."
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:border-pink-400 resize-none"
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{form.details.length}/1000</p>
            </div>

            {/* Email if not logged in */}
            {!session && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
                <label className="block text-sm font-semibold mb-2">Your Email <span className="text-red-500">*</span></label>
                <input
                  type="email" value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:border-pink-400"
                />
              </div>
            )}

            <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-4 text-sm text-yellow-700 dark:text-yellow-400">
              <AlertTriangle className="w-4 h-4 inline mr-1.5" />
              All reports are confidential. False reports may result in action against your account.
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-3.5 rounded-2xl font-semibold transition-colors disabled:opacity-60">
              {loading ? 'Submitting…' : 'Submit Report'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
