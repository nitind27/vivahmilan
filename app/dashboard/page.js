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

// ── Unified Welcome + Membership Card ───────────────────────────────────────────
function DashboardWelcomeCard({ name, profileComplete, photo, premiumInfo, freeTrialExpiry, isPremium, freeTrialActive }) {
  const isEarlyBird = premiumInfo?.isEarlyBird;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const greetEmoji = hour < 12 ? '🌅' : hour < 17 ? '☀️' : '🌙';
  const countdown = useCountdown(freeTrialExpiry);
  const pad = n => String(n).padStart(2, '0');

  const showPremium = premiumInfo?.isPremium || isPremium;
  const showTrial = !showPremium && freeTrialExpiry && freeTrialActive && countdown && !countdown.expired;

  const plan = premiumInfo?.plan || 'GOLD';
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

  const premiumMsg = isEarlyBird
    ? `🎉 Early Bird Offer — ${plan} full access FREE until ${expiryLabel || 'expiry'}. (${daysLeft} days left)`
    : isUrgent
      ? `Your ${plan} plan expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'} — renew now to keep access.`
      : expiryLabel
        ? `Your ${plan} plan is active until ${expiryLabel}.`
        : `Your ${plan} premium plan is active.`;

  const trialMsg = countdown
    ? `Trial ends in ${pad(countdown.h)}h ${pad(countdown.m)}m — upgrade to keep premium features.`
    : 'Your free trial is active. Upgrade to unlock all features.';

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative rounded-2xl overflow-hidden mb-6 shadow-lg"
      style={{ background: 'linear-gradient(135deg, #8B6914 0%, #C8A45C 45%, #A67C3D 100%)' }}
    >
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none" style={{ background: 'rgba(255,255,255,0.1)' }} />
      <div className="absolute -bottom-12 -left-8 w-44 h-44 rounded-full pointer-events-none" style={{ background: 'rgba(0,0,0,0.06)' }} />

      <div className="relative p-4 sm:p-5">
        {/* Row 1 — avatar + greeting + premium days */}
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 border-white/50 shadow-md bg-white/20">
              <img src={photo || '/images/default-avatar.png'} alt={name} className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-emerald-400 rounded-full border-2 border-white flex items-center justify-center">
              <span className="text-[9px] text-white font-bold">✓</span>
            </div>
            {showPremium && (
              <div className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-violet-600 border-2 border-white flex items-center justify-center">
                <Crown className="w-3 h-3 text-white fill-white" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white/80 leading-none mb-0.5">{greetEmoji} {greeting}</p>
            <h1 className="text-xl sm:text-2xl font-black text-white leading-tight truncate">
              {name?.split(' ')[0]} 👋
            </h1>
            {!showPremium && !showTrial && (
              <p className="text-xs text-white/75 mt-0.5 truncate">Your perfect match is waiting!</p>
            )}
          </div>

          {showPremium && (
            <div className="shrink-0 text-right">
              <p className="text-[10px] text-white/65 leading-none mb-0.5">
                {isEarlyBird ? 'Early Bird FREE' : 'Plan expires in'}
              </p>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white border border-white/20 ${isEarlyBird ? 'bg-emerald-600/50' : 'bg-violet-600/50'}`}>
                <Crown className="w-3 h-3" /> {isEarlyBird ? 'FREE' : plan}
              </span>
              <p className="text-2xl font-black text-white leading-none mt-1">
                {daysLeft}<span className="text-xs font-semibold text-white/70 ml-0.5">days left</span>
              </p>
            </div>
          )}

          {showTrial && (
            <div className="shrink-0 text-right">
              <p className="text-[10px] text-white/65 leading-none mb-0.5">Trial ends in</p>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-yellow-500/40 border border-white/20">
                <Zap className="w-3 h-3 fill-yellow-200 text-yellow-200" /> Free Trial
              </span>
              <p className="text-sm font-bold text-white tabular-nums mt-1">
                {pad(countdown.h)}:{pad(countdown.m)}:{pad(countdown.s)}
              </p>
            </div>
          )}
        </div>

        {/* Premium validity progress */}
        {showPremium && (
          <div className="mt-3 rounded-xl bg-black/15 border border-white/15 px-3 py-2.5">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-violet-600/40 border border-white/15 flex items-center justify-center shrink-0 mt-0.5">
                <Crown className="w-4 h-4 text-white fill-white/80" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <p className="text-xs font-bold text-white">
                    {isEarlyBird ? '🎉 Early Bird — Full Free Access' : 'Premium Plan Validity'}
                  </p>
                  <span className="text-xs font-bold text-white tabular-nums shrink-0">{premiumPct}% left</span>
                </div>
                <p className="text-[10px] text-white/70 leading-snug mb-2">{premiumMsg}</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-full h-2 bg-white/20 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${premiumPct}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={`h-2 rounded-full ${isUrgent ? 'bg-red-300' : 'bg-violet-200'}`}
                    />
                  </div>
                  {expiryLabel && (
                    <span className="text-[10px] text-white/60 shrink-0 flex items-center gap-0.5">
                      <Calendar className="w-3 h-3" /> {expiryLabel}
                    </span>
                  )}
                </div>
              </div>
              <Link href="/premium"
                className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold bg-white/20 text-white border border-white/25 hover:bg-white/30 transition-colors whitespace-nowrap self-center">
                {isEarlyBird ? 'View Benefits' : isUrgent ? 'Renew Plan' : 'Manage Plan'}
              </Link>
            </div>
          </div>
        )}

        {/* Free trial progress */}
        {showTrial && (
          <div className="mt-3 rounded-xl bg-black/15 border border-white/15 px-3 py-2.5">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-yellow-500/30 border border-white/15 flex items-center justify-center shrink-0 mt-0.5">
                <Zap className="w-4 h-4 text-yellow-200 fill-yellow-200" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <p className="text-xs font-bold text-white">Free Trial Remaining</p>
                  <span className="text-xs font-bold text-white tabular-nums shrink-0">{trialPct}% left</span>
                </div>
                <p className="text-[10px] text-white/70 leading-snug mb-2">{trialMsg}</p>
                <div className="rounded-full h-2 bg-white/20 overflow-hidden">
                  <div className="h-2 rounded-full bg-yellow-300 transition-all duration-1000" style={{ width: `${trialPct}%` }} />
                </div>
              </div>
              <Link href="/premium"
                className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-[#8B6914] hover:bg-white/90 transition-colors whitespace-nowrap self-center">
                Upgrade Now
              </Link>
            </div>
          </div>
        )}

        {/* Profile completion progress */}
        {profileComplete < 100 && (
          <div className="mt-3 rounded-xl bg-black/15 border border-white/15 px-3 py-2.5">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/15 border border-white/15 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <p className="text-xs font-bold text-white">Profile Completion</p>
                  <span className="text-xs font-bold text-white tabular-nums shrink-0">{profileComplete}% done</span>
                </div>
                <p className="text-[10px] text-white/70 leading-snug mb-2">{profileMsg}</p>
                <div className="rounded-full h-2 bg-white/20 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${profileComplete}%` }}
                    transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                    className="h-2 rounded-full bg-emerald-300"
                  />
                </div>
              </div>
              <Link href="/profile/edit"
                className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold bg-white/20 text-white border border-white/25 hover:bg-white/30 transition-colors whitespace-nowrap self-center">
                Complete Profile
              </Link>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-3 flex gap-2">
          <Link href="/matches"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold bg-white text-[#8B6914] shadow hover:shadow-md transition-shadow">
            <Heart className="w-3.5 h-3.5 fill-[#8B6914]" /> Find Matches
          </Link>
          <Link href="/search"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold bg-white/15 text-white border border-white/30 hover:bg-white/25 transition-colors">
            <Search className="w-3.5 h-3.5" /> Search
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
      <motion.p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: delay + 0.2 }}>
        {value}
      </motion.p>
      <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5">{label}</p>
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

// ── Quick Action Card ─────────────────────────────────────────────────────────
function QuickAction({ icon: Icon, label, href, color, bg, delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: 'spring', stiffness: 200 }}
      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
      <Link href={href} className={`flex flex-col items-center gap-2 p-4 rounded-2xl ${bg} border border-vd-border hover:shadow-md transition-all`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 text-center">{label}</span>
      </Link>
    </motion.div>
  );
}

function ShareMyProfileAction({ userId, userName, color, bg, delay = 0 }) {
  const [sharing, setSharing] = useState(false);
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
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: 'spring', stiffness: 200 }}
      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
      <button type="button" onClick={handleShare} disabled={sharing}
        className={`w-full flex flex-col items-center gap-2 p-4 rounded-2xl ${bg} border border-vd-border hover:shadow-md transition-all disabled:opacity-60`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Share2 className="w-5 h-5" />
        </div>
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 text-center">
          {sharing ? 'Sharing…' : 'Share My Profile'}
        </span>
      </button>
    </motion.div>
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

  const quickActions = [
    { icon: Heart,    label: 'Find Matches',  href: '/matches',      color: 'text-vd-primary',   bg: 'bg-vd-bg-section dark:bg-vd-bg-card' },
    { icon: Eye,      label: 'Who Viewed Me', href: '/views',        color: 'text-teal-500',     bg: 'bg-vd-bg-section dark:bg-vd-bg-card' },
    { icon: Search,   label: 'Search',        href: '/search',       color: 'text-vd-primary', bg: 'bg-vd-bg-section dark:bg-vd-bg-card' },
    { icon: Star,     label: 'Premium',       href: '/premium',      color: 'text-yellow-500', bg: 'bg-vd-bg-section dark:bg-vd-bg-card' },
    { icon: Settings, label: 'Settings',      href: '/settings',     color: 'text-purple-500', bg: 'bg-vd-bg-section dark:bg-vd-bg-card' },
    { icon: HandCoins,label: 'Refer & Earn',  href: '/refer',        color: 'text-green-500',  bg: 'bg-vd-bg-section dark:bg-vd-bg-card' },
    { icon: Heart,    label: 'Share Story',   href: '/share-story',  color: 'text-pink-500',   bg: 'bg-vd-bg-section dark:bg-vd-bg-card' },
    { icon: Bell,     label: 'Notifications', href: '/notifications',color: 'text-green-500',  bg: 'bg-vd-bg-section dark:bg-vd-bg-card' },
    { icon: Shield,   label: 'Safety',        href: '/safety',       color: 'text-red-500',    bg: 'bg-vd-bg-section dark:bg-vd-bg-card' },
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

        <EarlyBirdOfferCard className="mb-6" />

        {/* Affiliate Dashboard */}
        <AffiliateCard agent={profile?.agent} />

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {stats.map((s, i) => <StatCard key={s.label} {...s} delay={i * 0.08} />)}
        </div>

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="mb-6">
          <h2 className="text-lg font-bold mb-3 text-gray-900 dark:text-white">Quick Actions</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {quickActions.map((a, i) => <QuickAction key={a.label} {...a} delay={0.4 + i * 0.05} />)}
            <ShareMyProfileAction
              userId={session?.user?.id}
              userName={session?.user?.name}
              color="text-teal-600"
              bg="bg-vd-bg-section dark:bg-vd-bg-card"
              delay={0.4 + quickActions.length * 0.05}
            />
          </div>
        </motion.div>

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
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
                className="relative rounded-2xl p-5 text-white overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #C8A45C, #E5C88B)' }}>
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
                <div className="relative">
                  <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                    <Star className="w-8 h-8 mb-2 fill-white" />
                  </motion.div>
                  <h3 className="font-black text-lg mb-1">Go Premium ✨</h3>
                  <p className="text-white/80 text-xs mb-4">Unlock unlimited chat, contacts & profile boost</p>
                  <div className="space-y-1.5 mb-4">
                    {['Unlimited interests','Chat with matches','See contact details','Profile boost'].map(f => (
                      <div key={f} className="flex items-center gap-1.5 text-xs">
                        <CheckCircle className="w-3.5 h-3.5 fill-white/30" />
                        <span className="text-white/90">{f}</span>
                      </div>
                    ))}
                  </div>
                  <Link href="/premium" className="block bg-white text-orange-600 text-center py-2.5 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors">
                    Upgrade Now →
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
