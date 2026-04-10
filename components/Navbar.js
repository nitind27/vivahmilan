'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Bell, MessageCircle, User, Menu, X, ChevronDown, Shield, LogOut, Settings } from 'lucide-react';
import SmartImage from '@/components/SmartImage';
import { sendNotification } from '@/lib/notifications';

export default function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (session) {
      const checkNotifs = () => {
        fetch('/api/notifications').then(r => r.json()).then(d => {
          const newCount = d.unreadCount || 0;
          if (newCount > unread && Notification.permission === 'granted') {
            const latest = d.notifications?.find(n => !n.isRead);
            if (latest) {
              sendNotification({
                title: latest.title || 'Milan Matrimony',
                body: latest.message || 'You have a new notification',
                url: '/notifications',
              });
            }
          }
          setUnread(newCount);
        });
      };

      checkNotifs();
      const interval = setInterval(checkNotifs, 30000);
      return () => clearInterval(interval);
    }
  }, [session]);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 gradient-bg rounded-full flex items-center justify-center">
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="text-xl font-bold gradient-text">Milan</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/matches" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-pink-500 transition-colors">Find Matches</Link>
            <Link href="/search" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-pink-500 transition-colors">Search</Link>
            <Link href="/premium" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-pink-500 transition-colors">Premium</Link>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {session ? (
              <>
                <Link href="/chat" className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-pink-500 transition-colors">
                  <MessageCircle className="w-5 h-5" />
                </Link>
                <Link href="/notifications" className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-pink-500 transition-colors">
                  <Bell className="w-5 h-5" />
                  {unread > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-pink-500 text-white text-xs rounded-full flex items-center justify-center">{unread}</span>
                  )}
                </Link>

                {/* User dropdown */}
                <div className="relative">
                  <button onClick={() => setDropOpen(!dropOpen)} className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center">
                      {session.user.image ? (
                        <SmartImage src={session.user.image} alt="avatar" width={32} height={32} className="object-cover w-full h-full" />
                      ) : (
                        <span className="text-white text-sm font-bold">{session.user.name?.[0]?.toUpperCase()}</span>
                      )}
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </button>

                  <AnimatePresence>
                    {dropOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-52 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden"
                      >
                        <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                          <p className="font-semibold text-sm">{session.user.name}</p>
                          <p className="text-xs text-gray-500">{session.user.email}</p>
                          {session.user.isPremium && <span className="text-xs bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-2 py-0.5 rounded-full">Premium</span>}
                        </div>
                        <div className="p-1">
                          <Link href="/dashboard" onClick={() => setDropOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <User className="w-4 h-4" /> Dashboard
                          </Link>
                          <Link href="/profile/edit" onClick={() => setDropOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <Settings className="w-4 h-4" /> Edit Profile
                          </Link>
                          {session.user.role === 'ADMIN' && (
                            <Link href="/admin" onClick={() => setDropOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-purple-600">
                              <Shield className="w-4 h-4" /> Admin Panel
                            </Link>
                          )}
                          <button onClick={() => signOut({ callbackUrl: '/' })} className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors">
                            <LogOut className="w-4 h-4" /> Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-pink-500 transition-colors px-3 py-2">Login</Link>
                <Link href="/register" className="gradient-bg text-white text-sm font-medium px-4 py-2 rounded-full hover:opacity-90 transition-opacity">Register Free</Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 text-gray-600 dark:text-gray-300">
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800"
          >
            <div className="px-4 py-3 space-y-1">
              <Link href="/matches" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-800">Find Matches</Link>
              <Link href="/search" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-800">Search</Link>
              <Link href="/premium" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-800">Premium</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
