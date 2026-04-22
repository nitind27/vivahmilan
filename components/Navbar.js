'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Bell, MessageCircle, User, Menu, X, ChevronDown, Shield, LogOut, Settings, Sun, Moon } from 'lucide-react';
import SmartImage from '@/components/SmartImage';
import { useTheme } from '@/components/ThemeProvider';

export default function Navbar() {
  const { data: session } = useSession();
  const { theme, toggle, mounted } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [unread, setUnread] = useState(0);
  const [clientReady, setClientReady] = useState(false);

  useEffect(() => {
    setClientReady(true);
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (session) {
      const checkNotifs = () => {
        fetch('/api/notifications').then(r => r.json()).then(d => {
          // Only update count — Web Push handles actual notifications
          setUnread(d.unreadCount || 0);
        });
      };

      checkNotifs();
      const interval = setInterval(checkNotifs, 30000);
      return () => clearInterval(interval);
    }
  }, [session]);

  return (
    <nav suppressHydrationWarning className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${clientReady && scrolled ? 'bg-vd-bg-section/95 dark:bg-vd-bg-card/95 backdrop-blur-md shadow-lg' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <img
              src="/logo/logo.png"
              alt="Vivah Dwar Logo"
              className="h-25 w-auto object-contain"
            />
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/matches" className={`text-sm font-medium hover:text-vd-primary transition-colors ${scrolled ? 'text-vd-text-sub' : 'text-white'}`}>Find Matches</Link>
            <Link href="/search" className={`text-sm font-medium hover:text-vd-primary transition-colors ${scrolled ? 'text-vd-text-sub' : 'text-white'}`}>Search</Link>
            <Link href="/premium" className={`text-sm font-medium hover:text-vd-primary transition-colors ${scrolled ? 'text-vd-text-sub' : 'text-white'}`}>Premium</Link>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {clientReady && session ? (
              <>
                <Link href="/chat" className={`relative p-2 hover:text-vd-primary transition-colors ${scrolled ? 'text-vd-text-sub' : 'text-white'}`}>
                  <MessageCircle className="w-5 h-5" />
                </Link>
                <Link href="/notifications" className={`relative p-2 hover:text-vd-primary transition-colors ${scrolled ? 'text-vd-text-sub' : 'text-white'}`}>
                  <Bell className="w-5 h-5" />
                  {unread > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-vd-accent text-white text-xs rounded-full flex items-center justify-center">{unread}</span>
                  )}
                </Link>

                {/* User dropdown */}
                <div className="relative">
                  <button onClick={() => setDropOpen(!dropOpen)} className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <div className="w-8 h-8 rounded-full overflow-hidden vd-gradient-gold flex items-center justify-center">
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
                        className="absolute right-0 mt-2 w-52 bg-vd-bg-section dark:bg-vd-bg-card rounded-2xl shadow-xl border border-vd-border overflow-hidden"
                      >
                        <div className="p-3 border-b border-vd-border">
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
                            <Link href="/admin" onClick={() => setDropOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-vd-primary">
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
            ) : clientReady ? (
              <div className="flex items-center gap-2">
                <Link href="/login" className="vd-gradient-gold text-white text-sm font-medium px-4 py-2 rounded-full hover:opacity-90 transition-opacity">Sign in</Link>
              </div>
            ) : null}

            {/* Mobile menu button */}
            <button onClick={() => setMenuOpen(!menuOpen)} className={`md:hidden p-2 hover:text-vd-primary transition-colors ${scrolled ? 'text-vd-text-sub' : 'text-white'}`}>
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Dark/Light toggle */}
            <button
              onClick={toggle}
              className="p-2 rounded-xl text-vd-text-sub hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {mounted && (theme === 'dark'
                ? <Sun className="w-5 h-5 text-yellow-400" />
                : <Moon className="w-5 h-5" />
              )}
              {!mounted && <Moon className="w-5 h-5 opacity-0" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {clientReady && (
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-vd-bg-section dark:bg-vd-bg border-t border-vd-border"
            >
              <div className="px-4 py-3 space-y-1">
                <Link href="/matches" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-800">Find Matches</Link>
                <Link href="/search" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-800">Search</Link>
                <Link href="/premium" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-800">Premium</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </nav>
  );
}
