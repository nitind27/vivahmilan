'use client';
import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Crown, X, Loader2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

const SKIP_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/verify-email',
  '/google-verify',
  '/onboarding',
  '/admin',
];

function shouldSkipPath(pathname) {
  return SKIP_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));
}

export default function EarlyBirdLoginPopup() {
  const { data: session, status, update } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [offer, setOffer] = useState(null);
  const [claiming, setClaiming] = useState(false);
  const checkedForUser = useRef(null);

  const markSeen = async () => {
    const uid = session?.user?.id;
    if (uid) {
      try {
        localStorage.setItem(`vd_eb_popup_${uid}`, '1');
        await fetch('/api/early-bird/popup-seen', { method: 'POST' });
      } catch { /* ignore */ }
    }
    setOpen(false);
  };

  const handleDismiss = () => {
    markSeen();
  };

  const handleClaim = async () => {
    setClaiming(true);
    try {
      const res = await fetch('/api/early-bird/claim', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Could not claim offer');
        if (data.code === 'SOLD_OUT' || data.code === 'ALREADY_ACTIVE') await markSeen();
        return;
      }
      toast.success(data.message || 'Free access activated!');
      await markSeen();
      await update?.();
    } catch {
      toast.error('Something went wrong');
    } finally {
      setClaiming(false);
    }
  };

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.id) return;
    if (shouldSkipPath(pathname || '')) return;
    if (session.user.role === 'ADMIN') return;

    const uid = session.user.id;
    if (checkedForUser.current === uid) return;
    if (typeof window !== 'undefined' && localStorage.getItem(`vd_eb_popup_${uid}`) === '1') {
      checkedForUser.current = uid;
      return;
    }

    checkedForUser.current = uid;

    fetch('/api/early-bird/status')
      .then(r => r.json())
      .then(d => {
        if (d.showPopup && d.offer?.status === 'eligible') {
          setOffer(d.offer);
          setOpen(true);
        }
      })
      .catch(() => {});
  }, [status, session?.user?.id, session?.user?.role, pathname]);

  return (
    <AnimatePresence>
      {open && offer && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={handleDismiss}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-amber-400/40"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 px-6 pt-8 pb-6 text-center text-white relative">
              <button
                type="button"
                onClick={handleDismiss}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/20 hover:bg-black/30 flex items-center justify-center transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
                <Gift className="w-8 h-8 text-white" />
              </div>
              <div className="flex items-center justify-center gap-1.5 mb-2">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest opacity-90">Limited Offer</span>
                <Sparkles className="w-4 h-4" />
              </div>
              <h2 className="text-2xl font-black leading-tight mb-1">
                {offer.title || 'Early Bird Offer'}
              </h2>
              <p className="text-sm text-white/90 leading-relaxed max-w-xs mx-auto">
                {offer.subtitle || (
                  <>You&apos;re eligible for <strong>FREE {offer.planDisplayName}</strong> access!</>
                )}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-900 px-6 py-5 space-y-4">
              <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Plan</span>
                  <span className="font-bold text-gray-900 dark:text-white">{offer.planDisplayName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Duration</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">FREE · {offer.durationLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Slots left</span>
                  <span className="font-bold text-amber-600">{offer.slotsLeft} / {offer.limit}</span>
                </div>
              </div>

              <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                Claim now — chat, unlimited interests, contact details &amp; more. This popup won&apos;t show again.
              </p>

              <button
                type="button"
                onClick={handleClaim}
                disabled={claiming}
                className="w-full py-4 rounded-2xl font-bold text-base bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg hover:opacity-95 disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {claiming ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Activating…
                  </>
                ) : (
                  <>
                    <Crown className="w-5 h-5" />
                    Get Your Free Access
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                className="w-full py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                Maybe later
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
