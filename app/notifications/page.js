'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import { Bell, Heart, MessageCircle, Eye, Star, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const iconMap = {
  INTEREST_RECEIVED: Heart,
  INTEREST_ACCEPTED: Heart,
  MESSAGE_RECEIVED: MessageCircle,
  PROFILE_VIEWED: Eye,
  SUBSCRIPTION_EXPIRY: Star,
  VERIFICATION_APPROVED: CheckCheck,
  SYSTEM: Bell,
};

export default function NotificationsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/notifications').then(r => r.json()).then(data => {
        setNotifications(data.notifications || []);
        setLoading(false);
        // Mark all as read
        fetch('/api/notifications', { method: 'PATCH' });
      });
    }
  }, [status]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-24 pb-12">
        <h1 className="text-3xl font-bold mb-6">Notifications</h1>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-16 skeleton rounded-2xl" />)}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20">
            <Bell className="w-16 h-16 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-500">No notifications yet</h3>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n, i) => {
              const Icon = iconMap[n.type] || Bell;
              return (
                <motion.div key={n.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                  <Link href={n.link || '#'} className={`flex items-start gap-4 p-4 rounded-2xl transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${!n.isRead ? 'bg-pink-50 dark:bg-pink-900/10' : 'bg-white dark:bg-gray-800'}`}>
                    <div className="w-10 h-10 gradient-bg rounded-full flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{n.title}</p>
                      <p className="text-gray-500 text-sm mt-0.5">{n.message}</p>
                      <p className="text-gray-400 text-xs mt-1">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
                    </div>
                    {!n.isRead && <div className="w-2 h-2 bg-pink-500 rounded-full mt-2 flex-shrink-0" />}
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
