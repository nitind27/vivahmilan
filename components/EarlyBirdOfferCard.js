'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Crown, CheckCircle, Loader2 } from 'lucide-react';
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
      await update?.({ isPremium: true });
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
        className={`rounded-3xl border border-[#E8DCC8] bg-white p-5 sm:p-6 ${className}`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#F8F1E3] text-[#8F6B2E]">
              <CheckCircle className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A67C3D]">Free access is on</p>
              <h3 className="font-display text-xl font-semibold text-[#2C2416]">{offer.planDisplayName || 'Early Bird'}</h3>
              <p className="text-sm text-[#6E6254]">{offer.daysLeft} days left · until {expiryStr}. No payment.</p>
            </div>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#F8F1E3] px-4 py-2 text-sm font-semibold text-[#8F6B2E]">
            <Crown className="h-4 w-4" /> Premium active
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
      className={`rounded-3xl border border-[#E8DCC8] bg-white p-5 shadow-sm sm:p-6 ${className}`}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A67C3D]">
            No payment · {offer.slotsLeft} of {offer.limit} left
          </p>
          <h3 className="mt-1 font-display text-2xl font-semibold text-[#2C2416]">
            {offer.title || 'Free premium access'}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-[#6E6254]">
            {offer.subtitle || offer.message || `Get ${offer.planDisplayName} free for ${offer.durationLabel}.`}
          </p>
          <p className="mt-2 text-xs text-[#8A7A68]">
            {offer.planDisplayName} · {offer.durationLabel} · {offer.claimedCount} claimed
          </p>
        </div>
        <button
          type="button"
          onClick={handleClaim}
          disabled={claiming}
          className="vd-gradient-gold inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white disabled:opacity-70 lg:w-auto"
        >
          {claiming ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Activating…
            </>
          ) : (
            <>
              <Crown className="h-4 w-4" />
              {session ? 'Activate free access' : 'Login and activate'}
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
