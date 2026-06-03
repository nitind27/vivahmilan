'use client';
import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import SiteLoader from '@/components/SiteLoader';
import ProfileCard from '@/components/ProfileCard';
import SkeletonCard from '@/components/SkeletonCard';
import { shareProfile } from '@/components/ShareProfileButton';
import {
  Heart, Eye, MessageCircle, Bell, Star, Users, ChevronRight,
  Clock, Zap, Crown, Calendar, Shield, Search, Settings, Lock, User,
  TrendingUp, Sparkles, ArrowRight, CheckCircle, Percent, HandCoins, Share2, Bookmark
} from 'lucide-react';
import toast from 'react-hot-toast';
import EarlyBirdOfferCard from '@/components/EarlyBirdOfferCard';

// ── Countdown hook ────────────────────────────────────────────────────────────
function useCountdown(expiryISO) {
  const calc = useCallback(() => {
    if (!expiryISO) return null;
    const diff = new Date(expiryISO) - new Date();
    if (diff <= 0) return { expired: true, h: 0, m: 0, s: 0, totalMs: 0 };
    return {
      expired: false,
      h: Math.floor(diff / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
      totalMs: diff,
    };
  }, [expiryISO]);
  const [time, setTime] = useState(calc);
  useEffect(() => {
    if (!expiryISO) return;
    setTime(calc());
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, [expiryISO, calc]);
  return time;
}

function formatDashboardPlanLabel(premiumInfo, fallbackPlan = 'Premium') {
  if (premiumInfo?.isEarlyBird) {
    return premiumInfo.planDisplayName || premiumInfo.earlyBirdLabel || 'Early Bird — Free Full Access';
  }
  const raw = premiumInfo?.planDisplayName || premiumInfo?.plan || fallbackPlan;
  if (!raw || raw === 'EARLY_BIRD') return 'Early Bird — Free Full Access';
  return String(raw).replace(/_/g, ' ');
}

/** Gold welcome card — white text in light & dark (same look as dark mode). */
const WELCOME_ON_GOLD = {
  title: 'text-white',
  sub: 'text-white/90',
  muted: 'text-white/80',
  faint: 'text-white/75',
  panel: 'rounded-xl border border-white/20 bg-black/25',
  panelBorder: 'border-white/20',
};

function DashboardWelcomeCard({ name, profileComplete, photo, premiumInfo, freeTrialExpiry, isPremium, freeTrialActive }) {
  const isEarlyBird = premiumInfo?.isEarlyBird;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const greetEmoji = hour < 12 ? '🌅' : hour < 17 ? '☀️' : '🌙';
  const countdown = useCountdown(freeTrialExpiry);
  const pad = n => String(n).padStart(2, '0');

  const showPremium = premiumInfo?.isPremium || isPremium;
  const showTrial = !showPremium && freeTrialExpiry && freeTrialActive && countdown && !countdown.expired;

  const planLabel = formatDashboardPlanLabel(premiumInfo);
  const daysLeft = premiumInfo?.daysLeft ?? 0;
  const expiry = premiumInfo?.expiry;
  const isUrgent = showPremium && !isEarlyBird && daysLeft <= 2;
  const totalPlanDays = premiumInfo?.totalDays || 30;
  const premiumPct = showPremium
    ? (premiumInfo?.premiumPctLeft ?? Math.max(0, Math.min(100, Math.round((daysLeft / totalPlanDays) * 100))))
    : 0;
  const trialPct = showTrial && countdown ? Math.min(100, Math.round((countdown.totalMs / (24 * 3600000)) * 100)) : 0;

  const expiryLabel = expiry
    ? new Date(expiry).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  const profileMsg = profileComplete >= 100
    ? 'Your profile is fully complete — great job!'
    : profileComplete >= 70
      ? 'Almost done! Complete remaining details for better matches.'
      : 'Add more details to your profile to get better match suggestions.';

  const premiumDetail = isEarlyBird
    ? `Complimentary access until ${expiryLabel || 'expiry'} · ${daysLeft} days left`
    : isUrgent
      ? `Expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'} — renew to keep access`
      : expiryLabel
        ? `Active until ${expiryLabel}`
        : 'Your premium membership is active';

  const trialMsg = countdown
    ? `Trial ends in ${pad(countdown.h)}h ${pad(countdown.m)}m — upgrade to keep premium features.`
    : 'Your free trial is active. Upgrade to unlock all features.';

  const panel = (children) => (
    <div className={`mt-3 px-3 py-3 sm:px-4 ${WELCOME_ON_GOLD.panel}`}>{children}</div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="dashboard-welcome-card relative mb-6 overflow-hidden rounded-2xl shadow-lg ring-1 ring-black/10 dark:ring-white/10"
      style={{ background: 'linear-gradient(135deg, #6b5210 0%, #8B6914 38%, #C8A45C 72%, #A67C3D 100%)' }}
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-12 -left-8 h-44 w-44 rounded-full bg-black/15" />

      <div className="relative p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="relative shrink-0">
              <div className="h-14 w-14 overflow-hidden rounded-2xl border-2 border-white/60 bg-white/20 shadow-md sm:h-16 sm:w-16">
                <img src={photo || '/images/default-avatar.png'} alt={name} className="h-full w-full object-cover" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-[9px] font-bold text-white">
                ✓
              </span>
              {showPremium && (
                <span className={`absolute -left-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white ${isEarlyBird ? 'bg-emerald-600' : 'bg-violet-600'}`}>
                  <Crown className="h-3 w-3 fill-white text-white" />
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-xs font-medium leading-none ${WELCOME_ON_GOLD.sub}`}>{greetEmoji} {greeting}</p>
              <h1 className={`truncate text-xl font-black leading-tight sm:text-2xl ${WELCOME_ON_GOLD.title}`}>
                {name?.split(' ')[0]} 👋
              </h1>
              {!showPremium && !showTrial && (
                <p className={`mt-0.5 truncate text-xs ${WELCOME_ON_GOLD.muted}`}>Your perfect match is waiting!</p>
              )}
            </div>
          </div>

          {showPremium && (
            <div className={`flex shrink-0 items-center justify-between gap-3 rounded-xl px-3 py-2 sm:flex-col sm:items-end sm:text-right ${WELCOME_ON_GOLD.panel}`}>
              <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold text-white ${WELCOME_ON_GOLD.panelBorder} ${isEarlyBird ? 'bg-emerald-600/80' : 'bg-violet-600/80'}`}>
                <Crown className="h-3 w-3" /> {isEarlyBird ? 'Early Bird · FREE' : planLabel}
              </span>
              <p className={`text-2xl font-black leading-none tabular-nums sm:text-3xl ${WELCOME_ON_GOLD.title}`}>
                {daysLeft}
                <span className={`ml-1 text-xs font-semibold ${WELCOME_ON_GOLD.sub}`}>days left</span>
              </p>
            </div>
          )}

          {showTrial && (
            <div className={`flex shrink-0 items-center justify-between gap-3 rounded-xl px-3 py-2 sm:flex-col sm:items-end ${WELCOME_ON_GOLD.panel}`}>
              <span className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-amber-500/90 px-2.5 py-1 text-[11px] font-bold text-white">
                <Zap className="h-3 w-3 fill-white text-white" /> Free Trial
              </span>
              <p className={`text-lg font-bold tabular-nums ${WELCOME_ON_GOLD.title}`}>
                {pad(countdown.h)}:{pad(countdown.m)}:{pad(countdown.s)}
              </p>
            </div>
          )}
        </div>

        {showPremium && panel(
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${WELCOME_ON_GOLD.panelBorder} ${isEarlyBird ? 'bg-emerald-600/70' : 'bg-violet-600/70'}`}>
                <Crown className="h-5 w-5 fill-white/90 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-bold ${WELCOME_ON_GOLD.title}`}>
                  {isEarlyBird ? 'Early Bird — Full Free Access' : `${planLabel} Plan`}
                </p>
                <p className={`mt-0.5 text-xs leading-relaxed ${WELCOME_ON_GOLD.sub}`}>{premiumDetail}</p>
              </div>
              <span className={`shrink-0 text-right text-sm font-bold tabular-nums ${WELCOME_ON_GOLD.title}`}>
                {premiumPct}% <span className={`text-xs font-medium ${WELCOME_ON_GOLD.muted}`}>remaining</span>
              </span>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/25">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${premiumPct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={`h-2 rounded-full ${isEarlyBird ? 'bg-emerald-300' : isUrgent ? 'bg-red-300' : 'bg-violet-200'}`}
                />
              </div>
              {expiryLabel && (
                <span className={`flex shrink-0 items-center gap-0.5 text-[11px] font-medium ${WELCOME_ON_GOLD.muted}`}>
                  <Calendar className="h-3.5 w-3.5" /> {expiryLabel}
                </span>
              )}
            </div>
            <Link
              href="/premium"
              className="mt-3 flex w-full items-center justify-center rounded-xl border border-white/30 bg-white/20 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/30 sm:w-auto sm:px-6"
            >
              {isEarlyBird ? 'View Benefits' : isUrgent ? 'Renew Plan' : 'Manage Plan'}
            </Link>
          </>
        )}

        {showTrial && panel(
          <>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-amber-500/50">
                <Zap className="h-5 w-5 fill-white text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-bold ${WELCOME_ON_GOLD.title}`}>Free Trial Remaining</p>
                <p className={`text-xs tabular-nums ${WELCOME_ON_GOLD.sub}`}>{trialPct}% left · {trialMsg}</p>
              </div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/25">
              <div className="h-2 rounded-full bg-amber-300 transition-all" style={{ width: `${trialPct}%` }} />
            </div>
            <Link href="/premium" className="mt-3 flex w-full items-center justify-center rounded-xl bg-white py-2.5 text-sm font-bold text-[#6b5210] hover:bg-white/95">
              Upgrade Now
            </Link>
          </>
        )}

        {profileComplete < 100 && panel(
          <>
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className={`text-sm font-bold ${WELCOME_ON_GOLD.title}`}>Profile Completion</p>
              <span className={`text-sm font-bold tabular-nums ${WELCOME_ON_GOLD.title}`}>{profileComplete}%</span>
            </div>
            <p className={`mb-2 text-xs ${WELCOME_ON_GOLD.sub}`}>{profileMsg}</p>
            <div className="mb-3 h-2 overflow-hidden rounded-full bg-white/25">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${profileComplete}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-2 rounded-full bg-emerald-300"
              />
            </div>
            <Link href="/profile/edit" className="flex w-full items-center justify-center rounded-xl border border-white/30 bg-white/20 py-2.5 text-sm font-bold text-white hover:bg-white/30">
              Complete Profile
            </Link>
          </>
        )}

        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <Link href="/matches" className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-sm font-bold text-[#6b5210] shadow-sm hover:bg-white/95">
            <Heart className="h-4 w-4 fill-[#6b5210]" />
            Matches
          </Link>
          <Link href="/search" className={`flex min-h-[44px] items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/10 ${WELCOME_ON_GOLD.panelBorder} bg-white/15`}>
            <Search className="h-4 w-4" />
            Search
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ── Animated Stat Card ────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color, bg, href, badge, delay = 0 }) {
  return (
    <motion.a href={href}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 200 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="block bg-white dark:bg-vd-bg-card rounded-2xl p-4 sm:p-5 border border-vd-border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group cursor-pointer">
      {/* Hover glow */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity ${bg}`} />
      <div className={`w-11 h-11 ${bg} rounded-2xl flex items-center justify-center mb-3`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <motion.p className="text-2xl sm:text-3xl font-black text-vd-text-heading"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: delay + 0.2 }}>
        {value}
      </motion.p>
      <p className="text-vd-text-sub text-xs sm:text-sm mt-0.5">{label}</p>
      {badge && <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-vd-primary rounded-full animate-pulse" />}
    </motion.a>
  );
}

// ── Animated Stat Card ────────────────────────────────────────────────────────
const CONFETTI_COLORS = ['#C8A45C','#E5C88B','#E8B4B8','#D4AF37','#A67C3D','#E6C97A'];
function BirthdayCard({ name }) {
  const [show, setShow] = useState(true);
  if (!show) return null;
  const pieces = Array.from({ length: 16 }, (_, i) => ({
    id: i, color: CONFETTI_COLORS[i % 6],
    x: Math.random() * 100, delay: Math.random() * 1.5,
    duration: 2 + Math.random() * 2, size: 6 + Math.random() * 8,
  }));
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }} transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="relative rounded-3xl p-6 mb-6 overflow-hidden text-white"
        style={{ background: 'linear-gradient(135deg, #C8A45C, #E5C88B)' }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl">
          {pieces.map(p => (
            <motion.div key={p.id} className="absolute rounded-sm"
              style={{ left: `${p.x}%`, top: '-10px', width: p.size, height: p.size * 0.6, backgroundColor: p.color }}
              animate={{ y: ['0%', '110%'], opacity: [1, 1, 0] }}
              transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'linear' }} />
          ))}
        </div>
        <div className="relative flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex gap-1 text-2xl mb-3">
              {['🎂','🎉','🎊','✨','🎈'].map((e, i) => (
                <motion.span key={i} animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 1.2, delay: i * 0.15, repeat: Infinity }}>
                  {e}
                </motion.span>
              ))}
            </div>
            <motion.h2 className="text-2xl font-black mb-1"
              animate={{ scale: [1, 1.03, 1] }} transition={{ duration: 2, repeat: Infinity }}>
              Happy Birthday, {name?.split(' ')[0]}! 🎂
            </motion.h2>
            <p className="text-white/85 text-sm">May this year bring you your perfect life partner! 💕</p>
          </div>
          <motion.div className="text-6xl flex-shrink-0"
            animate={{ rotate: [-5, 5, -5], scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}>🎂</motion.div>
        </div>
        <button onClick={() => setShow(false)}
          className="absolute top-3 right-3 w-7 h-7 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-sm transition-colors">
          ✕
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Quick Actions ─────────────────────────────────────────────────────────────
const QA_ACCENT = {
  rose:    { wrap: 'bg-rose-50 border-rose-100 dark:bg-rose-950/35 dark:border-rose-800/40',       icon: 'text-rose-600 dark:text-rose-400',       ring: 'group-hover:ring-rose-200/80 dark:group-hover:ring-rose-800/50' },
  amber:   { wrap: 'bg-amber-50 border-amber-100 dark:bg-amber-950/35 dark:border-amber-800/40',     icon: 'text-amber-700 dark:text-amber-400',     ring: 'group-hover:ring-amber-200/80 dark:group-hover:ring-amber-800/50' },
  gold:    { wrap: 'bg-vd-accent-soft border-vd-border dark:bg-vd-primary/10 dark:border-vd-primary/25', icon: 'text-vd-primary-dark dark:text-vd-primary', ring: 'group-hover:ring-vd-primary/35' },
  teal:    { wrap: 'bg-teal-50 border-teal-100 dark:bg-teal-950/35 dark:border-teal-800/40',       icon: 'text-teal-700 dark:text-teal-400',       ring: 'group-hover:ring-teal-200/80 dark:group-hover:ring-teal-800/50' },
  indigo:  { wrap: 'bg-indigo-50 border-indigo-100 dark:bg-indigo-950/35 dark:border-indigo-800/40', icon: 'text-indigo-600 dark:text-indigo-400',   ring: 'group-hover:ring-indigo-200/80 dark:group-hover:ring-indigo-800/50' },
  sky:     { wrap: 'bg-sky-50 border-sky-100 dark:bg-sky-950/35 dark:border-sky-800/40',           icon: 'text-sky-700 dark:text-sky-400',         ring: 'group-hover:ring-sky-200/80 dark:group-hover:ring-sky-800/50' },
  emerald: { wrap: 'bg-emerald-50 border-emerald-100 dark:bg-emerald-950/35 dark:border-emerald-800/40', icon: 'text-emerald-700 dark:text-emerald-400', ring: 'group-hover:ring-emerald-200/80 dark:group-hover:ring-emerald-800/50' },
  stone:   { wrap: 'bg-stone-100 border-stone-200 dark:bg-stone-900/50 dark:border-stone-700/50',    icon: 'text-stone-600 dark:text-stone-400',     ring: 'group-hover:ring-stone-300/80 dark:group-hover:ring-stone-600/50' },
  lime:    { wrap: 'bg-lime-50 border-lime-100 dark:bg-lime-950/35 dark:border-lime-800/40',       icon: 'text-lime-800 dark:text-lime-400',       ring: 'group-hover:ring-lime-200/80 dark:group-hover:ring-lime-800/50' },
  fuchsia: { wrap: 'bg-fuchsia-50 border-fuchsia-100 dark:bg-fuchsia-950/35 dark:border-fuchsia-800/40', icon: 'text-fuchsia-700 dark:text-fuchsia-400', ring: 'group-hover:ring-fuchsia-200/80 dark:group-hover:ring-fuchsia-800/50' },
  red:     { wrap: 'bg-red-50 border-red-100 dark:bg-red-950/35 dark:border-red-800/40',           icon: 'text-red-600 dark:text-red-400',         ring: 'group-hover:ring-red-200/80 dark:group-hover:ring-red-800/50' },
};

function QuickActionCard({ icon: Icon, label, sub, href, accent = 'gold', featured = false, badge, delay = 0, onClick, disabled, busyLabel }) {
  const a = QA_ACCENT[accent] || QA_ACCENT.gold;
  const baseClass = [
    'group relative flex w-full text-left transition-all duration-200',
    'rounded-2xl border border-vd-border bg-vd-bg-card',
    'ring-1 ring-transparent hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99]',
    a.ring,
    featured ? 'flex-col justify-between p-4 sm:p-5 min-h-[7.5rem]' : 'items-center gap-3 p-3 sm:p-3.5',
    disabled ? 'opacity-60 pointer-events-none' : '',
  ].join(' ');

  const inner = (
    <>
      <div className={`flex shrink-0 items-center justify-center rounded-xl border ${a.wrap} ${featured ? 'h-12 w-12 sm:h-14 sm:w-14' : 'h-10 w-10'}`}>
        <Icon className={`${featured ? 'h-6 w-6 sm:h-7 sm:w-7' : 'h-5 w-5'} ${a.icon}`} strokeWidth={2} />
      </div>
      <div className={`min-w-0 flex-1 ${featured ? 'mt-4' : ''}`}>
        <div className="flex items-start justify-between gap-2">
          <p className={`font-bold text-vd-text-heading leading-tight ${featured ? 'text-base sm:text-lg' : 'text-sm'}`}>
            {busyLabel || label}
          </p>
          {badge > 0 ? (
            <span className="shrink-0 min-w-[1.25rem] rounded-full bg-vd-primary px-1.5 py-0.5 text-center text-[10px] font-bold text-white">
              {badge > 99 ? '99+' : badge}
            </span>
          ) : null}
        </div>
        {sub ? <p className={`mt-0.5 text-vd-text-sub line-clamp-1 ${featured ? 'text-xs sm:text-sm' : 'text-[11px]'}`}>{sub}</p> : null}
        {featured ? (
          <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-vd-primary group-hover:gap-1.5 transition-all">
            Open <ArrowRight className="h-3.5 w-3.5" />
          </span>
        ) : null}
      </div>
      {!featured ? (
        <ChevronRight className="h-4 w-4 shrink-0 text-vd-text-light group-hover:text-vd-primary transition-colors" />
      ) : null}
    </>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      className={featured ? 'min-w-0' : ''}
    >
      {onClick ? (
        <button type="button" onClick={onClick} disabled={disabled} className={baseClass}>
          {inner}
        </button>
      ) : (
        <Link href={href} className={baseClass}>
          {inner}
        </Link>
      )}
    </motion.div>
  );
}

function QuickActionsPanel({ actions, userId, userName, delayStart = 0.4 }) {
  const [sharing, setSharing] = useState(false);
  const featured = actions.filter(a => a.featured);
  const regular = actions.filter(a => !a.featured);

  const handleShare = async () => {
    if (!userId) return;
    setSharing(true);
    try {
      await shareProfile(userId, userName);
    } catch (err) {
      if (err?.name !== 'AbortError') toast.error(err.message || 'Share failed');
    } finally {
      setSharing(false);
    }
  };

  const shareAction = {
    icon: Share2,
    label: 'Share Profile',
    sub: 'Send your profile link',
    accent: 'teal',
    onClick: handleShare,
    disabled: sharing,
    busyLabel: sharing ? 'Sharing…' : undefined,
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delayStart }}
      className="mb-6"
    >
      <div className="rounded-3xl border border-vd-border bg-vd-bg-section dark:bg-vd-bg-card shadow-sm overflow-hidden">
        <div className="flex flex-col gap-1 border-b border-vd-border px-4 py-4 sm:px-5 sm:py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl vd-gradient-gold shadow-sm">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-vd-text-heading sm:text-xl">Quick Actions</h2>
              <p className="text-xs text-vd-text-sub sm:text-sm">Shortcuts to everything you need</p>
            </div>
          </div>
          <span className="hidden text-[11px] font-medium text-vd-text-light sm:inline">Tap to open</span>
        </div>

        <div className="p-3 sm:p-4 sm:pt-3 space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {featured.map((action, i) => (
              <QuickActionCard key={action.label} {...action} delay={delayStart + i * 0.05} />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {regular.map((action, i) => (
              <QuickActionCard key={action.label} {...action} delay={delayStart + 0.12 + i * 0.03} />
            ))}
            <QuickActionCard
              {...shareAction}
              delay={delayStart + 0.12 + regular.length * 0.03}
            />
          </div>
        </div>
      </div>
    </motion.section>
  );
}

// ── Affiliate Dashboard Card ──────────────────────────────────────────────────
function AffiliateCard({ agent }) {
  if (!agent) return null;
  const copyCode = () => {
    navigator.clipboard.writeText(agent.referralCode);
    toast.success('Referral code copied!');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-6 mb-6 overflow-hidden relative shadow-lg"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', border: '1px solid #4f46e540' }}>
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
      
      <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 text-indigo-400">
            <HandCoins className="w-5 h-5" />
            <h2 className="font-black tracking-wide uppercase text-xs">Affiliate Partner Dashboard</h2>
          </div>
          <h3 className="text-2xl font-black text-white mb-2 leading-tight">Earn {agent.commissionPct}% on every premium sale!</h3>
          <p className="text-sm text-indigo-200/80 mb-5 max-w-md">
            Share your unique referral code with others. When they buy a premium plan using your code, you earn a direct commission!
          </p>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-black/40 border border-indigo-500/30 rounded-xl p-1 pl-4 pr-1 flex items-center gap-3">
              <span className="font-mono text-lg font-bold text-white tracking-widest">{agent.referralCode}</span>
              <button onClick={copyCode} className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-lg transition-colors">
                <Share2 className="w-4 h-4" />
              </button>
            </div>
            <span className="text-xs text-indigo-300">Share this code!</span>
          </div>
        </div>

        <div className="flex-shrink-0 w-full md:w-auto">
          <div className="bg-black/30 border border-indigo-500/20 rounded-2xl p-5 backdrop-blur-sm min-w-[200px]">
            <p className="text-indigo-300 text-xs font-bold uppercase tracking-wider mb-1">Total Earnings</p>
            <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300 mb-4">
              ₹{Number(agent.totalEarnings || 0).toLocaleString()}
            </p>
            <div className="flex items-center gap-2 text-xs text-indigo-200">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Commission: {agent.commissionPct}%
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [matches, setMatches]           = useState([]);
  const [interests, setInterests]       = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [profile, setProfile]           = useState(null);
  const [unreadChat, setUnreadChat]     = useState(0);
  const [shortlistCount, setShortlistCount] = useState(0);
  const [viewCount, setViewCount]           = useState(0);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [reminders, setReminders]       = useState({ premiumInfo: null, birthdayInfo: null });

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') router.push('/admin');
  }, [status, session, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    const safeFetch = (url, opts) => fetch(url, opts).then(r => r.ok ? r.json() : null).catch(() => null);
    Promise.all([
      safeFetch('/api/matches?limit=6'),
      safeFetch('/api/interest?type=received&limit=20'),
      safeFetch('/api/notifications'),
      safeFetch('/api/profile'),
      safeFetch('/api/chat/unread'),
      safeFetch('/api/reminders', { method: 'POST' }),
      safeFetch('/api/shortlist'),
      safeFetch('/api/profile-views'),
      safeFetch('/api/recently-viewed?limit=6'),
    ]).then(([m, i, n, p, u, rem, sl, views, recent]) => {
      setMatches(m?.users || []);
      setInterests(i || []);
      setNotifications(n?.notifications || []);
      setProfile(p);
      setUnreadChat(u?.total || 0);
      setShortlistCount(Array.isArray(sl) ? sl.length : 0);
      setViewCount(views?.total ?? 0);
      setRecentlyViewed(recent?.users || []);
      setReminders(rem || { premiumInfo: null, birthdayInfo: null });
      setLoading(false);
      fetch('/api/saved-searches/check-alerts', { method: 'POST' }).catch(() => {});
    });
  }, [status]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-vd-bg">
        <Navbar />
        <SiteLoader message="Loading dashboard…" fullScreen={false} size="lg" className="pt-20 min-h-[70vh]" />
      </div>
    );
  }

  const profileComplete  = profile?.profile?.profileComplete || 0;
  const pendingInterests = interests.filter(i => i.status === 'PENDING').length;
  const userPhoto        = profile?.image || profile?.photos?.[0]?.url || null;

  const stats = [
    { icon: Heart,         label: 'Interests',      value: interests.length > 0 ? interests.length : '—',  color: 'text-vd-primary',   bg: 'bg-vd-accent-soft dark:bg-vd-accent/20',   href: '/interests',  badge: pendingInterests > 0 },
    { icon: Eye,           label: 'Profile Views',  value: viewCount > 0 ? viewCount : '—',                   color: 'text-teal-500',     bg: 'bg-teal-50 dark:bg-teal-900/20',         href: '/views',      badge: viewCount > 0 },
    { icon: MessageCircle, label: 'Unread Msgs',    value: unreadChat > 0 ? unreadChat : '—',               color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20', href: '/chat',       badge: unreadChat > 0 },
    { icon: Users,         label: 'Matches',        value: matches.length > 0 ? matches.length : '—',       color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-900/20',    href: '/matches' },
  ];

  const unreadNotif = notifications.filter(n => !n.isRead).length;
  const quickActions = [
    { icon: Heart, label: 'Find Matches', sub: 'Profiles picked for you', href: '/matches', accent: 'rose', featured: true },
    { icon: Search, label: 'Search Profiles', sub: 'Filters, city & kundali', href: '/search', accent: 'amber', featured: true },
    { icon: MessageCircle, label: 'Messages', sub: 'Your conversations', href: '/chat', accent: 'indigo', badge: unreadChat },
    { icon: Crown, label: 'Premium', sub: 'Plans & benefits', href: '/premium', accent: 'gold' },
    { icon: Eye, label: 'Profile Views', sub: 'Who viewed you', href: '/views', accent: 'teal', badge: viewCount > 0 ? viewCount : 0 },
    { icon: Bookmark, label: 'Shortlist', sub: 'Saved profiles', href: '/shortlist', accent: 'sky', badge: shortlistCount > 0 ? shortlistCount : 0 },
    { icon: Bell, label: 'Notifications', sub: 'Alerts & updates', href: '/notifications', accent: 'emerald', badge: unreadNotif },
    { icon: Settings, label: 'Settings', sub: 'Account & privacy', href: '/settings', accent: 'stone' },
    { icon: HandCoins, label: 'Refer & Earn', sub: 'Invite friends', href: '/refer', accent: 'lime' },
    { icon: Sparkles, label: 'Success Story', sub: 'Share your journey', href: '/share-story', accent: 'fuchsia' },
    { icon: Shield, label: 'Safety Center', sub: 'Tips & reporting', href: '/safety', accent: 'red' },
  ];

  return (
    <div className="min-h-screen bg-vd-bg">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12">

        {/* Birthday */}
        {reminders.birthdayInfo?.isBirthday && <BirthdayCard name={session?.user?.name} />}

        {session?.user?.isFamilyLogin && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
            <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
              👨‍👩‍👧 Family Login — browsing {session.user.ownerName ? `${session.user.ownerName}'s` : 'member'} profile
            </p>
            <p className="text-xs text-blue-600/80 dark:text-blue-300/80 mt-1">Read-only mode. Search & view profiles — interests and chat are disabled.</p>
          </motion.div>
        )}

        {/* Unified welcome + premium/trial card */}
        <DashboardWelcomeCard
          name={session?.user?.name}
          profileComplete={profileComplete}
          photo={userPhoto}
          premiumInfo={reminders.premiumInfo}
          freeTrialExpiry={session?.user?.freeTrialExpiry}
          isPremium={session?.user?.isPremium}
          freeTrialActive={session?.user?.freeTrialActive}
        />

        {!reminders.premiumInfo?.isEarlyBird && <EarlyBirdOfferCard className="mb-6" />}

        {/* Affiliate Dashboard */}
        <AffiliateCard agent={profile?.agent} />

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {stats.map((s, i) => <StatCard key={s.label} {...s} delay={i * 0.08} />)}
        </div>

        <QuickActionsPanel
          actions={quickActions}
          userId={session?.user?.id}
          userName={session?.user?.name}
        />

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Matches */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-vd-primary" /> Recommended Matches
              </h2>
              <Link href="/matches" className="text-vd-primary text-sm font-medium flex items-center gap-1 hover:text-vd-primary-dark transition-colors">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            {matches.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="bg-vd-bg-section dark:bg-vd-bg-card rounded-3xl p-10 text-center border border-vd-border">
                <div className="text-5xl mb-3">💑</div>
                <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">No matches yet</p>
                <p className="text-gray-400 text-sm mb-4">Complete your profile to get better matches</p>
                <Link href="/matches" className="vd-gradient-gold text-white px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
                  Browse Profiles
                </Link>
              </motion.div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {matches.map((u, i) => <ProfileCard key={u.id} user={u} index={i} />)}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Pending interests */}
            {pendingInterests > 0 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
                className="bg-vd-bg-section dark:bg-vd-bg-card rounded-2xl p-5 border border-vd-border shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Heart className="w-4 h-4 text-vd-primary fill-vd-primary" /> Pending Interests
                  </h3>
                  <span className="vd-gradient-gold text-white text-xs px-2.5 py-1 rounded-full font-semibold">{pendingInterests}</span>
                </div>
                <div className="space-y-2">
                  {interests.filter(i => i.status === 'PENDING').slice(0, 3).map(interest => (
                    <Link key={interest.id} href={`/profile/${interest.sender.id}`}
                      className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 p-2.5 rounded-xl transition-colors group">
                      <div className="w-10 h-10 rounded-full vd-gradient-gold flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {interest.sender.name?.[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm truncate text-gray-900 dark:text-white">{interest.sender.name}</p>
                        <p className="text-xs text-gray-400 truncate">{interest.sender.profile?.city || 'Location not set'}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-vd-primary transition-colors flex-shrink-0" />
                    </Link>
                  ))}
                </div>
                <Link href="/interests" className="flex items-center justify-center gap-1 text-vd-primary text-sm font-semibold mt-3 hover:text-vd-primary-dark transition-colors">
                  View all <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </motion.div>
            )}

            {recentlyViewed.length > 0 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}
                className="bg-vd-bg-section dark:bg-vd-bg-card rounded-2xl p-5 border border-vd-border shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-vd-primary" /> Recently Viewed
                  </h3>
                </div>
                <div className="space-y-2">
                  {recentlyViewed.slice(0, 5).map(u => (
                    <Link key={u.id} href={`/profile/${u.id}`}
                      className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 p-2.5 rounded-xl transition-colors group">
                      <div className="w-10 h-10 rounded-full vd-gradient-gold flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden">
                        {u.photos?.[0]?.url ? (
                          <img src={u.photos[0].url} alt="" className="w-full h-full object-cover" />
                        ) : u.name?.[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm truncate text-gray-900 dark:text-white">{u.name}</p>
                        <p className="text-xs text-gray-400 truncate">{u.profile?.city || '—'}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-vd-primary flex-shrink-0" />
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Recent Activity */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
              className="bg-vd-bg-section dark:bg-vd-bg-card rounded-2xl p-5 border border-vd-border shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Bell className="w-4 h-4 text-vd-primary" /> Recent Activity
                </h3>
                <Link href="/notifications" className="text-xs text-vd-primary hover:text-vd-primary-dark">See all</Link>
              </div>
              {notifications.length === 0 ? (
                <div className="text-center py-6">
                  <Bell className="w-8 h-8 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No activity yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.slice(0, 4).map(n => (
                    <div key={n.id} className={`p-3 rounded-xl text-sm transition-colors ${!n.isRead ? 'bg-vd-accent-soft dark:bg-vd-accent/10 border border-vd-border' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                      <p className="font-semibold text-gray-900 dark:text-white text-xs">{n.title}</p>
                      <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{n.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Premium upsell */}
            {!session?.user?.isPremium && !session?.user?.freeTrialActive && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="group relative overflow-hidden rounded-2xl border border-vd-border bg-vd-bg-section dark:bg-vd-bg-card shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="absolute inset-x-0 top-0 h-1 vd-gradient-gold" />
                <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-vd-primary/10 blur-2xl pointer-events-none" />

                <div className="relative p-5">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-11 h-11 rounded-xl vd-gradient-gold flex items-center justify-center shadow-md shadow-vd-primary/25 shrink-0">
                      <Crown className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-vd-primary mb-0.5">Premium</p>
                      <h3 className="font-bold text-gray-900 dark:text-white text-base leading-snug">
                        Find your match faster
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Chat freely, see contacts & rise in search
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {[
                      { icon: Heart, label: 'Unlimited interests' },
                      { icon: MessageCircle, label: 'Direct chat' },
                      { icon: Eye, label: 'View contacts' },
                      { icon: TrendingUp, label: 'Profile boost' },
                    ].map(({ icon: Icon, label }) => (
                      <div
                        key={label}
                        className="flex items-center gap-2 rounded-xl bg-vd-bg-alt/80 dark:bg-vd-bg/60 border border-vd-border/60 px-2.5 py-2"
                      >
                        <span className="w-7 h-7 rounded-lg bg-vd-primary/15 flex items-center justify-center shrink-0">
                          <Icon className="w-3.5 h-3.5 text-vd-primary" />
                        </span>
                        <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300 leading-tight">{label}</span>
                      </div>
                    ))}
                  </div>

                  <Link
                    href="/premium"
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl vd-gradient-gold text-white text-sm font-bold hover:opacity-90 transition-opacity shadow-md shadow-vd-primary/20"
                  >
                    Explore plans
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
