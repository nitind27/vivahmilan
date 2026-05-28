'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Bell, CheckCheck, UserCheck, Flag, MessageCircle, CreditCard, UserPlus, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { connectSocket } from '@/lib/socket';

const iconForTitle = (title = '') => {
  const t = title.toLowerCase();
  if (t.includes('profile') || t.includes('approval') || t.includes('review')) return UserCheck;
  if (t.includes('report')) return Flag;
  if (t.includes('support') || t.includes('agent') || t.includes('chat')) return MessageCircle;
  if (t.includes('premium') || t.includes('payment') || t.includes('subscription')) return CreditCard;
  if (t.includes('register') || t.includes('new user')) return UserPlus;
  return Bell;
};

export default function AdminNotifications({ onStatsRefresh }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/notifications?limit=20');
      const data = await res.json();
      if (data.notifications) setNotifications(data.notifications);
      setUnread(data.unreadCount || 0);
    } catch {}
  }, []);

  useEffect(() => {
    if (!session?.user?.id || session.user.role !== 'ADMIN') return;

    fetchNotifications();
    const poll = setInterval(fetchNotifications, 30000);

    const socket = connectSocket(session.user.id);

    const onAdminNotif = ({ notification }) => {
      if (!notification) return;
      setNotifications(prev => [notification, ...prev.filter(n => n.id !== notification.id)].slice(0, 20));
      setUnread(n => n + 1);
      onStatsRefresh?.();
    };

    socket.on('admin:notification', onAdminNotif);

    return () => {
      clearInterval(poll);
      socket.off('admin:notification', onAdminNotif);
    };
  }, [session, fetchNotifications, onStatsRefresh]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetchNotifications().finally(() => setLoading(false));
  }, [open, fetchNotifications]);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const markAllRead = async () => {
    await fetch('/api/admin/notifications', { method: 'PATCH' });
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnread(0);
  };

  const handleClick = async (n) => {
    if (!n.isRead) {
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, isRead: true } : x));
      setUnread(c => Math.max(0, c - 1));
      fetch('/api/admin/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: n.id }),
      }).catch(() => {});
    }
    setOpen(false);
    if (n.link) router.push(n.link);
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative flex items-center justify-center w-10 h-10 bg-gray-800 rounded-xl hover:bg-gray-700 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 sm:w-96 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs text-vd-primary hover:text-vd-primary/80 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-10 text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center text-gray-500 text-sm">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
                No notifications yet
              </div>
            ) : (
              notifications.map(n => {
                const Icon = iconForTitle(n.title);
                return (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-800 transition-colors border-b border-gray-800/50 last:border-0 ${!n.isRead ? 'bg-gray-800/40' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${!n.isRead ? 'vd-gradient-gold' : 'bg-gray-700'}`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${!n.isRead ? 'font-semibold text-white' : 'text-gray-300'}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{n.message}</p>
                      <p className="text-[10px] text-gray-600 mt-1">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    {!n.isRead && (
                      <span className="w-2 h-2 bg-vd-primary rounded-full flex-shrink-0 mt-2" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
