'use client';
import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import ProfileCard from '@/components/ProfileCard';
import SkeletonCard from '@/components/SkeletonCard';
import { Heart, Eye, MessageCircle, Bell, Star, TrendingUp, Users, ChevronRight, Clock, Zap, Crown } from 'lucide-react';

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

// ── Free Trial Banner ─────────────────────────────────────────────────────────
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
      ]).then(([m, i, n, p, u]) => {
        setMatches(m.users || []);
        setInterests(i || []);
        setNotifications(n.notifications || []);
        setProfile(p);
        setUnreadChat(u.total || 0);
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
            {!session?.user?.isPremium && (
              <div className="gradient-bg rounded-2xl p-5 text-white">
                <Star className="w-8 h-8 mb-3 fill-white" />
                <h3 className="font-bold text-lg mb-1">Go Premium</h3>
                <p className="text-white/80 text-sm mb-4">Unlock unlimited chat, see contact details, and boost your profile.</p>
                <Link href="/premium" className="block bg-white text-pink-600 text-center py-2 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors">
                  Upgrade Now
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
