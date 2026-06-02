'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Gift, Crown, CheckCircle, Loader2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EarlyBirdOfferCard({ className = '' }) {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  const loadOffer = () => {
    fetch('/api/early-bird/status')
      .then(r => r.json())
      .then(d => setOffer(d.offer || null))
      .catch(() => setOffer(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (status === 'loading') return;
    loadOffer();
  }, [status, session?.user?.id]);

  const handleClaim = async () => {
    if (!session) {
      router.push('/login?callbackUrl=/premium');
      return;
    }
    setClaiming(true);
    try {
      const res = await fetch('/api/early-bird/claim', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Could not claim offer');
        loadOffer();
        return;
      }
      toast.success(data.message || 'Free access activated!');
      await update?.();
      loadOffer();
      setTimeout(() => window.location.reload(), 800);
    } catch {
      toast.error('Something went wrong');
    } finally {
      setClaiming(false);
    }
  };

  if (loading || !offer || offer.status === 'disabled' || offer.status === 'sold_out') {
    return null;
  }

  if (offer.status === 'active') {
    const expiryStr = offer.expiry
      ? new Date(offer.expiry).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : '';
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl border-2 border-emerald-400/50 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/40 dark:to-green-950/30 p-5 sm:p-6 ${className}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Early Bird Active</p>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Free {offer.planDisplayName || offer.plan} Access
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {offer.daysLeft} days left · Valid till {expiryStr}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-emerald-500 text-white text-sm font-bold shrink-0">
            <Crown className="w-4 h-4" /> Full Access ON
          </span>
        </div>
      </motion.div>
    );
  }

  if (offer.status !== 'eligible' && offer.status !== 'login_required') {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border-2 border-amber-400/60 bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950/50 dark:via-yellow-950/30 dark:to-orange-950/30 p-5 sm:p-6 shadow-lg ${className}`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center gap-5">
        <div className="flex items-start gap-4 flex-1">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 shadow-md">
            <Gift className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wide">
                Limited Offer · {offer.slotsLeft} slots left
              </span>
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-1">
              {offer.title || 'Early Bird Offer'}
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {offer.subtitle || offer.message || (
                <>Get <strong>{offer.planDisplayName}</strong> plan <strong>FREE</strong> for <strong>{offer.durationLabel}</strong> — first {offer.limit} users only!</>
              )}
            </p>
            <p className="text-xs text-amber-800/80 dark:text-amber-200/80 mt-2 font-medium">
              {offer.claimedCount} / {offer.limit} members already claimed
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleClaim}
          disabled={claiming}
          className="shrink-0 w-full lg:w-auto px-8 py-4 rounded-2xl font-bold text-base bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg hover:opacity-95 disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {claiming ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> Activating…
            </>
          ) : (
            <>
              <Crown className="w-5 h-5" />
              {session ? 'Get Your Free Access' : 'Login & Get Free Access'}
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
