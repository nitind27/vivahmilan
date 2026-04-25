'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import {
  BarChart2, UserCheck, Users, Sparkles, UserPlus, Crown,
  Bell, Activity, Shield, Flag, Star, Settings, Heart,
  FileText, Edit2, Lock, MessageCircle, LogOut, Eye, RefreshCw
} from 'lucide-react';

export const ADMIN_TABS = [
  { id: 'overview',      label: 'Overview',         icon: BarChart2,     badge: null },
  { id: 'pending',       label: 'Pending Approval',  icon: UserCheck,     badge: 'pendingAdminVerify' },
  { id: 'members',       label: 'All Members',       icon: Users,         badge: null },
  { id: 'matchmaker',    label: 'Match Maker',       icon: Sparkles,      badge: null },
  { id: 'createprofile', label: 'Create Profile',    icon: UserPlus,      badge: null },
  { id: 'premium',       label: 'Premium Manager',   icon: Crown,         badge: null },
  { id: 'broadcast',     label: 'Broadcast',         icon: Bell,          badge: null },
  { id: 'activity',      label: 'Activity Log',      icon: Activity,      badge: null },
  { id: 'users',         label: 'All Users',         icon: Users,         badge: null },
  { id: 'verifications', label: 'ID Verifications',  icon: Shield,        badge: 'pendingVerifications' },
  { id: 'reports',       label: 'Reports',           icon: Flag,          badge: 'pendingReports' },
  { id: 'subscriptions', label: 'Subscriptions',     icon: Star,          badge: null },
  { id: 'plans',         label: 'Plan Config',       icon: Settings,      badge: null },
  { id: 'coupons',       label: 'Coupon Codes',      icon: Star,          badge: null },
  { id: 'stories',       label: 'Success Stories',   icon: Heart,         badge: null },
  { id: 'homepage',      label: 'Homepage Content',  icon: FileText,      badge: null },
  { id: 'options',       label: 'Profile Options',   icon: Edit2,         badge: null },
  { id: 'siteconfig',    label: 'Site Settings',     icon: Lock,          badge: null },
  { id: 'support',       label: 'Support Chat',      icon: MessageCircle, badge: null },
];

export default function AdminLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [stats, setStats] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') router.push('/dashboard');
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      fetch('/api/admin/stats').then(r => r.json()).then(setStats).catch(() => {});
    }
  }, [status, session]);

  if (status === 'loading') return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-vd-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (status !== 'authenticated' || session?.user?.role !== 'ADMIN') return null;

  const activeId = pathname.split('/admin/')[1]?.split('/')[0] || 'overview';
  const activeTab = ADMIN_TABS.find(t => t.id === activeId);

  const NavItem = ({ tab }) => {
    const isActive = tab.id === activeId;
    const badgeCount = tab.badge ? stats?.[tab.badge] : 0;
    return (
      <Link href={`/admin/${tab.id}`}
        onClick={() => setMobileOpen(false)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'vd-gradient-gold text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
        <tab.icon className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1 text-left">{tab.label}</span>
        {badgeCount > 0 && (
          <span className="bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">{badgeCount}</span>
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
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {ADMIN_TABS.map(t => <NavItem key={t.id} tab={t} />)}
            </nav>
            <div className="p-3 border-t border-gray-800 space-y-1">
              <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-all">
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
      <aside className="hidden md:flex w-64 bg-gray-900 border-r border-gray-800 flex-col fixed h-full z-20">
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 vd-gradient-gold rounded-full flex items-center justify-center">
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="font-bold text-lg">Milan Admin</span>
          </div>
          <p className="text-xs text-gray-500 truncate">{session?.user?.email}</p>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {ADMIN_TABS.map(t => <NavItem key={t.id} tab={t} />)}
        </nav>
        <div className="p-3 border-t border-gray-800 space-y-1">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-all">
            <Eye className="w-4 h-4" /> View Site
          </Link>
          <button onClick={() => signOut({ callbackUrl: '/login' })} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-900/20 transition-all">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-64 pt-14 md:pt-0 min-h-screen">
        <div className="px-4 md:px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl md:text-2xl font-bold">{activeTab?.label || 'Admin'}</h1>
              <p className="text-gray-500 text-xs mt-0.5 hidden sm:block">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <button onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-xl text-sm hover:bg-gray-700 transition-colors">
              <RefreshCw className="w-4 h-4" /> <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
