'use client';
import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Crown, X, Sparkles, Users, Clock, ArrowRight } from 'lucide-react';

const SESSION_KEY = 'vd_eb_guest_popup_v1';

const SKIP_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/verify-email',
  '/google-verify',
  '/onboarding',
  '/admin',
  '/payment',
];

function shouldSkipPath(pathname) {
  if (!pathname) return true;
  return SKIP_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

export default function EarlyBirdGuestPopup() {
  const { status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [offer, setOffer] = useState(null);

  const dismiss = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(SESSION_KEY, 'dismissed');
    }
    setOpen(false);
  }, []);

  useEffect(() => {
    if (status === 'authenticated') return;
    if (shouldSkipPath(pathname || '')) return;
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem(SESSION_KEY)) return;

    const timer = setTimeout(() => {
      fetch('/api/early-bird/guest-offer', { cache: 'no-store' })
        .then((r) => r.json())
        .then((d) => {
          if (!d.offer?.show) return;
          sessionStorage.setItem(SESSION_KEY, 'shown');
          setOffer(d.offer);
          setOpen(true);
        })
        .catch(() => {});
    }, 1600);

    return () => clearTimeout(timer);
  }, [status, pathname]);

  const pctClaimed = offer?.limit
    ? Math.min(100, Math.round((offer.claimedCount / offer.limit) * 100))
    : 0;

  return (
    <AnimatePresence>
      {open && offer && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[190] flex items-center justify-center p-4 sm:p-6 bg-black/65 backdrop-blur-md"
          onClick={dismiss}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 28 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: 'spring', damping: 20, stiffness: 260 }}
            className="relative w-full max-w-lg rounded-[1.75rem] overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.45)] border border-amber-300/30"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400/20 via-transparent to-orange-600/10 pointer-events-none" />

            <div className="relative bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 px-6 sm:px-8 pt-10 pb-8 text-white text-center overflow-hidden">
              <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full blur-xl" />

              <button
                type="button"
                onClick={dismiss}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/25 hover:bg-black/40 flex items-center justify-center transition-colors z-10"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <motion.div
                initial={{ rotate: -8, scale: 0.8 }}
                animate={{ rotate: 0, scale: 1 }}
                className="w-20 h-20 rounded-2xl bg-white/25 backdrop-blur-sm flex items-center justify-center mx-auto mb-5 shadow-lg"
              >
                <Gift className="w-10 h-10 text-white drop-shadow" />
              </motion.div>

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-[11px] font-bold uppercase tracking-[0.2em] mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                Limited time
                <Sparkles className="w-3.5 h-3.5" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-black leading-tight mb-2 drop-shadow-sm">
                {offer.title || 'Free Premium Access'}
              </h2>
              <p className="text-sm sm:text-base text-white/95 leading-relaxed max-w-md mx-auto">
                {offer.subtitle || offer.message}
              </p>
            </div>

            <div className="relative bg-white dark:bg-gray-950 px-6 sm:px-8 py-6 sm:py-7 space-y-5">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800 p-3">
                  <Users className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                  <p className="text-lg font-black text-amber-700 dark:text-amber-300">{offer.slotsLeft}</p>
                  <p className="text-[10px] uppercase tracking-wide text-gray-500">Slots left</p>
                </div>
                <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800 p-3">
                  <Crown className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                  <p className="text-xs font-bold text-emerald-800 dark:text-emerald-200 leading-tight">{offer.planDisplayName}</p>
                  <p className="text-[10px] uppercase tracking-wide text-gray-500 mt-1">Plan</p>
                </div>
                <div className="rounded-2xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200/80 dark:border-violet-800 p-3">
                  <Clock className="w-5 h-5 text-violet-600 mx-auto mb-1" />
                  <p className="text-xs font-bold text-violet-800 dark:text-violet-200 leading-tight">{offer.durationLabel}</p>
                  <p className="text-[10px] uppercase tracking-wide text-gray-500 mt-1">Free</p>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                  <span>{offer.claimedCount} claimed</span>
                  <span>{offer.limit} total</span>
                </div>
                <div className="h-2.5 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pctClaimed}%` }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                  />
                </div>
                <p className="text-xs text-center text-amber-700 dark:text-amber-400 font-semibold mt-2">
                  Hurry — only {offer.slotsLeft} spots remaining!
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  dismiss();
                  router.push('/register');
                }}
                className="w-full py-4 rounded-2xl font-bold text-base bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white shadow-lg shadow-orange-500/30 hover:opacity-95 flex items-center justify-center gap-2"
              >
                Claim Your Free Access
                <ArrowRight className="w-5 h-5" />
              </button>

              <p className="text-center text-xs text-gray-500">
                Already registered?{' '}
                <Link href="/login" onClick={dismiss} className="text-amber-600 font-semibold hover:underline">
                  Sign in to claim
                </Link>
              </p>

              <button
                type="button"
                onClick={dismiss}
                className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
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
