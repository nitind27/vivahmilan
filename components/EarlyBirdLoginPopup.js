'use client';
import { useEffect, useState, useCallback } from 'react';
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

function sessionKey(userId) {
  return `vd_eb_popup_sess_${userId}`;
}

function shouldSkipPath(pathname) {
  if (!pathname) return true;
  return SKIP_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));
}

export default function EarlyBirdLoginPopup() {
  const { data: session, status, update } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [offer, setOffer] = useState(null);
  const [claiming, setClaiming] = useState(false);

  const markDismissedThisSession = useCallback(() => {
    const uid = session?.user?.id;
    if (uid && typeof window !== 'undefined') {
      sessionStorage.setItem(sessionKey(uid), 'dismissed');
    }
    setOpen(false);
  }, [session?.user?.id]);

  const markClaimedPermanent = useCallback(async () => {
    const uid = session?.user?.id;
    if (uid && typeof window !== 'undefined') {
      sessionStorage.setItem(sessionKey(uid), 'claimed');
    }
    try {
      await fetch('/api/early-bird/popup-seen', { method: 'POST' });
    } catch { /* ignore */ }
    setOpen(false);
  }, [session?.user?.id]);

  const checkAndShowPopup = useCallback(() => {
    if (status !== 'authenticated' || !session?.user?.id) return;
    if (session.user.role === 'ADMIN') return;
    if (shouldSkipPath(pathname || '')) return;

    const uid = session.user.id;
    const key = sessionKey(uid);

    if (typeof window !== 'undefined') {
      localStorage.removeItem(`vd_eb_popup_${uid}`);
      const sess = sessionStorage.getItem(key);
      if (sess === 'dismissed' || sess === 'claimed' || sess === 'shown') return;
    }

    fetch('/api/early-bird/status', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => {
        const eligible = d.offer?.status === 'eligible' || (d.showPopup && d.offer?.canClaim);
        if (!eligible) return;
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(key, 'shown');
        }
        setOffer(d.offer);
        setOpen(true);
      })
      .catch(() => {});
  }, [status, session?.user?.id, session?.user?.role, pathname]);

  useEffect(() => {
    if (status !== 'authenticated') return;

    checkAndShowPopup();
    const t1 = setTimeout(checkAndShowPopup, 800);
    const t2 = setTimeout(checkAndShowPopup, 2000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [status, session?.user?.id, session?.user?.role, pathname, checkAndShowPopup]);

  const handleClaim = async () => {
    setClaiming(true);
    try {
      const res = await fetch('/api/early-bird/claim', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Could not claim offer');
        if (data.code === 'ALREADY_ACTIVE') await markClaimedPermanent();
        if (data.code === 'SOLD_OUT') markDismissedThisSession();
        return;
      }
      toast.success(data.message || 'Free access activated!');
      await markClaimedPermanent();
      await update?.({ isPremium: true });
      window.location.reload();
    } catch {
      toast.error('Something went wrong');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <AnimatePresence>
      {open && offer && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={markDismissedThisSession}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[#E8DCC8] bg-white shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="relative bg-[#F8F1E3] px-6 pb-5 pt-7 text-center">
              <button
                type="button"
                onClick={markDismissedThisSession}
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-[#E8DCC8] bg-white text-[#6E6254]"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
              <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#A67C3D]">
                <Sparkles className="h-3.5 w-3.5" />
                No payment
              </p>
              <h2 className="mt-2 font-display text-2xl font-semibold leading-tight text-[#2C2416]">
                {offer.title || 'Free premium access'}
              </h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[#6E6254]">
                {offer.subtitle || offer.message}
              </p>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-2xl border border-[#E8DCC8] bg-[#FFFCF7] px-2 py-3">
                  <Crown className="mx-auto h-4 w-4 text-[#8F6B2E]" />
                  <p className="mt-1 text-xs font-semibold leading-tight text-[#2C2416]">{offer.planDisplayName}</p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-wide text-[#8A7A68]">Plan</p>
                </div>
                <div className="rounded-2xl border border-[#E8DCC8] bg-[#FFFCF7] px-2 py-3">
                  <Gift className="mx-auto h-4 w-4 text-[#8F6B2E]" />
                  <p className="mt-1 text-xs font-semibold text-[#2C2416]">{offer.durationLabel}</p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-wide text-[#8A7A68]">Free</p>
                </div>
                <div className="rounded-2xl border border-[#E8DCC8] bg-[#FFFCF7] px-2 py-3">
                  <Sparkles className="mx-auto h-4 w-4 text-[#8F6B2E]" />
                  <p className="mt-1 text-xs font-semibold text-[#2C2416]">{offer.slotsLeft} left</p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-wide text-[#8A7A68]">of {offer.limit}</p>
                </div>
              </div>

              <ul className="space-y-1.5 text-sm text-[#5C4A32]">
                <li>Chat, contacts, and interests open without paying.</li>
                <li>Access stays on for {offer.durationLabel}, managed from your account.</li>
                <li>{offer.claimedCount} of {offer.limit} places are already taken.</li>
              </ul>

              <button
                type="button"
                onClick={handleClaim}
                disabled={claiming}
                className="vd-gradient-gold flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-semibold text-white disabled:opacity-70"
              >
                {claiming ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Activating…
                  </>
                ) : (
                  <>
                    <Crown className="h-4 w-4" />
                    Activate free access
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={markDismissedThisSession}
                className="w-full py-1 text-sm text-[#8A7A68]"
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
