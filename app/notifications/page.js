'use client';
import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import {
  Bell, Heart, Eye, CheckCheck, ChevronDown, ChevronRight, Loader2, Sparkles, Lock,
  Crown, Shield, Inbox, MessageCircle, Search, Settings,
} from 'lucide-react';
import {
  formatDistanceToNow,
  isToday,
  isYesterday,
  isThisWeek,
  format,
} from 'date-fns';

const TYPE_META = {
  INTEREST_RECEIVED: { icon: Heart, gradient: 'from-rose-500 to-pink-600', label: 'Interest' },
  INTEREST_ACCEPTED: { icon: Heart, gradient: 'from-emerald-500 to-green-600', label: 'Accepted' },
  PROFILE_VIEWED: { icon: Eye, gradient: 'from-teal-500 to-cyan-600', label: 'Profile view' },
  SUBSCRIPTION_EXPIRY: { icon: Crown, gradient: 'from-amber-500 to-orange-600', label: 'Subscription' },
  VERIFICATION_APPROVED: { icon: Shield, gradient: 'from-blue-500 to-indigo-600', label: 'Verified' },
  NEW_MATCH: { icon: Sparkles, gradient: 'from-vd-primary to-amber-600', label: 'New match' },
  SYSTEM: { icon: Bell, gradient: 'from-slate-500 to-slate-700', label: 'Update' },
};

const QUICK_LINKS = [
  { href: '/interests', icon: Heart, label: 'Interests' },
  { href: '/chat', icon: MessageCircle, label: 'Messages' },
  { href: '/matches', icon: Search, label: 'Matches' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

const LIMIT = 10;

function isProfileLink(link) {
  return link && /^\/profile\/[^/]+/.test(link);
}

function dateGroupLabel(date) {
  const d = new Date(date);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  if (isThisWeek(d)) return 'This week';
  return format(d, 'MMMM yyyy');
}

function groupNotifications(list) {
  const groups = [];
  const map = new Map();
  for (const n of list) {
    const key = dateGroupLabel(n.createdAt);
    if (!map.has(key)) {
      const entry = { label: key, items: [] };
      map.set(key, entry);
      groups.push(entry);
    }
    map.get(key).items.push(n);
  }
  return groups;
}

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [skip, setSkip] = useState(0);
  const [filter, setFilter] = useState('all');

  const isPaidPremium = !!session?.user?.isPremium;

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch(`/api/notifications?limit=${LIMIT}&skip=0`)
      .then(r => r.json())
      .then(data => {
        setNotifications(data.notifications || []);
        setHasMore(data.hasMore || false);
        setSkip(LIMIT);
        setLoading(false);
      });
  }, [status]);

  const loadMore = async () => {
    setLoadingMore(true);
    const res = await fetch(`/api/notifications?limit=${LIMIT}&skip=${skip}`);
    const data = await res.json();
    setNotifications(prev => [...prev, ...(data.notifications || [])]);
    setHasMore(data.hasMore || false);
    setSkip(s => s + LIMIT);
    setLoadingMore(false);
  };

  const markAllRead = async () => {
    await fetch('/api/notifications', { method: 'PATCH' });
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setTimeout(() => setNotifications([]), 400);
  };

  const markOneRead = async (id) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)));
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 300);
  };

  const getNotificationHref = (n) => {
    if (n.type === 'NEW_MATCH' || (n.type === 'SYSTEM' && isProfileLink(n.link))) {
      if (!isPaidPremium) return '/premium?source=new_match';
    }
    return n.link || '#';
  };

  const handleNotificationClick = (e, n) => {
    const href = getNotificationHref(n);
    if (href === '#') {
      e.preventDefault();
      return;
    }
    if (href !== n.link) {
      e.preventDefault();
      if (!n.isRead) markOneRead(n.id);
      router.push(href);
    } else if (!n.isRead) {
      markOneRead(n.id);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const readCount = notifications.length - unreadCount;

  const displayed = useMemo(
    () => (filter === 'unread' ? notifications.filter(n => !n.isRead) : notifications),
    [notifications, filter]
  );

  const grouped = useMemo(() => groupNotifications(displayed), [displayed]);

  return (
    <div className="min-h-screen bg-vd-bg">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12 w-full">

        {/* Page title bar — full width */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 lg:mb-8"
        >
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-2xl vd-gradient-gold flex items-center justify-center shadow-md shadow-vd-primary/20">
              <Bell className="w-5 h-5 text-white" />
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Notifications</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Interests, profile views & account updates
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex p-1 rounded-xl bg-vd-bg-section dark:bg-vd-bg-card border border-vd-border">
              {[
                { key: 'all', label: 'All', count: notifications.length },
                { key: 'unread', label: 'Unread', count: unreadCount },
              ].map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilter(tab.key)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    filter === tab.key
                      ? 'vd-gradient-gold text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`ml-1.5 tabular-nums ${filter === tab.key ? 'text-white/90' : 'text-vd-primary'}`}>
                      ({tab.count})
                    </span>
                  )}
                </button>
              ))}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-vd-border bg-vd-bg-section dark:bg-vd-bg-card text-sm font-semibold text-vd-primary-dark dark:text-vd-primary-light hover:border-vd-primary/40 transition-colors"
              >
                <CheckCheck className="w-4 h-4" />
                Mark all read
              </button>
            )}
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Sidebar — desktop */}
          <aside className="lg:col-span-3 xl:col-span-3 space-y-4">
            <div className="rounded-2xl border border-vd-border bg-vd-bg-section dark:bg-vd-bg-card p-4 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-vd-primary mb-3">Overview</p>
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                <div className="rounded-xl bg-vd-accent-soft/60 dark:bg-vd-accent/10 border border-vd-border px-3 py-3">
                  <p className="text-2xl font-black text-gray-900 dark:text-white tabular-nums">{unreadCount}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Unread</p>
                </div>
                <div className="rounded-xl bg-vd-bg-alt/80 dark:bg-vd-bg/60 border border-vd-border px-3 py-3">
                  <p className="text-2xl font-black text-gray-900 dark:text-white tabular-nums">{notifications.length}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Total loaded</p>
                </div>
              </div>
              {readCount > 0 && (
                <p className="text-[11px] text-gray-400 mt-3">{readCount} already read in this list</p>
              )}
            </div>

            <div className="rounded-2xl border border-vd-border bg-vd-bg-section dark:bg-vd-bg-card p-4 shadow-sm hidden lg:block">
              <p className="text-[10px] font-bold uppercase tracking-widest text-vd-primary mb-3">Quick links</p>
              <nav className="space-y-1">
                {QUICK_LINKS.map(({ href, icon: Icon, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-vd-bg-alt dark:hover:bg-vd-bg transition-colors"
                  >
                    <Icon className="w-4 h-4 text-vd-primary shrink-0" />
                    {label}
                    <ChevronRight className="w-3.5 h-3.5 ml-auto text-gray-300" />
                  </Link>
                ))}
              </nav>
            </div>

            {!isPaidPremium && (
              <Link
                href="/premium"
                className="hidden lg:flex items-center gap-3 rounded-2xl p-4 vd-gradient-gold text-white shadow-md hover:opacity-95 transition-opacity"
              >
                <Crown className="w-8 h-8 shrink-0 opacity-90" />
                <div>
                  <p className="font-bold text-sm">Go Premium</p>
                  <p className="text-xs text-white/85 mt-0.5">Unlock match alerts & contacts</p>
                </div>
              </Link>
            )}
          </aside>

          {/* Main feed */}
          <main className="lg:col-span-9 xl:col-span-9 min-w-0">
            {loading ? (
              <div className="rounded-2xl border border-vd-border bg-vd-bg-section dark:bg-vd-bg-card p-4 space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-20 skeleton rounded-xl" />
                ))}
              </div>
            ) : displayed.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-2xl border border-vd-border bg-vd-bg-section dark:bg-vd-bg-card p-12 sm:p-16 text-center shadow-sm"
              >
                <div className="w-20 h-20 rounded-2xl bg-vd-accent-soft dark:bg-vd-accent/20 flex items-center justify-center mx-auto mb-5">
                  <Inbox className="w-10 h-10 text-vd-primary" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {filter === 'unread' ? 'No unread notifications' : 'All caught up'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-md mx-auto">
                  {filter === 'unread'
                    ? 'Switch to All to see older notifications, or check back later.'
                    : 'New interests, profile views and updates will appear here.'}
                </p>
                <div className="flex flex-wrap justify-center gap-3 mt-8">
                  <Link href="/matches" className="px-5 py-2.5 rounded-xl vd-gradient-gold text-white text-sm font-semibold hover:opacity-90">
                    Browse matches
                  </Link>
                  <Link href="/interests" className="px-5 py-2.5 rounded-xl border border-vd-border text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-vd-bg-alt">
                    View interests
                  </Link>
                </div>
              </motion.div>
            ) : (
              <div className="rounded-2xl border border-vd-border bg-vd-bg-section dark:bg-vd-bg-card shadow-sm overflow-hidden">
                <div className="px-4 sm:px-5 py-3.5 border-b border-vd-border bg-vd-bg-alt/40 dark:bg-vd-bg/40 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {filter === 'unread' ? 'Unread only' : 'All notifications'}
                  </p>
                  <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
                    {displayed.length} item{displayed.length === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="p-3 sm:p-4 lg:p-5 space-y-6">
                  {grouped.map((group, gi) => (
                    <section key={group.label}>
                      <div className="flex items-center gap-3 mb-3">
                        <p className="text-xs font-bold uppercase tracking-widest text-vd-primary shrink-0">
                          {group.label}
                        </p>
                        <div className="flex-1 h-px bg-vd-border" />
                        <span className="text-[11px] text-gray-400 tabular-nums shrink-0">{group.items.length}</span>
                      </div>

                      <div className="grid gap-2 sm:gap-2.5 xl:grid-cols-2">
                        <AnimatePresence mode="popLayout">
                          {group.items.map((n, i) => {
                            const meta = TYPE_META[n.type] || TYPE_META.SYSTEM;
                            const Icon = meta.icon;
                            const isLockedMatch =
                              (n.type === 'NEW_MATCH' || (n.type === 'SYSTEM' && isProfileLink(n.link))) &&
                              !isPaidPremium;
                            const href = getNotificationHref(n);
                            const timeAgo = formatDistanceToNow(new Date(n.createdAt), { addSuffix: true });

                            return (
                              <motion.div
                                key={n.id}
                                layout
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.98, height: 0 }}
                                transition={{ delay: Math.min(gi * 0.02 + i * 0.02, 0.2) }}
                                className="min-w-0"
                              >
                                <Link
                                  href={href}
                                  onClick={e => handleNotificationClick(e, n)}
                                  className={`group relative flex sm:items-center gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-xl border h-full transition-all duration-200 ${
                                    !n.isRead
                                      ? 'bg-vd-accent-soft/30 dark:bg-vd-accent/10 border-vd-primary/30 hover:border-vd-primary/50 shadow-sm'
                                      : 'bg-vd-bg/50 dark:bg-vd-bg/30 border-vd-border hover:border-vd-primary/20'
                                  } ${isLockedMatch ? 'ring-1 ring-amber-400/35' : ''}`}
                                >
                                  {!n.isRead && (
                                    <span className="absolute left-0 top-2 bottom-2 w-0.5 sm:w-1 rounded-r-full vd-gradient-gold" />
                                  )}

                                  <div
                                    className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center shrink-0 shadow-sm`}
                                  >
                                    {isLockedMatch ? (
                                      <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                    ) : (
                                      <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2.25} />
                                    )}
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
                                      <span className="text-[10px] font-bold uppercase tracking-wide text-vd-primary-dark dark:text-vd-primary-light">
                                        {isLockedMatch ? 'Premium' : meta.label}
                                      </span>
                                      {!n.isRead && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-vd-primary" />
                                      )}
                                    </div>
                                    <p className={`text-sm leading-snug line-clamp-1 ${!n.isRead ? 'font-bold text-gray-900 dark:text-white' : 'font-semibold text-gray-800 dark:text-gray-200'}`}>
                                      {isLockedMatch ? 'New match waiting' : n.title}
                                    </p>
                                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                                      {isLockedMatch
                                        ? 'Upgrade to view profile & connect'
                                        : n.message}
                                    </p>
                                  </div>

                                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 shrink-0 sm:pl-1 sm:border-l sm:border-vd-border/60 sm:min-w-[4.5rem]">
                                    <p className="text-[10px] sm:text-[11px] text-gray-400 dark:text-gray-500 whitespace-nowrap sm:text-right">
                                      {timeAgo}
                                    </p>
                                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-vd-primary transition-colors" />
                                  </div>
                                </Link>
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                      </div>
                    </section>
                  ))}
                </div>

                {hasMore && filter === 'all' && (
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0 border-t border-vd-border">
                    <button
                      type="button"
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="w-full flex items-center justify-center gap-2 py-3.5 mt-4 rounded-xl bg-vd-bg-alt/80 dark:bg-vd-bg hover:bg-vd-accent-soft/40 dark:hover:bg-vd-accent/10 text-sm font-bold text-vd-primary-dark dark:text-vd-primary-light transition-colors disabled:opacity-60"
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Loading more…
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" /> Load more notifications
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mobile quick links */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 lg:hidden">
              {QUICK_LINKS.map(({ href, icon: Icon, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-vd-border bg-vd-bg-section dark:bg-vd-bg-card text-xs font-semibold text-gray-700 dark:text-gray-300 hover:border-vd-primary/30"
                >
                  <Icon className="w-5 h-5 text-vd-primary" />
                  {label}
                </Link>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
