'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import { Bell, Heart, MessageCircle, Eye, Star, CheckCheck, ChevronDown, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const iconMap = {
  INTEREST_RECEIVED: Heart,
  INTEREST_ACCEPTED: Heart,
  PROFILE_VIEWED: Eye,
  SUBSCRIPTION_EXPIRY: Star,
  VERIFICATION_APPROVED: CheckCheck,
  SYSTEM: Bell,
};

const colorMap = {
  INTEREST_RECEIVED: 'bg-pink-500',
  INTEREST_ACCEPTED: 'bg-green-500',
  PROFILE_VIEWED: 'bg-purple-500',
  SUBSCRIPTION_EXPIRY: 'bg-yellow-500',
  VERIFICATION_APPROVED: 'bg-blue-500',
  SYSTEM: 'bg-gray-500',
};

const LIMIT = 10;

export default function NotificationsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [skip, setSkip] = useState(0);

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
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 300);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-24 pb-12">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-xs text-gray-400 mt-0.5">{unreadCount} unread</p>
            )}
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead}
              className="text-sm text-pink-500 hover:text-pink-600 font-medium flex items-center gap-1.5 transition-colors">
              <CheckCheck className="w-4 h-4" /> Mark all read
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-16 skeleton rounded-2xl" />)}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20">
            <Bell className="w-16 h-16 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-500">No notifications yet</h3>
            <p className="text-gray-400 text-sm mt-1">Interests, profile views and updates will appear here</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <AnimatePresence>
                {notifications.map((n, i) => {
                  const Icon = iconMap[n.type] || Bell;
                  const iconBg = colorMap[n.type] || 'bg-gray-500';
                  return (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20, height: 0 }}
                      transition={{ delay: i < 10 ? i * 0.03 : 0 }}
                    >
                      <Link
                        href={n.link || '#'}
                        onClick={() => !n.isRead && markOneRead(n.id)}
                        className={`flex items-start gap-4 p-4 rounded-2xl transition-all hover:bg-gray-100 dark:hover:bg-gray-800 ${
                          !n.isRead ? 'bg-pink-50 dark:bg-pink-900/10 border border-pink-100 dark:border-pink-900/20' : 'bg-white dark:bg-gray-800'
                        }`}
                      >
                        <div className={`w-10 h-10 ${iconBg} rounded-full flex items-center justify-center flex-shrink-0`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${!n.isRead ? 'font-semibold' : 'font-medium'}`}>{n.title}</p>
                          <p className="text-gray-500 text-sm mt-0.5 line-clamp-2">{n.message}</p>
                          <p className="text-gray-400 text-xs mt-1">
                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        {!n.isRead && (
                          <div className="w-2.5 h-2.5 bg-pink-500 rounded-full mt-1.5 flex-shrink-0" />
                        )}
                      </Link>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="mt-4 text-center">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="flex items-center gap-2 mx-auto px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm font-medium hover:border-pink-300 hover:text-pink-500 transition-all disabled:opacity-60"
                >
                  {loadingMore
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Loading…</>
                    : <><ChevronDown className="w-4 h-4" /> Load more notifications</>
                  }
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
