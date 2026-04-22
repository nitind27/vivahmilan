'use client';
import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import ProfileCard from '@/components/ProfileCard';
import SkeletonCard from '@/components/SkeletonCard';
import {
  Heart, Eye, MessageCircle, Bell, Star, Users, ChevronRight,
  Clock, Zap, Crown, Calendar, Shield, Search, Settings,
  TrendingUp, Sparkles, ArrowRight, CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

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

// ── Hero Banner ───────────────────────────────────────────────────────────────
function HeroBanner({ name, profileComplete, photo }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const greetEmoji = hour < 12 ? '🌅' : hour < 17 ? '☀️' : '🌙';

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative rounded-3xl overflow-hidden mb-6"
      style={{ background: 'linear-gradient(135deg, #A67C3D 0%, #C8A45C 40%, #D4AF37 70%, #A67C3D 100%)' }}
    >
      {/* Decorative blobs */}
      <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full"
        style={{ background: 'rgba(255,255,255,0.08)' }} />
      <div className="absolute -bottom-16 -left-8 w-56 h-56 rounded-full"
        style={{ background: 'rgba(0,0,0,0.08)' }} />

      <div className="relative p-6 sm:p-8 flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.95)' }}>
            {greetEmoji} {greeting}
          </p>
          <h1 className="text-2xl sm:text-3xl font-black mb-2 leading-tight" style={{ color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.25)' }}>
            {name?.split(' ')[0]} 👋
          </h1>
          <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.9)' }}>
            Your perfect match is waiting. Let's find them today!
          </p>

          {/* Profile completion bar */}
          {profileComplete < 100 && (
            <div className="rounded-2xl p-3 max-w-xs mb-4"
              style={{ background: 'rgba(0,0,0,0.18)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold" style={{ color: '#fff' }}>Profile {profileComplete}% complete</span>
                <Link href="/profile/edit" className="text-xs underline font-medium" style={{ color: 'rgba(255,255,255,0.9)' }}>Complete →</Link>
              </div>
              <div className="rounded-full h-1.5" style={{ background: 'rgba(255,255,255,0.25)' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${profileComplete}%` }}
                  transition={{ duration: 1.2, delay: 0.8, ease: 'easeOut' }}
                  className="h-1.5 rounded-full" style={{ background: '#fff' }} />
              </div>
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            <Link href="/matches"
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-bold transition-all shadow-lg"
              style={{ background: '#fff', color: '#A67C3D' }}>
              <Heart className="w-4 h-4" style={{ fill: '#A67C3D' }} /> Find Matches
            </Link>
            <Link href="/search"
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-semibold transition-all"
              style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)' }}>
              <Search className="w-4 h-4" /> Search
            </Link>
          </div>
        </div>

        {/* Avatar */}
        <div className="flex-shrink-0 hidden sm:block">
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-2xl"
              style={{ border: '3px solid rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.2)' }}>
              {photo ? (
                <img src={photo} alt={name} className="w-full h-full object-cover" />
              ) : (
                <img src="/images/default-avatar.png" alt={name} className="w-full h-full object-cover" />
              )}
            </div>
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-400 rounded-full border-2 border-white flex items-center justify-center shadow-md">
              <span className="text-xs text-white font-bold">✓</span>
            </motion.div>
          </div>
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

// ── Premium Validity Card ─────────────────────────────────────────────────────
function PremiumValidityCard({ premiumInfo }) {
  if (!premiumInfo?.isPremium) return null;
  const { plan, expiry, daysLeft } = premiumInfo;
  const isUrgent = daysLeft <= 2;
  const planGrad = {
    SILVER: 'linear-gradient(135deg,#4b5563,#6b7280)',
    GOLD:   'linear-gradient(135deg,#92400e,#b45309)',
    PLATINUM: 'linear-gradient(135deg,#5b21b6,#7c3aed)',
  };
  const pct = Math.max(0, Math.min(100, Math.round((daysLeft / 30) * 100)));
  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-5 mb-6 overflow-hidden relative"
      style={{ background: isUrgent ? 'linear-gradient(135deg,#b91c1c,#dc2626)' : planGrad[plan] || planGrad.GOLD }}>
      <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }} />
      <div className="relative flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-5 h-5" style={{ fill: 'rgba(255,255,255,0.9)', color: 'rgba(255,255,255,0.9)' }} />
            <span className="font-bold" style={{ color: '#fff' }}>{plan} Premium</span>
            {isUrgent && <span className="text-xs px-2 py-0.5 rounded-full animate-pulse" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>Expiring Soon!</span>}
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-xl px-3 py-1.5 text-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
              <p className="text-xl font-black" style={{ color: '#fff' }}>{daysLeft}</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.8)' }}>days left</p>
            </div>
            <div className="flex-1">
              <div className="rounded-full h-2 mb-1.5" style={{ background: 'rgba(255,255,255,0.25)' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.9)' }} />
              </div>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.8)' }}>
                Valid until {new Date(expiry).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
        <Link href="/premium"
          className="px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.35)' }}>
          {isUrgent ? '🔄 Renew' : 'Manage'}
        </Link>
      </div>
    </motion.div>
  );
}

// ── Birthday Card ─────────────────────────────────────────────────────────────
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

// ── Free Trial Banner ─────────────────────────────────────────────────────────
function FreeTrialBanner({ expiry }) {
  const countdown = useCountdown(expiry);
  if (!countdown) return null;
  const pad = n => String(n).padStart(2, '0');
  if (countdown.expired) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-4 mb-6 text-white flex items-center justify-between gap-4"
        style={{ background: 'linear-gradient(135deg,#ef4444,#ec4899)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-sm">Free Trial Ended</p>
            <p className="text-white/80 text-xs mt-0.5">Upgrade to Premium to keep all features</p>
          </div>
        </div>
        <Link href="/premium" className="bg-white text-red-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors whitespace-nowrap flex-shrink-0">
          Upgrade Now
        </Link>
      </motion.div>
    );
  }
  const pct = Math.min(100, Math.round((countdown.totalMs / (24 * 3600000)) * 100));
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-5 mb-6 text-white overflow-hidden relative"
      style={{ background: 'linear-gradient(135deg, #C8A45C, #E5C88B)' }}>
      <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-yellow-300 fill-yellow-300" />
            <p className="font-bold">Free Trial Active</p>
          </div>
          <div className="flex items-center gap-1 mb-3">
            {[{ val: pad(countdown.h), label: 'hr' }, { val: pad(countdown.m), label: 'min' }, { val: pad(countdown.s), label: 'sec' }].map((t, i) => (
              <span key={t.label} className="flex items-center gap-0.5">
                {i > 0 && <span className="text-white/50 font-bold">:</span>}
                <span className="bg-white/20 rounded-lg px-2 py-1 text-sm font-bold tabular-nums min-w-[2.2rem] text-center">{t.val}</span>
                <span className="text-white/60 text-xs">{t.label}</span>
              </span>
            ))}
          </div>
          <div className="bg-white/20 rounded-full h-1.5 max-w-xs">
            <div className="h-1.5 rounded-full bg-white transition-all duration-1000" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <Link href="/premium" className="bg-white text-vd-primary px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors whitespace-nowrap flex-shrink-0">
          Upgrade
        </Link>
      </div>
    </motion.div>
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

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [matches, setMatches]           = useState([]);
  const [interests, setInterests]       = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [profile, setProfile]           = useState(null);
  const [unreadChat, setUnreadChat]     = useState(0);
  const [loading, setLoading]           = useState(true);
  const [reminders, setReminders]       = useState({ premiumInfo: null, birthdayInfo: null });

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') router.push('/admin');
  }, [status, session, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;
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
  }, [status]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-vd-bg">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 pt-24 pb-12 space-y-4">
          <div className="h-48 skeleton rounded-3xl" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-28 skeleton rounded-2xl" />)}
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  const profileComplete  = profile?.profile?.profileComplete || 0;
  const pendingInterests = interests.filter(i => i.status === 'PENDING').length;
  const userPhoto        = profile?.image || profile?.photos?.[0]?.url || null;

  const stats = [
    { icon: Heart,         label: 'Interests',      value: interests.length > 0 ? interests.length : '—',  color: 'text-vd-primary',   bg: 'bg-vd-accent-soft dark:bg-vd-accent/20',   href: '/interests',  badge: pendingInterests > 0 },
    { icon: Eye,           label: 'Profile Views',  value: '—',                                             color: 'text-vd-primary', bg: 'bg-vd-accent-soft dark:bg-vd-accent/20', href: '/dashboard' },
    { icon: MessageCircle, label: 'Unread Msgs',    value: unreadChat > 0 ? unreadChat : '—',               color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20', href: '/chat',       badge: unreadChat > 0 },
    { icon: Users,         label: 'Matches',        value: matches.length > 0 ? matches.length : '—',       color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-900/20',    href: '/matches' },
  ];

  const quickActions = [
    { icon: Heart,    label: 'Find Matches',  href: '/matches',      color: 'text-vd-primary',   bg: 'bg-vd-bg-section dark:bg-vd-bg-card' },
    { icon: Search,   label: 'Search',        href: '/search',       color: 'text-vd-primary', bg: 'bg-vd-bg-section dark:bg-vd-bg-card' },
    { icon: Star,     label: 'Premium',       href: '/premium',      color: 'text-yellow-500', bg: 'bg-vd-bg-section dark:bg-vd-bg-card' },
    { icon: Settings, label: 'Edit Profile',  href: '/profile/edit', color: 'text-blue-500',   bg: 'bg-vd-bg-section dark:bg-vd-bg-card' },
    { icon: Bell,     label: 'Notifications', href: '/notifications',color: 'text-green-500',  bg: 'bg-vd-bg-section dark:bg-vd-bg-card' },
    { icon: Shield,   label: 'Safety',        href: '/safety',       color: 'text-red-500',    bg: 'bg-vd-bg-section dark:bg-vd-bg-card' },
  ];

  return (
    <div className="min-h-screen bg-vd-bg">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12">

        {/* Birthday */}
        {reminders.birthdayInfo?.isBirthday && <BirthdayCard name={session?.user?.name} />}

        {/* Hero Banner */}
        <HeroBanner name={session?.user?.name} profileComplete={profileComplete} photo={userPhoto} />

        {/* Premium / Trial banners */}
        <PremiumValidityCard premiumInfo={reminders.premiumInfo} />
        {session?.user?.freeTrialExpiry && !session?.user?.isPremium && (
          <FreeTrialBanner expiry={session.user.freeTrialExpiry} />
        )}

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
