'use client';
import SiteLoader from '@/components/SiteLoader';
import { useEffect, useState, useRef, useLayoutEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import {
  BarChart2,   UserCheck, Users, Sparkles, UserPlus, Crown, UserX,
  Bell, Activity, Shield, Flag, Star, Settings, Heart,
  FileText, Edit2, Lock, MessageCircle, LogOut, Eye, RefreshCw, BookOpen,
  TrendingUp, HandCoins, IndianRupee, UserCog, HeartHandshake, Database,
} from 'lucide-react';
import AdminNotifications from '@/components/AdminNotifications';

export const ADMIN_TABS = [
  { id: 'overview',      label: 'Overview',         icon: BarChart2,     badge: null },
  { id: 'moderation',    label: 'Moderation Queue', icon: Shield,        badge: null },
  { id: 'pending',       label: 'Pending Approval',  icon: UserCheck,     badge: 'pendingAdminVerify' },
  { id: 'members',       label: 'All Members',       icon: Users,         badge: null },
  { id: 'deleted-users', label: 'Deleted Users',     icon: UserX,         badge: null },
  { id: 'donations',     label: 'Donations',         icon: HeartHandshake, badge: null },
  { id: 'subscriptions', label: 'Subscriptions',     icon: Star,          badge: null },
  { id: 'revenue',       label: 'Revenue',           icon: IndianRupee,   badge: null },
  { id: 'referrals',     label: 'Referrals',         icon: HandCoins,     badge: null },
  { id: 'plans',         label: 'Plan Config',       icon: Settings,      badge: null },
  { id: 'coupons',       label: 'Coupon Codes',      icon: Star,          badge: null },
  { id: 'matchmaker',    label: 'Match Maker',       icon: Sparkles,      badge: null },
  { id: 'createprofile', label: 'Create Profile',    icon: UserPlus,      badge: null },
  { id: 'seed-profiles', label: 'Dummy Profiles',   icon: Database,      badge: null },
  { id: 'premium',       label: 'Premium Manager',   icon: Crown,         badge: null },
  { id: 'broadcast',     label: 'Broadcast',         icon: Bell,          badge: null },
  { id: 'affiliates',    label: 'Affiliate Agents',  icon: Users,         badge: null },
  { id: 'activity',      label: 'Activity Log',      icon: Activity,      badge: null },
  { id: 'analytics',     label: 'Analytics',         icon: TrendingUp,    badge: null },
  { id: 'reports',       label: 'Reports',           icon: Flag,          badge: 'pendingReports' },
  { id: 'marketing',     label: 'Marketing & Popups',icon: Sparkles,      badge: null },
  { id: 'stories',       label: 'Success Stories',   icon: Heart,         badge: null },
  { id: 'blog',          label: 'Blog & FAQ',        icon: BookOpen,      badge: null },
  { id: 'about',         label: 'About Page',        icon: Eye,           badge: null },
  { id: 'homepage',      label: 'Homepage Content',  icon: FileText,      badge: null },
  { id: 'options',       label: 'Profile Options',   icon: Edit2,         badge: null },
  { id: 'siteconfig',    label: 'Site Settings',     icon: Lock,          badge: null },
  { id: 'adminsettings', label: 'Admin Settings',    icon: UserCog,       badge: null },
  { id: 'support',       label: 'Support Chat',      icon: MessageCircle, badge: 'pendingSupportLive' },
];

export default function AdminLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [stats, setStats] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const desktopNavRef = useRef(null);
  const mobileNavRef = useRef(null);
  const sidebarScrollTop = useRef(0);

  const saveSidebarScroll = useCallback(() => {
    const el = desktopNavRef.current || mobileNavRef.current;
    if (el) sidebarScrollTop.current = el.scrollTop;
  }, []);

  const restoreSidebarScroll = useCallback(() => {
    const top = sidebarScrollTop.current;
    for (const el of [desktopNavRef.current, mobileNavRef.current]) {
      if (el) el.scrollTop = top;
    }
    requestAnimationFrame(() => {
      for (const el of [desktopNavRef.current, mobileNavRef.current]) {
        if (el) el.scrollTop = top;
      }
    });
  }, []);

  useLayoutEffect(() => {
    restoreSidebarScroll();
  }, [pathname, restoreSidebarScroll]);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') router.push('/dashboard');
  }, [status, session, router]);

  const refreshStats = useCallback(() => {
    fetch('/api/admin/stats').then(r => r.json()).then(setStats).catch(() => {});
  }, []);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      refreshStats();
      const interval = setInterval(refreshStats, 60000);
      const onRefresh = () => refreshStats();
      window.addEventListener('admin-stats-refresh', onRefresh);
      return () => {
        clearInterval(interval);
        window.removeEventListener('admin-stats-refresh', onRefresh);
      };
    }
  }, [status, session, refreshStats]);

  if (status === 'loading') return <SiteLoader message="Loading admin…" size="lg" className="bg-gray-950" />;
  if (status !== 'authenticated' || session?.user?.role !== 'ADMIN') return null;

  const isKycCall = /^\/admin\/kyc\/[^/]+$/.test(pathname || '');

  // Video KYC call — fullscreen, no admin chrome (sidebar/padding causes scroll)
  if (isKycCall) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-950 overflow-hidden">
        {children}
      </div>
    );
  }

  const activeId = pathname.split('/admin/')[1]?.split('/')[0] || 'overview';
  const activeTab = ADMIN_TABS.find(t => t.id === activeId);
  const isSupportPage = activeId === 'support';

  const NavItem = ({ tab }) => {
    const isActive = tab.id === activeId;
    const badgeCount = tab.badge ? stats?.[tab.badge] : 0;
    return (
      <Link
        href={`/admin/${tab.id}`}
        scroll={false}
        onClick={() => {
          saveSidebarScroll();
          setMobileOpen(false);
        }}
        onMouseDown={saveSidebarScroll}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'vd-gradient-gold text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
      >
        <tab.icon className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1 text-left">{tab.label}</span>
        {badgeCount > 0 && (
          <span className="bg-red-500 text-white text-[10px] font-bold min-w-[1.25rem] h-5 px-1 rounded-full flex items-center justify-center">
            {badgeCount > 99 ? '99+' : badgeCount}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 vd-gradient-gold rounded-full flex items-center justify-center">
            <Heart className="w-3.5 h-3.5 text-white fill-white" />
          </div>
          <span className="font-bold">Milan Admin</span>
        </div>
        <button onClick={() => setMobileOpen(o => !o)} className="p-2 text-gray-400 hover:text-white">
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-20 bg-black/60" onClick={() => setMobileOpen(false)}>
          <div className="w-64 h-full bg-gray-900 border-r border-gray-800 flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-800">
              <p className="text-xs text-gray-500 truncate">{session?.user?.email}</p>
            </div>
            <nav
              ref={mobileNavRef}
              className="flex-1 p-3 space-y-1 overflow-y-auto overscroll-contain"
              style={{ overflowAnchor: 'none' }}
              onScroll={(e) => { sidebarScrollTop.current = e.currentTarget.scrollTop; }}
            >
              {ADMIN_TABS.map(t => <NavItem key={t.id} tab={t} />)}
            </nav>
            <div className="p-3 border-t border-gray-800 space-y-1">
              <Link href="/dashboard" scroll={false} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-all">
                <Eye className="w-4 h-4" /> View Site
              </Link>
              <button onClick={() => signOut({ callbackUrl: '/login' })} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-900/20 transition-all">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 bg-gray-900 border-r border-gray-800 flex-col fixed inset-y-0 left-0 z-20 overflow-hidden">
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 vd-gradient-gold rounded-full flex items-center justify-center">
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="font-bold text-lg">Milan Admin</span>
          </div>
          <p className="text-xs text-gray-500 truncate">{session?.user?.email}</p>
        </div>
        <nav
          ref={desktopNavRef}
          className="flex-1 p-3 space-y-1 overflow-y-auto overscroll-contain min-h-0"
          style={{ overflowAnchor: 'none' }}
          onScroll={(e) => { sidebarScrollTop.current = e.currentTarget.scrollTop; }}
        >
          {ADMIN_TABS.map(t => <NavItem key={t.id} tab={t} />)}
        </nav>
        <div className="p-3 border-t border-gray-800 space-y-1 shrink-0">
          <Link href="/dashboard" scroll={false} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-all">
            <Eye className="w-4 h-4" /> View Site
          </Link>
          <button onClick={() => signOut({ callbackUrl: '/login' })} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-900/20 transition-all">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className={`flex-1 md:ml-64 pt-14 md:pt-0 ${isSupportPage ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
        <div className={`px-4 md:px-6 py-6 ${isSupportPage ? 'h-full flex flex-col overflow-hidden min-h-0' : ''}`}>
          <div className={`flex items-center justify-between shrink-0 ${isSupportPage ? 'mb-4' : 'mb-6'}`}>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">{activeTab?.label || 'Admin'}</h1>
              <p className="text-gray-500 text-xs mt-0.5 hidden sm:block">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <AdminNotifications onStatsRefresh={refreshStats} />
              <button onClick={() => window.location.reload()}
                className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-xl text-sm hover:bg-gray-700 transition-colors">
                <RefreshCw className="w-4 h-4" /> <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
          <div className={isSupportPage ? 'flex-1 min-h-0 overflow-hidden' : undefined}>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
