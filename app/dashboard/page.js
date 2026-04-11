'use client';
import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import ProfileCard from '@/components/ProfileCard';
import SkeletonCard from '@/components/SkeletonCard';
import { Heart, Eye, MessageCircle, Bell, Star, TrendingUp, Users, ChevronRight, Clock, Zap, Crown, Shield, Calendar, Gift, Sparkles, PartyPopper } from 'lucide-react';
import toast from 'react-hot-toast';

// ── Live countdown timer ──────────────────────────────────────────────────────
function useCountdown(expiryISO) {
  const calc = useCallback(() => {
    if (!expiryISO) return null;
    const diff = new Date(expiryISO) - new Date();
    if (diff <= 0) return { expired: true, h: 0, m: 0, s: 0, totalMs: 0 };
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { expired: false, h, m, s, totalMs: diff };
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

// ── Premium Validity Card ─────────────────────────────────────────────────────
function PremiumValidityCard({ premiumInfo }) {
  if (!premiumInfo?.isPremium) return null;

  const { plan, expiry, daysLeft } = premiumInfo;
  const expiryDate = new Date(expiry);
  const isUrgent = daysLeft <= 2;
  const isExpired = daysLeft <= 0;

  const planColors = {
    SILVER: { from: '#6b7280', to: '#9ca3af', badge: 'bg-gray-100 text-gray-700' },
    GOLD:   { from: '#f59e0b', to: '#d97706', badge: 'bg-yellow-100 text-yellow-700' },
    PLATINUM: { from: '#8b5cf6', to: '#6d28d9', badge: 'bg-purple-100 text-purple-700' },
  };
  const colors = planColors[plan] || planColors.GOLD;

  const planEmoji = { SILVER: '🥈', GOLD: '🥇', PLATINUM: '💎' };

  // Progress bar: 30 days total
  const totalDays = 30;
  const pct = Math.max(0, Math.min(100, Math.round((daysLeft / totalDays) * 100)));

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-5 mb-6 text-white overflow-hidden relative"
      style={{ background: isUrgent ? 'linear-gradient(135deg, #ef4444, #dc2626)' : `linear-gradient(135deg, ${colors.from}, ${colors.to})` }}
    >
      {/* Decorative blobs */}
      <div className="absolute -top-8 -right-8 w-36 h-36 bg-white/10 rounded-full pointer-events-none" />
      <div className="absolute -bottom-10 -left-6 w-28 h-28 bg-white/5 rounded-full pointer-events-none" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Crown className="w-5 h-5 text-white fill-white/80" />
            <span className="font-bold text-base">
              {planEmoji[plan]} {plan} Premium
            </span>
            {isUrgent && (
              <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
                Expiring Soon!
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-white/80 text-sm mb-4">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span>
              {isExpired
                ? 'Subscription expired'
                : `Valid until ${expiryDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`}
            </span>
          </div>

          {/* Days left pill */}
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-bold tabular-nums">{daysLeft}</p>
              <p className="text-white/70 text-xs">days left</p>
            </div>
            <div className="flex-1">
              <div className="bg-white/20 rounded-full h-2 mb-1">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-2 rounded-full bg-white"
                />
              </div>
              <p className="text-white/60 text-xs">{pct}% validity remaining</p>
            </div>
          </div>
        </div>

        <Link href="/premium"
          className="bg-white/20 hover:bg-white/30 border border-white/30 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap flex-shrink-0">
          {isUrgent ? '🔄 Renew' : 'Manage'}
        </Link>
      </div>
    </motion.div>
  );
}

// ── Birthday Card ─────────────────────────────────────────────────────────────
const CONFETTI_COLORS = ['#ec4899','#8b5cf6','#f59e0b','#10b981','#3b82f6','#ef4444'];

function Confetti() {
  const pieces = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    x: Math.random() * 100,
    delay: Math.random() * 1.5,
    duration: 2 + Math.random() * 2,
    size: 6 + Math.random() * 8,
    rotate: Math.random() * 360,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl">
      {pieces.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-sm"
          style={{
            left: `${p.x}%`,
            top: '-10px',
            width: p.size,
            height: p.size * 0.6,
            backgroundColor: p.color,
            rotate: p.rotate,
          }}
          animate={{ y: ['0%', '110%'], opacity: [1, 1, 0], rotate: [p.rotate, p.rotate + 360] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'linear' }}
        />
      ))}
    </div>
  );
}

function BirthdayCard({ name }) {
  const [show, setShow] = useState(true);
  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -20 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="relative rounded-3xl p-6 mb-6 overflow-hidden text-white"
        style={{ background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)' }}
      >
        <Confetti />

        {/* Glow rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full border border-white/10 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-white/10 pointer-events-none" />

        <div className="relative flex items-center justify-between gap-4">
          <div className="flex-1">
            {/* Emoji row */}
            <div className="flex gap-1 text-2xl mb-3">
              {['🎂','🎉','🎊','✨','🎈'].map((e, i) => (
                <motion.span key={i}
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 1.2, delay: i * 0.15, repeat: Infinity, ease: 'easeInOut' }}>
                  {e}
                </motion.span>
              ))}
            </div>

            <motion.h2
              className="text-2xl font-black mb-1 tracking-tight"
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              Happy Birthday, {name?.split(' ')[0]}! 🎂
            </motion.h2>
            <p className="text-white/85 text-sm leading-relaxed">
              Wishing you a day filled with joy and love. May this year bring you your perfect life partner! 💕
            </p>

            <div className="flex items-center gap-2 mt-4">
              <motion.div
                className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl px-4 py-2 text-sm font-semibold"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                🥳 It's Your Special Day!
              </motion.div>
            </div>
          </div>

          {/* Big cake */}
          <motion.div
            className="text-7xl flex-shrink-0 select-none"
            animate={{ rotate: [-5, 5, -5], scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            🎂
          </motion.div>
        </div>

        {/* Close button */}
        <button
          onClick={() => setShow(false)}
          className="absolute top-3 right-3 w-7 h-7 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white/80 hover:text-white transition-colors text-sm"
        >
          ✕
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
function FreeTrialBanner({ expiry }) {
  const countdown = useCountdown(expiry);
  if (!countdown) return null;

  if (countdown.expired) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-4 mb-6 text-white flex items-center justify-between gap-4"
        style={{ background: 'linear-gradient(135deg, #ef4444, #ec4899)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Crown className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm">Free Trial Ended</p>
            <p className="text-white/80 text-xs mt-0.5">Upgrade to Premium to keep chatting and access all features</p>
          </div>
        </div>
        <Link href="/premium"
          className="bg-white text-red-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors whitespace-nowrap flex-shrink-0">
          Upgrade Now
        </Link>
      </motion.div>
    );
  }

  const pad = n => String(n).padStart(2, '0');
  // Progress: how much of 24h is left
  const totalDuration = 24 * 3600000;
  const pct = Math.min(100, Math.round((countdown.totalMs / totalDuration) * 100));
  const urgent = countdown.h < 3;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-5 mb-6 text-white overflow-hidden relative"
      style={{ background: urgent ? 'linear-gradient(135deg, #f59e0b, #ef4444)' : 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}>
      {/* Decorative circles */}
      <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full" />
      <div className="absolute -bottom-8 -right-16 w-40 h-40 bg-white/5 rounded-full" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-yellow-300 fill-yellow-300" />
            <p className="font-bold text-base">1 Day Free Trial Active</p>
          </div>
          <p className="text-white/80 text-xs mb-4">
            Enjoy full premium access — chat, view contacts, and more. Upgrade before it expires!
          </p>

          {/* Countdown */}
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-white/70 flex-shrink-0" />
            <span className="text-white/70 text-xs">Time remaining:</span>
            <div className="flex items-center gap-1">
              {[
                { val: pad(countdown.h), label: 'hr' },
                { val: pad(countdown.m), label: 'min' },
                { val: pad(countdown.s), label: 'sec' },
              ].map((t, i) => (
                <span key={t.label} className="flex items-center gap-0.5">
                  {i > 0 && <span className="text-white/50 text-sm font-bold">:</span>}
                  <span className="bg-white/20 rounded-lg px-2 py-1 text-sm font-bold tabular-nums min-w-[2.2rem] text-center">
                    {t.val}
                  </span>
                  <span className="text-white/60 text-xs">{t.label}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Progress bar */}
          <div className="bg-white/20 rounded-full h-1.5 w-full max-w-xs">
            <div
              className="h-1.5 rounded-full bg-white transition-all duration-1000"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-white/60 text-xs mt-1">{pct}% of trial remaining</p>
        </div>

        <Link href="/premium"
          className="bg-white text-purple-600 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors whitespace-nowrap flex-shrink-0 mt-1">
          Upgrade
        </Link>
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [matches, setMatches] = useState([]);
  const [interests, setInterests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [profile, setProfile] = useState(null);
  const [unreadChat, setUnreadChat] = useState(0);
  const [loading, setLoading] = useState(true);
  const [reminders, setReminders] = useState({ premiumInfo: null, birthdayInfo: null });

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') router.push('/admin');
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      Promise.all([
        fetch('/api/matches?limit=6').then(r => r.json()),
        fetch('/api/interest?type=received').then(r => r.json()),
        fetch('/api/notifications').then(r => r.json()),
        fetch('/api/profile').then(r => r.json()),
        fetch('/api/chat/unread').then(r => r.json()),
        fetch('/api/reminders', { method: 'POST' }).then(r => r.json()),
      ]).then(([m, i, n, p, u, rem]) => {
        setMatches(m.users || []);
        setInterests(i || []);
        setNotifications(n.notifications || []);
        setProfile(p);
        setUnreadChat(u.total || 0);
        setReminders(rem);
        setLoading(false);
      });
    }
  }, [status]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 pt-24 pb-12">
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {[...Array(3)].map((_, i) => <div key={i} className="h-24 skeleton rounded-2xl" />)}
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  const profileComplete = profile?.profile?.profileComplete || 0;
  const pendingInterests = interests.filter(i => i.status === 'PENDING').length;

  const stats = [
    { icon: Heart, label: 'Interests Received', value: interests.length, color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-900/20', href: '/interests' },
    { icon: Eye, label: 'Profile Views', value: '—', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20', href: '/dashboard' },
    { icon: MessageCircle, label: 'Unread Messages', value: unreadChat || '0', color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20', href: '/chat', badge: unreadChat > 0 },
    { icon: Users, label: 'Matches Found', value: matches.length, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', href: '/matches' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">

        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold">Welcome back, {session?.user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-gray-500 mt-1">Here's what's happening with your profile today.</p>
        </motion.div>

        {/* Birthday card */}
        {reminders.birthdayInfo?.isBirthday && (
          <BirthdayCard name={session?.user?.name} />
        )}

        {/* Premium validity card */}
        <PremiumValidityCard premiumInfo={reminders.premiumInfo} />

        {/* Profile completion banner */}
        {profileComplete < 80 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl p-5 mb-6 text-white">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-semibold">Complete your profile</p>
                <p className="text-white/80 text-sm">Profiles with 80%+ completion get 3x more matches</p>
              </div>
              <Link href="/profile/edit" className="bg-white text-pink-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
                Complete Now
              </Link>
            </div>
            <div className="bg-white/20 rounded-full h-2">
              <div className="gradient-bg h-2 rounded-full transition-all" style={{ width: `${profileComplete}%` }} />
            </div>
            <p className="text-white/80 text-xs mt-1">{profileComplete}% complete</p>
          </motion.div>
        )}

        {/* Free trial banner — shows when trial is active OR just expired */}
        {session?.user?.freeTrialExpiry && !session?.user?.isPremium && (
          <FreeTrialBanner expiry={session.user.freeTrialExpiry} />
        )}

        {/* Free trial expiry banner */}
        {session?.user?.freeTrialExpiry && !session?.user?.isPremium && (() => {
          const expiry = new Date(session.user.freeTrialExpiry);
          const now = new Date();
          if (expiry <= now) return null;
          const hoursLeft = Math.ceil((expiry - now) / 3600000);
          return (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl p-4 mb-6 text-white flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-sm">⏳ Free Trial Active</p>
                <p className="text-white/90 text-xs mt-0.5">
                  {hoursLeft <= 1 ? 'Less than 1 hour left!' : `${hoursLeft} hours remaining`} — Upgrade to keep full access
                </p>
              </div>
              <Link href="/premium" className="bg-white text-orange-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors whitespace-nowrap flex-shrink-0">
                Upgrade Now
              </Link>
            </motion.div>
          );
        })()}

        {/* Trial expired banner */}
        {session?.user?.freeTrialExpiry && !session?.user?.isPremium && new Date(session.user.freeTrialExpiry) <= new Date() && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-red-500 to-pink-600 rounded-2xl p-4 mb-6 text-white flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-sm">🔒 Free Trial Ended</p>
              <p className="text-white/90 text-xs mt-0.5">Upgrade to Premium to continue chatting and accessing all features</p>
            </div>
            <Link href="/premium" className="bg-white text-red-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors whitespace-nowrap flex-shrink-0">
              Upgrade Now
            </Link>
          </motion.div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 relative overflow-hidden">
              <a href={s.href} className="block">
                <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-gray-500 text-sm">{s.label}</p>
                {s.badge && (
                  <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-pink-500 rounded-full animate-pulse" />
                )}
              </a>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Matches */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Recommended Matches</h2>
              <Link href="/matches" className="text-pink-500 text-sm font-medium flex items-center gap-1 hover:text-pink-600">
                View all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {matches.map((u, i) => <ProfileCard key={u.id} user={u} index={i} />)}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pending interests */}
            {pendingInterests > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Pending Interests</h3>
                  <span className="bg-pink-100 text-pink-600 text-xs px-2 py-1 rounded-full">{pendingInterests} new</span>
                </div>
                <div className="space-y-3">
                  {interests.filter(i => i.status === 'PENDING').slice(0, 3).map(interest => (
                    <Link key={interest.id} href={`/profile/${interest.sender.id}`} className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-xl transition-colors">
                      <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {interest.sender.name?.[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{interest.sender.name}</p>
                        <p className="text-xs text-gray-500 truncate">{interest.sender.profile?.city || 'Location not set'}</p>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link href="/interests" className="block text-center text-pink-500 text-sm font-medium mt-3 hover:text-pink-600">
                  View all interests
                </Link>
              </div>
            )}

            {/* Notifications */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Recent Activity</h3>
                <Bell className="w-4 h-4 text-gray-400" />
              </div>
              {notifications.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">No notifications yet</p>
              ) : (
                <div className="space-y-3">
                  {notifications.slice(0, 5).map(n => (
                    <div key={n.id} className={`p-3 rounded-xl text-sm ${!n.isRead ? 'bg-pink-50 dark:bg-pink-900/10' : ''}`}>
                      <p className="font-medium">{n.title}</p>
                      <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{n.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Premium upsell */}
            {!session?.user?.isPremium && !session?.user?.freeTrialActive && (
              <div className="gradient-bg rounded-2xl p-5 text-white">
                <Star className="w-8 h-8 mb-3 fill-white" />
                <h3 className="font-bold text-lg mb-1">Go Premium</h3>
                <p className="text-white/80 text-sm mb-4">Unlock unlimited chat, see contact details, and boost your profile.</p>
                <Link href="/premium" className="block bg-white text-pink-600 text-center py-2 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors">
                  Upgrade Now
                </Link>
              </div>
            )}

            {/* Notification test */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
              <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5" /> Desktop Notifications
              </p>
              <button
                onClick={async () => {
                  if (Notification.permission === 'denied') {
                    toast.error('Notifications blocked. Enable in browser settings.');
                    return;
                  }
                  const res = await fetch('/api/push/test', { method: 'POST' });
                  const d = await res.json();
                  if (res.ok) toast.success('Test notification sent!');
                  else toast.error(d.error || 'Failed');
                }}
                className="w-full text-xs bg-gray-50 dark:bg-gray-700 hover:bg-pink-50 dark:hover:bg-pink-900/20 text-gray-600 dark:text-gray-300 hover:text-pink-600 py-2 rounded-xl transition-colors border border-gray-200 dark:border-gray-600"
              >
                🔔 Send Test Notification
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
