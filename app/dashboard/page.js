'use client';
import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import SiteLoader from '@/components/SiteLoader';
import ProfileCard from '@/components/ProfileCard';
import SkeletonCard from '@/components/SkeletonCard';
import { shareProfile } from '@/components/ShareProfileButton';
import {
  Heart, Eye, MessageCircle, Bell, Users, ChevronRight,
  Zap, Crown, Calendar, Shield, Search, Settings, Lock,
  TrendingUp, Sparkles, ArrowRight, HandCoins, Share2, Bookmark
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

function DashboardWelcomeCard({ name, profileComplete, photo, premiumInfo, freeTrialExpiry, isPremium, freeTrialActive }) {
  const isEarlyBird = premiumInfo?.isEarlyBird;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
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

  const firstName = name?.split(' ')[0] || 'Member';

  return (
    <section className="mb-6 overflow-hidden rounded-3xl border border-[#E8DCC8] bg-white shadow-sm">
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#E8DCC8] bg-[#F8F1E3] text-xl font-semibold text-[#8F6B2E]">
            {photo ? (
              <img src={photo} alt="" className="h-full w-full object-cover" />
            ) : (
              firstName[0]
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A67C3D]">{greeting}</p>
            <h1 className="truncate font-display text-2xl font-semibold text-[#2C2416] sm:text-3xl">{firstName}</h1>
            <p className="mt-1 text-sm text-[#6E6254]">
              {showPremium ? premiumDetail : showTrial ? 'Your free trial is running.' : 'Search, shortlist, and reply when you are ready.'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {showPremium && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F8F1E3] px-3 py-1.5 text-xs font-semibold text-[#8F6B2E]">
              <Crown className="h-3.5 w-3.5" />
              {isEarlyBird ? 'Early Bird' : planLabel}
              <span className="text-[#2C2416]">· {daysLeft} days</span>
            </span>
          )}
          {showTrial && countdown && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F8F1E3] px-3 py-1.5 text-xs font-semibold tabular-nums text-[#8F6B2E]">
              <Zap className="h-3.5 w-3.5" />
              Trial {pad(countdown.h)}:{pad(countdown.m)}:{pad(countdown.s)}
            </span>
          )}
          <Link href="/matches" className="vd-gradient-gold inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white">
            <Heart className="h-4 w-4" />
            Matches
          </Link>
          <Link href="/search" className="inline-flex items-center gap-2 rounded-full border border-[#C4A35A] px-5 py-2.5 text-sm font-semibold text-[#8F6B2E]">
            <Search className="h-4 w-4" />
            Search
          </Link>
        </div>
      </div>

      {(showPremium || showTrial || profileComplete < 100) && (
        <div className="grid gap-4 border-t border-[#F3E6C8] bg-[#FFFCF7] px-5 py-4 sm:grid-cols-2 sm:px-6">
          {showPremium && (
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <p className="font-semibold text-[#2C2416]">{isEarlyBird ? 'Early Bird access' : `${planLabel} plan`}</p>
                <span className="font-semibold tabular-nums text-[#8F6B2E]">{premiumPct}% left</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[#E8DCC8]">
                <div className={`h-full rounded-full ${isUrgent ? 'bg-[#A65D4E]' : 'bg-[#C4A35A]'}`} style={{ width: `${premiumPct}%` }} />
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                {expiryLabel ? (
                  <span className="inline-flex items-center gap-1 text-xs text-[#6E6254]">
                    <Calendar className="h-3.5 w-3.5" /> {expiryLabel}
                  </span>
                ) : <span />}
                <Link href="/premium" className="text-xs font-semibold text-[#8F6B2E] hover:underline">
                  {isEarlyBird ? 'View benefits' : isUrgent ? 'Renew plan' : 'Manage plan'}
                </Link>
              </div>
            </div>
          )}

          {showTrial && (
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <p className="font-semibold text-[#2C2416]">Free trial</p>
                <span className="font-semibold tabular-nums text-[#8F6B2E]">{trialPct}% left</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[#E8DCC8]">
                <div className="h-full rounded-full bg-[#C4A35A]" style={{ width: `${trialPct}%` }} />
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-xs text-[#6E6254]">{trialMsg}</p>
                <Link href="/premium" className="shrink-0 text-xs font-semibold text-[#8F6B2E] hover:underline">Upgrade</Link>
              </div>
            </div>
          )}

          {profileComplete < 100 && (
            <div className={showPremium || showTrial ? '' : 'sm:col-span-2'}>
              <div className="mb-2 flex items-center justify-between text-sm">
                <p className="font-semibold text-[#2C2416]">Profile</p>
                <span className="font-semibold tabular-nums text-[#8F6B2E]">{profileComplete}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[#E8DCC8]">
                <div className="h-full rounded-full bg-[#C4A35A]" style={{ width: `${profileComplete}%` }} />
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-xs text-[#6E6254]">{profileMsg}</p>
                <Link href="/profile/edit" className="shrink-0 text-xs font-semibold text-[#8F6B2E] hover:underline">Complete profile</Link>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// ── Animated Stat Card ────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, href, badge }) {
  return (
    <a href={href} className="relative block rounded-2xl border border-[#E8DCC8] bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-3 flex items-center justify-between">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F8F1E3] text-[#8F6B2E]">
          <Icon className="h-4 w-4" />
        </span>
        {badge ? <span className="h-2 w-2 rounded-full bg-[#C4A35A]" /> : null}
      </div>
      <p className="font-display text-2xl font-semibold text-[#2C2416]">{value}</p>
      <p className="mt-0.5 text-xs text-[#6E6254]">{label}</p>
    </a>
  );
}

// ── Animated Stat Card ────────────────────────────────────────────────────────
function BirthdayCard({ name }) {
  const [show, setShow] = useState(true);
  if (!show) return null;
  return (
    <div className="relative mb-6 flex items-center justify-between gap-4 rounded-3xl border border-[#E8DCC8] bg-white px-5 py-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A67C3D]">Today</p>
        <h2 className="mt-1 font-display text-2xl font-semibold text-[#2C2416]">Happy birthday, {name?.split(' ')[0]}</h2>
        <p className="mt-1 text-sm text-[#6E6254]">Wishing you a year that brings the right match.</p>
      </div>
      <button type="button" onClick={() => setShow(false)} className="rounded-full border border-[#E8DCC8] px-3 py-1 text-xs font-semibold text-[#6E6254]">
        Dismiss
      </button>
    </div>
  );
}

// ── Quick Actions ─────────────────────────────────────────────────────────────
function QuickActionCard({ icon: Icon, label, sub, href, featured = false, badge, delay = 0, onClick, disabled, busyLabel }) {
  const baseClass = [
    'group relative flex w-full text-left transition-shadow',
    'rounded-2xl border border-[#E8DCC8] bg-white hover:shadow-md',
    featured ? 'flex-col justify-between p-5 min-h-[8.5rem]' : 'items-center gap-3 p-3.5',
    disabled ? 'pointer-events-none opacity-60' : '',
  ].join(' ');

  const inner = (
    <>
      <span className={`flex shrink-0 items-center justify-center rounded-full bg-[#F8F1E3] text-[#8F6B2E] ${featured ? 'h-11 w-11' : 'h-10 w-10'}`}>
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <div className={`min-w-0 flex-1 ${featured ? 'mt-4' : ''}`}>
        <div className="flex items-start justify-between gap-2">
          <p className={`font-semibold leading-tight text-[#2C2416] ${featured ? 'text-base' : 'text-sm'}`}>
            {busyLabel || label}
          </p>
          {badge > 0 ? (
            <span className="shrink-0 min-w-[1.25rem] rounded-full bg-[#C4A35A] px-1.5 py-0.5 text-center text-[10px] font-bold text-white">
              {badge > 99 ? '99+' : badge}
            </span>
          ) : null}
        </div>
        {sub ? <p className="mt-0.5 line-clamp-1 text-xs text-[#6E6254]">{sub}</p> : null}
      </div>
      {!featured ? (
        <ChevronRight className="h-4 w-4 shrink-0 text-[#C4A35A]" />
      ) : (
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#8F6B2E]">
          Open <ArrowRight className="h-3.5 w-3.5" />
        </span>
      )}
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
      <div className="overflow-hidden rounded-3xl border border-[#E8DCC8] bg-[#FFFCF7] shadow-sm">
        <div className="border-b border-[#E8DCC8] px-5 py-4">
          <h2 className="font-display text-2xl font-semibold text-[#2C2416]">Your next step</h2>
          <p className="mt-1 text-sm text-[#6E6254]">Matches, messages, and the rest of your account.</p>
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
    <div className="mb-6 flex flex-col gap-5 rounded-3xl border border-[#E8DCC8] bg-white p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div className="min-w-0">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#A67C3D]">
          <HandCoins className="h-4 w-4" /> Partner
        </p>
        <h2 className="mt-1 font-display text-2xl font-semibold text-[#2C2416]">Earn {agent.commissionPct}% on each premium plan</h2>
        <p className="mt-1 max-w-md text-sm text-[#6E6254]">Share your code. You earn when someone buys a plan with it.</p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#E8DCC8] bg-[#FFFCF7] py-1 pl-4 pr-1">
          <span className="font-mono text-sm font-semibold tracking-widest text-[#2C2416]">{agent.referralCode}</span>
          <button type="button" onClick={copyCode} className="rounded-full bg-[#F8F1E3] p-2 text-[#8F6B2E]" aria-label="Copy referral code">
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="rounded-2xl bg-[#F8F1E3] px-5 py-4 sm:min-w-[180px]">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#8F6B2E]">Earnings</p>
        <p className="mt-1 font-display text-3xl font-semibold text-[#2C2416]">₹{Number(agent.totalEarnings || 0).toLocaleString('en-IN')}</p>
        <p className="mt-1 inline-flex items-center gap-1 text-xs text-[#6E6254]">
          <TrendingUp className="h-3.5 w-3.5" /> {agent.commissionPct}% commission
        </p>
      </div>
    </div>
  );
}

function TrustPanel({ hidePhone, hidePhoto, unreadChat, verified, familyLogin }) {
  const items = [
    {
      icon: Shield,
      title: verified ? 'Profile reviewed' : 'Profiles are checked',
      text: verified
        ? 'Your account has a verification badge.'
        : 'New profiles are reviewed before they stay visible.',
      href: '/safety',
      action: 'Safety',
    },
    {
      icon: MessageCircle,
      title: 'Private chat',
      text: familyLogin
        ? 'Family login cannot open chat.'
        : unreadChat > 0
          ? `${unreadChat} unread. Messages stay between you and the other person.`
          : 'Messages stay between you and the other person.',
      href: familyLogin ? '/safety' : '/chat',
      action: familyLogin ? 'How chat works' : 'Open chat',
    },
    {
      icon: Lock,
      title: 'Phone number',
      text: hidePhone
        ? 'Hidden. Other members cannot see your number.'
        : 'Premium members can see your number. Hide it anytime.',
      href: '/settings',
      action: 'Change',
    },
    {
      icon: Eye,
      title: 'Photos',
      text: hidePhoto
        ? 'Hidden from people who are not on premium.'
        : 'Visible on your profile. You can limit who sees them.',
      href: '/settings',
      action: 'Change',
    },
  ];

  return (
    <section className="mb-6 overflow-hidden rounded-3xl border border-[#E8DCC8] bg-white shadow-sm">
      <div className="border-b border-[#F3E6C8] px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A67C3D]">Your account</p>
        <h2 className="mt-1 font-display text-2xl font-semibold text-[#2C2416]">Trust, chat, and privacy</h2>
      </div>
      <div className="grid gap-px bg-[#F3E6C8] sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="bg-white px-5 py-4 transition-colors hover:bg-[#FFFCF7]"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F8F1E3] text-[#8F6B2E]">
              <item.icon className="h-4 w-4" />
            </span>
            <p className="mt-3 text-sm font-semibold text-[#2C2416]">{item.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-[#6E6254]">{item.text}</p>
            <p className="mt-2 text-xs font-semibold text-[#8F6B2E]">{item.action}</p>
          </Link>
        ))}
      </div>
    </section>
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
          <div className="mb-4 rounded-2xl border border-[#E8DCC8] bg-[#F8F1E3] px-4 py-3">
            <p className="text-sm font-semibold text-[#2C2416]">
              Family login — viewing {session.user.ownerName ? `${session.user.ownerName}'s` : 'the member'} profile
            </p>
            <p className="mt-1 text-xs text-[#6E6254]">Read only. You can search and view profiles. Interests and chat stay off.</p>
          </div>
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

        <TrustPanel
          hidePhone={!!profile?.profile?.hidePhone}
          hidePhoto={!!profile?.profile?.hidePhoto}
          unreadChat={unreadChat}
          verified={!!(profile?.verificationBadge || profile?.adminVerified)}
          familyLogin={!!session?.user?.isFamilyLogin}
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
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A67C3D]">For you</p>
                <h2 className="font-display text-2xl font-semibold text-[#2C2416]">Recommended matches</h2>
              </div>
              <Link href="/matches" className="inline-flex items-center gap-1 text-sm font-semibold text-[#8F6B2E]">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            {matches.length === 0 ? (
              <div className="rounded-3xl border border-[#E8DCC8] bg-white px-6 py-12 text-center">
                <p className="font-semibold text-[#2C2416]">No matches yet</p>
                <p className="mt-1 text-sm text-[#6E6254]">Finish your profile so suggestions can use your preferences.</p>
                <Link href="/matches" className="vd-gradient-gold mt-4 inline-flex rounded-full px-5 py-2.5 text-sm font-semibold text-white">
                  Browse profiles
                </Link>
              </div>
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
                className="rounded-2xl border border-[#E8DCC8] bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold text-[#2C2416]">Pending interests</h3>
                  <span className="rounded-full bg-[#F8F1E3] px-2.5 py-1 text-xs font-semibold text-[#8F6B2E]">{pendingInterests}</span>
                </div>
                <div className="space-y-2">
                  {interests.filter(i => i.status === 'PENDING').slice(0, 3).map(interest => (
                    <Link key={interest.id} href={`/profile/${interest.sender.id}`}
                      className="group flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-[#FFFCF7]">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F8F1E3] text-sm font-semibold text-[#8F6B2E]">
                        {interest.sender.name?.[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#2C2416]">{interest.sender.name}</p>
                        <p className="truncate text-xs text-[#8A7A68]">{interest.sender.profile?.city || 'Location not set'}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-[#C4A35A]" />
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
                className="rounded-2xl border border-[#E8DCC8] bg-white p-5 shadow-sm">
                <div className="mb-4">
                  <h3 className="font-semibold text-[#2C2416]">Recently viewed</h3>
                </div>
                <div className="space-y-2">
                  {recentlyViewed.slice(0, 5).map(u => (
                    <Link key={u.id} href={`/profile/${u.id}`}
                      className="group flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-[#FFFCF7]">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#F8F1E3] text-sm font-semibold text-[#8F6B2E]">
                        {u.photos?.[0]?.url ? (
                          <img src={u.photos[0].url} alt="" className="h-full w-full object-cover" />
                        ) : u.name?.[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#2C2416]">{u.name}</p>
                        <p className="truncate text-xs text-[#8A7A68]">{u.profile?.city || '—'}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-[#C4A35A]" />
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Recent Activity */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
              className="rounded-2xl border border-[#E8DCC8] bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-[#2C2416]">Recent activity</h3>
                <Link href="/notifications" className="text-xs font-semibold text-[#8F6B2E]">See all</Link>
              </div>
              {notifications.length === 0 ? (
                <p className="py-6 text-center text-sm text-[#8A7A68]">No activity yet</p>
              ) : (
                <div className="space-y-2">
                  {notifications.slice(0, 4).map(n => (
                    <div key={n.id} className={`rounded-xl p-3 text-sm ${!n.isRead ? 'border border-[#E8DCC8] bg-[#FFFCF7]' : ''}`}>
                      <p className="text-xs font-semibold text-[#2C2416]">{n.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-[#6E6254]">{n.message}</p>
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
                className="group overflow-hidden rounded-2xl border border-[#E8DCC8] bg-white shadow-sm"
              >
                <div className="h-1 vd-gradient-gold" />
                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A67C3D]">Premium</p>
                  <h3 className="mt-1 font-display text-xl font-semibold text-[#2C2416]">See contacts and chat freely</h3>
                  <p className="mt-1 text-xs text-[#6E6254]">More interests, direct chat, and a higher place in search.</p>

                  <div className="mb-4 mt-4 grid grid-cols-2 gap-2">
                    {[
                      { icon: Heart, label: 'Unlimited interests' },
                      { icon: MessageCircle, label: 'Direct chat' },
                      { icon: Eye, label: 'View contacts' },
                      { icon: TrendingUp, label: 'Profile boost' },
                    ].map(({ icon: Icon, label }) => (
                      <div
                        key={label}
                        className="flex items-center gap-2 rounded-xl border border-[#E8DCC8] bg-[#FFFCF7] px-2.5 py-2"
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0 text-[#8F6B2E]" />
                        <span className="text-[11px] font-medium leading-tight text-[#5C4A32]">{label}</span>
                      </div>
                    ))}
                  </div>

                  <Link
                    href="/premium"
                    className="vd-gradient-gold flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-white"
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
