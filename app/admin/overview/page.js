'use client';
import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users, Star, UserCheck, Flag, MessageCircle, Heart, TrendingUp, Shield,
  Search, X, CheckCircle, RefreshCw, Crown, Sparkles, Bell,
  Eye, ChevronRight, ArrowUpRight, ArrowDownRight, MapPin, Calendar, Zap,
  AlertTriangle, CreditCard, LayoutGrid, SlidersHorizontal
} from 'lucide-react';
import { format } from 'date-fns';
import AdminUserProfileModal from '@/components/AdminUserProfileModal';
import { ADMIN_TABS } from '@/app/admin/layout';

const PERIOD_OPTIONS = [
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
  { value: 365, label: '1 year' },
];

function fmt(n) {
  if (n == null) return '—';
  return Number(n).toLocaleString('en-IN');
}

function fmtCurrency(n) {
  if (n == null) return '—';
  return `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-gray-700/80 rounded-lg ${className}`} />;
}

function StatCardSkeleton() {
  return (
    <div className="bg-gray-800 rounded-2xl p-4 border border-gray-700 h-full min-h-[120px]">
      <Skeleton className="w-10 h-10 rounded-xl mb-3" />
      <Skeleton className="h-7 w-20 mb-2" />
      <Skeleton className="h-3.5 w-28 mb-1.5" />
      <Skeleton className="h-3 w-36" />
    </div>
  );
}

function DonutCardSkeleton() {
  return (
    <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700 min-h-[220px]">
      <Skeleton className="h-4 w-32 mb-4" />
      <div className="flex items-center gap-4">
        <Skeleton className="w-[120px] h-[120px] rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2.5">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-3.5 w-full" />)}
        </div>
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="flex items-end gap-1 h-28">
      {Array.from({ length: 12 }).map((_, i) => (
        <Skeleton key={i} className="flex-1 rounded-t-sm" style={{ height: `${20 + (i % 5) * 16}px` }} />
      ))}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, bg, sub, trend, href, onClick, loading }) {
  if (loading) return <StatCardSkeleton />;

  const inner = (
    <div className={`bg-gray-800 rounded-2xl p-4 border border-gray-700 h-full min-w-0 overflow-hidden transition-all ${href || onClick ? 'hover:border-gray-600 hover:bg-gray-800/80 cursor-pointer group' : ''}`}>
      <div className="flex items-start justify-between gap-1.5 mb-2.5">
        <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
        {(href || onClick) && (
          <ChevronRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-gray-400 transition-colors flex-shrink-0 mt-0.5" />
        )}
        {trend != null && (
          <span className={`flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${trend >= 0 ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
            {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-lg sm:text-xl font-bold text-white truncate tabular-nums leading-tight">{value ?? '—'}</p>
      <p className="text-gray-400 text-xs sm:text-sm mt-0.5 truncate">{label}</p>
      {sub && <p className="text-[11px] text-gray-500 mt-1 line-clamp-2 leading-snug">{sub}</p>}
    </div>
  );

  if (href) return <Link href={href} className="block h-full min-w-0">{inner}</Link>;
  if (onClick) return <button type="button" onClick={onClick} className="w-full h-full min-w-0 text-left">{inner}</button>;
  return inner;
}

function DonutChart({ segments, size = 120, centerLabel, centerValue }) {
  const total = segments.reduce((s, x) => s + (x.value || 0), 0) || 1;
  let acc = 0;
  const stops = segments
    .filter(s => s.value > 0)
    .map(s => {
      const start = (acc / total) * 100;
      acc += s.value;
      const end = (acc / total) * 100;
      return `${s.color} ${start}% ${end}%`;
    })
    .join(', ');

  const hole = Math.round(size * 0.58);

  return (
    <div className="relative flex-shrink-0 mx-auto sm:mx-0" style={{ width: size, height: size }}>
      <div
        className="rounded-full"
        style={{
          width: size,
          height: size,
          background: stops ? `conic-gradient(${stops})` : '#374151',
        }}
      />
      <div
        className="absolute inset-0 m-auto rounded-full bg-gray-800 flex flex-col items-center justify-center text-center px-1"
        style={{ width: hole, height: hole }}
      >
        <span className="text-sm sm:text-base font-bold text-white leading-none truncate max-w-full tabular-nums">
          {centerValue ?? fmt(total)}
        </span>
        {centerLabel && (
          <span className="text-[9px] text-gray-500 uppercase tracking-wide mt-0.5">{centerLabel}</span>
        )}
      </div>
    </div>
  );
}

function DonutCard({ title, icon: Icon, segments, legend, centerLabel, loading }) {
  if (loading) return <DonutCardSkeleton />;

  const total = segments.reduce((s, x) => s + (x.value || 0), 0);
  return (
    <div className="bg-gray-800 rounded-2xl p-4 sm:p-5 border border-gray-700 min-w-0 overflow-hidden min-h-[220px]">
      <h3 className="font-semibold text-white mb-3 flex items-center gap-2 text-sm truncate">
        {Icon && <Icon className="w-4 h-4 text-vd-primary flex-shrink-0" />}
        <span className="truncate">{title}</span>
      </h3>
      <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 min-w-0">
        <DonutChart segments={segments} centerLabel={centerLabel} centerValue={fmt(total)} />
        <div className="flex-1 w-full min-w-0 space-y-1.5">
          {legend.map(item => {
            const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
            return (
              <div key={item.label} className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.color }} />
                <span className="text-xs text-gray-400 flex-1 truncate min-w-0">{item.label}</span>
                <span className="text-xs font-semibold text-white tabular-nums flex-shrink-0">{fmt(item.value)}</span>
                <span className="text-[10px] text-gray-500 w-7 text-right flex-shrink-0 tabular-nums">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function sampleTrendPoints(points, maxBars = 30) {
  if (!points?.length || points.length <= maxBars) return points || [];
  const step = Math.ceil(points.length / maxBars);
  return points.filter((_, i) => i % step === 0 || i === points.length - 1);
}

function TrendChart({ data, labelKey = 'date', valueKey = 'cnt', barClass = 'bg-vd-primary', emptyLabel = 'No data', loading }) {
  if (loading) {
    return (
      <div className="flex items-end gap-1 h-28">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="flex-1 rounded-t-sm" style={{ height: `${24 + (i % 4) * 14}px` }} />
        ))}
      </div>
    );
  }

  const points = sampleTrendPoints(data || []);
  const max = Math.max(...points.map(d => Number(d[valueKey] || 0)), 1);

  if (points.length === 0) {
    return <p className="text-center py-8 text-gray-500 text-sm">{emptyLabel}</p>;
  }

  return (
    <div className="min-w-0 overflow-hidden">
      <div className="flex items-end gap-px h-28 overflow-x-auto pb-1">
        {points.map((t, i) => {
          const val = Number(t[valueKey] || 0);
          const h = Math.max(4, Math.round((val / max) * 100));
          const dateLabel = t[labelKey] ? format(new Date(t[labelKey]), 'dd MMM') : '';
          return (
            <div key={i} className="flex-1 min-w-[6px] max-w-[20px] flex flex-col justify-end group relative">
              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-700 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                {dateLabel}: {fmt(val)}
              </div>
              <div
                className={`w-full ${barClass} opacity-80 group-hover:opacity-100 rounded-t-sm transition-opacity`}
                style={{ height: `${h}px` }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] sm:text-xs text-gray-500 mt-2 gap-2">
        <span className="truncate">{points[0]?.[labelKey] ? format(new Date(points[0][labelKey]), 'dd MMM yyyy') : ''}</span>
        <span className="truncate text-right">{points[points.length - 1]?.[labelKey] ? format(new Date(points[points.length - 1][labelKey]), 'dd MMM yyyy') : ''}</span>
      </div>
    </div>
  );
}

function BarRankList({ items, labelKey, valueKey, subKey, sortDesc = true, maxItems = 8, loading }) {
  const sorted = useMemo(() => {
    const list = [...(items || [])];
    list.sort((a, b) => sortDesc
      ? Number(b[valueKey] || 0) - Number(a[valueKey] || 0)
      : Number(a[valueKey] || 0) - Number(b[valueKey] || 0));
    return list.slice(0, maxItems);
  }, [items, valueKey, sortDesc, maxItems]);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="h-3.5 w-full mb-1.5" />
            <Skeleton className="h-1.5 w-full ml-5" />
          </div>
        ))}
      </div>
    );
  }

  const max = sorted[0] ? Number(sorted[0][valueKey] || 0) : 1;

  if (sorted.length === 0) return <p className="text-gray-500 text-sm py-4 text-center">No data yet</p>;

  return (
    <div className="space-y-2 min-w-0">
      {sorted.map((item, i) => {
        const val = Number(item[valueKey] || 0);
        const pct = max > 0 ? Math.round((val / max) * 100) : 0;
        const label = item[labelKey] || 'Unknown';
        const sub = subKey ? item[subKey] : null;
        return (
          <div key={`${label}-${i}`} className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs sm:text-sm mb-1 min-w-0">
              <span className="text-gray-500 w-4 text-[10px] flex-shrink-0 tabular-nums">{i + 1}</span>
              <span className="text-white flex-1 truncate min-w-0" title={sub ? `${label}, ${sub}` : label}>
                {label}{sub ? `, ${sub}` : ''}
              </span>
              <span className="text-gray-300 font-semibold flex-shrink-0 tabular-nums">{fmt(val)}</span>
            </div>
            <div className="h-1.5 bg-gray-700 rounded-full ml-5 overflow-hidden">
              <div className="h-1.5 bg-vd-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function UserSearchBar() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [viewUserId, setViewUserId] = useState(null);
  const inputRef = useRef(null);

  const enrichUser = async (baseUser) => {
    if (!baseUser?.id) return baseUser;
    try {
      const res = await fetch(`/api/admin/user-profile?userId=${baseUser.id}`);
      if (!res.ok) return baseUser;
      const full = await res.json();
      const u = full.user || {};
      const p = full.profile || {};
      const s = full.stats || {};
      const active = full.activeSubscription;
      return {
        ...baseUser,
        ...u,
        gender: p.gender || baseUser.gender,
        dob: p.dob || baseUser.dob,
        religion: p.religion || baseUser.religion,
        caste: p.caste || baseUser.caste,
        city: p.city || baseUser.city,
        state: p.state || baseUser.state,
        country: p.country || baseUser.country,
        education: p.education || baseUser.education,
        profession: p.profession || baseUser.profession,
        profileComplete: p.profileComplete,
        mainPhoto: u.photo || baseUser.mainPhoto || baseUser.image,
        stats: s,
        activeSubscription: active,
        premiumPlanLabel: full.premiumPlanConfig?.displayName || u.premiumPlan || active?.planDisplayName || active?.plan,
      };
    } catch {
      return baseUser;
    }
  };

  const search = async () => {
    const val = q.trim();
    if (!val) return;
    setLoading(true);
    setResult(null);
    setNotFound(false);
    try {
      let found = null;
      const res = await fetch(`/api/admin/matchmaker?phone=${encodeURIComponent(val)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.user) found = data.user;
      }
      if (!found) {
        const res2 = await fetch(`/api/admin/users?search=${encodeURIComponent(val)}&limit=1`);
        const data2 = await res2.json();
        const user = data2.users?.[0];
        if (user) {
          if (user.phone) {
            const res3 = await fetch(`/api/admin/matchmaker?phone=${encodeURIComponent(user.phone)}`);
            if (res3.ok) {
              const d3 = await res3.json();
              if (d3.user) found = d3.user;
            }
          }
          if (!found) {
            found = {
              ...user,
              gender: user.profile?.gender,
              dob: user.profile?.dob,
              religion: user.profile?.religion,
              caste: user.profile?.caste,
              city: user.profile?.city,
              state: user.profile?.state,
              country: user.profile?.country,
              education: user.profile?.education,
              profession: user.profile?.profession,
              mainPhoto: user.image,
            };
          }
        }
      }
      if (found) setResult(await enrichUser(found));
      else setNotFound(true);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const clear = () => { setQ(''); setResult(null); setNotFound(false); inputRef.current?.focus(); };
  const calcAge = (dob) => dob ? Math.floor((Date.now() - new Date(dob)) / 31557600000) : null;

  return (
    <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-700 bg-gradient-to-r from-gray-800 to-gray-800/50">
        <p className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" /> Quick User Search
        </p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              ref={inputRef}
              value={q}
              onChange={e => setQ(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search()}
              placeholder="Search by phone, name or email…"
              className="w-full pl-9 pr-8 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm text-white focus:outline-none focus:border-vd-primary placeholder:text-gray-500"
            />
            {q && (
              <button type="button" onClick={clear} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={search}
            disabled={loading || !q.trim()}
            className="px-5 py-2.5 bg-vd-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-2 transition-opacity"
          >
            {loading
              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <Search className="w-4 h-4" />}
            Search
          </button>
        </div>
      </div>

      {notFound && (
        <div className="px-5 py-4 text-sm text-gray-400 flex items-center gap-2">
          <X className="w-4 h-4 text-red-400" /> No user found for &quot;<span className="text-white">{q}</span>&quot;
        </div>
      )}

      {result && (() => {
        const age = calcAge(result.dob);
        const photo = result.mainPhoto || result.image;
        return (
          <div className="p-5">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-700 flex-shrink-0 flex items-center justify-center">
                {photo
                  ? <img src={photo} alt="" className="w-full h-full object-cover" />
                  : <span className="text-3xl font-bold text-gray-400">{result.name?.[0]}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="text-lg font-bold text-white">{result.name}</h3>
                  {!!result.adminVerified && <span className="text-xs bg-green-900/30 text-green-400 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Verified</span>}
                  {!!result.isPremium && <span className="text-xs bg-yellow-900/30 text-yellow-400 px-2 py-0.5 rounded-full">⭐ Premium</span>}
                  {!result.isActive && <span className="text-xs bg-red-900/30 text-red-400 px-2 py-0.5 rounded-full">🚫 Blocked</span>}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1.5 text-xs text-gray-400 mb-3">
                  {result.email && <span className="flex items-center gap-1 col-span-2 sm:col-span-1">📧 {result.email}</span>}
                  {result.phone && <span className="flex items-center gap-1">📞 {result.phone}</span>}
                  {result.gender && <span>⚧ {result.gender}</span>}
                  {age && <span>🎂 {age} years</span>}
                  {result.religion && <span>🙏 {result.religion}{result.caste ? ` · ${result.caste}` : ''}</span>}
                  {(result.city || result.country) && <span>📍 {[result.city, result.state, result.country].filter(Boolean).join(', ')}</span>}
                  {result.createdAt && <span>📅 Joined {format(new Date(result.createdAt), 'dd MMM yyyy')}</span>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setViewUserId(result.id)} className="flex items-center gap-1.5 px-4 py-2 bg-vd-primary text-white rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity">
                    <Search className="w-3.5 h-3.5" /> View Profile
                  </button>
                  <button type="button" onClick={() => router.push(`/admin/matchmaker?userId=${result.id}`)} className="flex items-center gap-1.5 px-4 py-2 bg-pink-700/30 text-pink-400 hover:bg-pink-700/50 rounded-xl text-xs font-semibold transition-colors">
                    💕 Find Matches
                  </button>
                  <button type="button" onClick={() => router.push(`/admin/createprofile?userId=${result.id}`)} className="flex items-center gap-1.5 px-4 py-2 bg-blue-700/30 text-blue-400 hover:bg-blue-700/50 rounded-xl text-xs font-semibold transition-colors">
                    ✏️ Edit Profile
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {!result && !notFound && !loading && (
        <div className="px-5 py-3 text-xs text-gray-600 text-center">
          Enter phone number, name or email to find a user instantly
        </div>
      )}

      {viewUserId && <AdminUserProfileModal userId={viewUserId} onClose={() => setViewUserId(null)} />}
    </div>
  );
}

const SHORTCUT_GROUPS = [
  { title: 'Members & Profiles', ids: ['pending', 'members', 'createprofile', 'matchmaker', 'premium'] },
  { title: 'Revenue & Plans', ids: ['subscriptions', 'plans', 'coupons', 'affiliates'] },
  { title: 'Content & Site', ids: ['homepage', 'stories', 'marketing', 'options', 'siteconfig'] },
  { title: 'Moderation', ids: ['reports', 'activity', 'broadcast', 'support'] },
  { title: 'Insights', ids: ['analytics'] },
];

export default function OverviewPage() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [days, setDays] = useState(30);
  const [geoSortDesc, setGeoSortDesc] = useState(true);
  const [userSort, setUserSort] = useState({ key: 'createdAt', desc: true });
  const [userFilter, setUserFilter] = useState('all');
  const [showAllShortcuts, setShowAllShortcuts] = useState(false);
  const loadRef = useRef(0);
  const hasLoadedRef = useRef(false);

  const loadStats = useCallback(async (opts = {}) => {
    const { isRefresh = false } = opts;
    const loadId = ++loadRef.current;

    if (!isRefresh) setInitialLoading(true);
    else {
      setRefreshing(true);
      setChartsLoading(true);
    }

    try {
      const liteRes = await fetch(`/api/admin/stats?days=${days}&lite=1`, { cache: 'no-store' });
      if (!liteRes.ok) throw new Error('lite failed');
      const liteData = await liteRes.json();
      if (loadId !== loadRef.current) return;
      setStats(liteData);
      setInitialLoading(false);

      setChartsLoading(true);
      const fullRes = await fetch(`/api/admin/stats?days=${days}`, { cache: 'no-store' });
      if (!fullRes.ok) throw new Error('full failed');
      const fullData = await fullRes.json();
      if (loadId !== loadRef.current) return;
      setStats(fullData);
    } catch {
      if (loadId === loadRef.current) setStats(null);
    } finally {
      if (loadId === loadRef.current) {
        setInitialLoading(false);
        setChartsLoading(false);
        setRefreshing(false);
      }
    }
  }, [days]);

  useEffect(() => {
    loadStats({ isRefresh: hasLoadedRef.current });
    hasLoadedRef.current = true;
  }, [loadStats]);

  const pendingTotal = (stats?.pendingAdminVerify ?? 0) + (stats?.pendingReports ?? 0) + (stats?.pendingVerifications ?? 0);

  const sortedUsers = useMemo(() => {
    let list = [...(stats?.recentUsers || [])];
    if (userFilter === 'premium') list = list.filter(u => u.isPremium);
    else if (userFilter === 'pending') list = list.filter(u => !u.adminVerified);
    else if (userFilter === 'blocked') list = list.filter(u => !u.isActive);

    list.sort((a, b) => {
      let av = a[userSort.key];
      let bv = b[userSort.key];
      if (userSort.key === 'createdAt') {
        av = new Date(av || 0).getTime();
        bv = new Date(bv || 0).getTime();
      } else if (typeof av === 'string') {
        av = av?.toLowerCase() || '';
        bv = bv?.toLowerCase() || '';
      } else {
        av = Number(av || 0);
        bv = Number(bv || 0);
      }
      if (av < bv) return userSort.desc ? 1 : -1;
      if (av > bv) return userSort.desc ? -1 : 1;
      return 0;
    });
    return list;
  }, [stats?.recentUsers, userSort, userFilter]);

  const toggleUserSort = (key) => {
    setUserSort(prev => ({ key, desc: prev.key === key ? !prev.desc : true }));
  };

  const genderSegments = [
    { label: 'Male', value: stats?.maleUsers ?? 0, color: '#3b82f6' },
    { label: 'Female', value: stats?.femaleUsers ?? 0, color: '#ec4899' },
    { label: 'Other', value: stats?.otherGenderUsers ?? 0, color: '#8b5cf6' },
  ];

  const userStatusSegments = [
    { label: 'Verified', value: stats?.verifiedUsers ?? 0, color: '#22c55e' },
    { label: 'Pending', value: stats?.pendingAdminVerify ?? 0, color: '#f97316' },
    { label: 'Premium', value: stats?.premiumUsers ?? 0, color: '#eab308' },
    { label: 'Blocked', value: stats?.blockedUsers ?? 0, color: '#ef4444' },
  ];

  const subscriptionSegments = [
    { label: 'Active', value: stats?.activeSubscriptions ?? 0, color: '#22c55e' },
    { label: 'Expired', value: stats?.subscriptionsExpired ?? 0, color: '#6b7280' },
    { label: 'Cancelled', value: stats?.subscriptionsCancelled ?? 0, color: '#ef4444' },
    { label: 'Pending', value: stats?.subscriptionsPending ?? 0, color: '#f59e0b' },
  ];

  const interestSegments = [
    { label: 'Pending', value: stats?.interestsPending ?? 0, color: '#f59e0b' },
    { label: 'Accepted', value: stats?.interestsAccepted ?? 0, color: '#22c55e' },
    { label: 'Rejected', value: stats?.interestsRejected ?? 0, color: '#ef4444' },
  ];

  const showKpiSkeleton = initialLoading && !stats;
  const showChartsSkeleton = chartsLoading || refreshing;

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto">
      {/* Top bar: period filter + refresh */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <SlidersHorizontal className="w-4 h-4 text-vd-primary" />
          <span className="hidden sm:inline">Period:</span>
        </div>
        <div className="flex gap-1 bg-gray-800 rounded-xl p-1 border border-gray-700">
          {PERIOD_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setDays(opt.value)}
              disabled={initialLoading && !stats}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all disabled:opacity-50 ${days === opt.value ? 'bg-vd-primary text-white' : 'text-gray-400 hover:text-white'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => loadStats({ isRefresh: true })}
          disabled={refreshing || initialLoading}
          className="flex items-center gap-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm hover:bg-gray-700 disabled:opacity-50 ml-auto"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{refreshing ? 'Updating…' : 'Refresh'}</span>
        </button>
      </div>

      {refreshing && stats && (
        <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-800/60 border border-gray-700 rounded-xl px-3 py-2">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-vd-primary" />
          Updating dashboard data…
        </div>
      )}

      {/* Pending alerts */}
      {!initialLoading && pendingTotal > 0 && (
        <div className="bg-orange-900/20 border border-orange-700/40 rounded-2xl p-4 flex flex-wrap items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-orange-300">Action required — {pendingTotal} items need attention</p>
            <p className="text-xs text-orange-400/80 mt-0.5">
              {stats?.pendingAdminVerify ?? 0} approvals · {stats?.pendingReports ?? 0} reports · {stats?.pendingVerifications ?? 0} KYC docs
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(stats?.pendingAdminVerify ?? 0) > 0 && (
              <button type="button" onClick={() => router.push('/admin/pending')} className="px-3 py-1.5 bg-orange-600/30 text-orange-300 rounded-lg text-xs font-semibold hover:bg-orange-600/50">
                Review Pending
              </button>
            )}
            {(stats?.pendingReports ?? 0) > 0 && (
              <button type="button" onClick={() => router.push('/admin/reports')} className="px-3 py-1.5 bg-red-600/30 text-red-300 rounded-lg text-xs font-semibold hover:bg-red-600/50">
                View Reports
              </button>
            )}
          </div>
        </div>
      )}

      {!initialLoading && (
      <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-700 flex items-center justify-between">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-vd-primary" /> Admin Shortcuts
          </h3>
          <button
            type="button"
            onClick={() => setShowAllShortcuts(v => !v)}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            {showAllShortcuts ? 'Grouped view' : 'Show all'}
          </button>
        </div>
        <div className="p-4">
          {showAllShortcuts ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
              {ADMIN_TABS.map(tab => {
                const badge = tab.badge ? stats?.[tab.badge] : 0;
                return (
                  <Link
                    key={tab.id}
                    href={`/admin/${tab.id}`}
                    className="flex items-center gap-2.5 px-3 py-3 bg-gray-700/40 hover:bg-gray-700 rounded-xl border border-gray-700/50 hover:border-gray-600 transition-all group min-w-0 overflow-hidden"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0 group-hover:bg-vd-primary/20">
                      <tab.icon className="w-4 h-4 text-gray-400 group-hover:text-vd-primary" />
                    </div>
                    <span className="text-xs font-medium text-gray-300 group-hover:text-white truncate flex-1">{tab.label}</span>
                    {badge > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-bold min-w-[1.1rem] h-4 px-1 rounded-full flex items-center justify-center">
                        {badge > 99 ? '99+' : badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {SHORTCUT_GROUPS.map(group => (
                <div key={group.title}>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{group.title}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                    {group.ids.map(id => {
                      const tab = ADMIN_TABS.find(t => t.id === id);
                      if (!tab) return null;
                      const badge = tab.badge ? stats?.[tab.badge] : 0;
                      return (
                        <Link
                          key={tab.id}
                          href={`/admin/${tab.id}`}
                          className="flex items-center gap-2 px-3 py-2.5 bg-gray-700/30 hover:bg-gray-700 rounded-xl border border-gray-700/50 hover:border-gray-600 transition-all group min-w-0 overflow-hidden"
                        >
                          <tab.icon className="w-4 h-4 text-gray-500 group-hover:text-vd-primary flex-shrink-0" />
                          <span className="text-xs text-gray-400 group-hover:text-white truncate flex-1">{tab.label}</span>
                          {badge > 0 && (
                            <span className="bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                              {badge > 9 ? '9+' : badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <StatCard loading={showKpiSkeleton} icon={Users} label="Total Members" value={fmt(stats?.totalUsers)} color="text-blue-400" bg="bg-blue-900/20" sub={`+${fmt(stats?.newUsersToday)} today · ${fmt(stats?.newUsersPeriod)} in period`} href="/admin/members" />
        <StatCard loading={showKpiSkeleton} icon={Star} label="Premium Members" value={fmt(stats?.premiumUsers)} color="text-yellow-400" bg="bg-yellow-900/20" sub={`${stats?.premiumRate ?? 0}% · ${fmt(stats?.activeSubscriptions)} subs`} href="/admin/premium" />
        <StatCard loading={showKpiSkeleton} icon={CreditCard} label="Revenue (Period)" value={fmtCurrency(stats?.periodRevenue)} color="text-green-400" bg="bg-green-900/20" sub={`Total ${fmtCurrency(stats?.totalRevenue)}`} href="/admin/subscriptions" />
        <StatCard loading={showKpiSkeleton} icon={Heart} label="Engagement" value={fmt(stats?.totalInterests)} color="text-pink-400" bg="bg-pink-900/20" sub={`${fmt(stats?.totalMessages)} msgs · ${fmt(stats?.totalChats)} chats`} href="/admin/activity" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2.5 sm:gap-3">
        <StatCard loading={showKpiSkeleton} icon={UserCheck} label="Pending Approval" value={fmt(stats?.pendingAdminVerify)} color="text-orange-400" bg="bg-orange-900/20" href="/admin/pending" />
        <StatCard loading={showKpiSkeleton} icon={Flag} label="Reports" value={fmt(stats?.pendingReports)} color="text-red-400" bg="bg-red-900/20" href="/admin/reports" />
        <StatCard loading={showKpiSkeleton} icon={Shield} label="KYC Pending" value={fmt(stats?.pendingVerifications)} color="text-cyan-400" bg="bg-cyan-900/20" href="/admin/pending" />
        <StatCard loading={showKpiSkeleton} icon={TrendingUp} label="New This Month" value={fmt(stats?.newUsersMonth)} color="text-green-400" bg="bg-green-900/20" sub={`Profile ${stats?.avgProfileComplete ?? 0}% avg`} />
        <StatCard loading={showKpiSkeleton} icon={Eye} label="Profile Views" value={fmt(stats?.totalProfileViews)} color="text-purple-400" bg="bg-purple-900/20" />
        <StatCard loading={showKpiSkeleton} icon={MessageCircle} label="Today Activity" value={fmt(stats?.newMessagesToday)} color="text-vd-primary" bg="bg-vd-accent-soft dark:bg-vd-accent/20" sub={`${fmt(stats?.newInterestsToday)} interests`} />
      </div>

      {/* Donut charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <DonutCard loading={showKpiSkeleton} title="Gender Split" icon={Users} segments={genderSegments} legend={genderSegments} centerLabel="Total" />
        <DonutCard loading={showKpiSkeleton} title="Member Status" icon={UserCheck} segments={userStatusSegments} legend={userStatusSegments} centerLabel="Users" />
        <DonutCard loading={showKpiSkeleton} title="Subscriptions" icon={Crown} segments={subscriptionSegments} legend={subscriptionSegments} centerLabel="Subs" />
        <DonutCard loading={showKpiSkeleton} title="Interests" icon={Heart} segments={interestSegments} legend={interestSegments} centerLabel="Total" />
      </div>

      {/* Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-gray-800 rounded-2xl p-4 sm:p-5 border border-gray-700 min-w-0 overflow-hidden">
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2 text-sm min-w-0">
            <Calendar className="w-4 h-4 text-vd-primary flex-shrink-0" />
            <span className="truncate">New Registrations</span>
            <span className="text-[10px] text-gray-500 font-normal ml-auto flex-shrink-0">{days}d</span>
          </h3>
          {showChartsSkeleton ? <ChartSkeleton /> : null}
          {!showChartsSkeleton && <TrendChart data={stats?.dailyRegistrations} barClass="bg-blue-500" />}
        </div>
        <div className="bg-gray-800 rounded-2xl p-4 sm:p-5 border border-gray-700 min-w-0 overflow-hidden">
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2 text-sm min-w-0">
            <Heart className="w-4 h-4 text-pink-400 flex-shrink-0" />
            <span className="truncate">Interests Sent</span>
            <span className="text-[10px] text-gray-500 font-normal ml-auto flex-shrink-0">{days}d</span>
          </h3>
          {showChartsSkeleton ? <ChartSkeleton /> : null}
          {!showChartsSkeleton && <TrendChart data={stats?.dailyInterests} barClass="bg-pink-500" />}
        </div>
      </div>

      {/* Geo + Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-gray-800 rounded-2xl p-4 sm:p-5 border border-gray-700 min-w-0 overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-3 min-w-0">
            <h3 className="font-semibold text-white flex items-center gap-2 text-sm min-w-0">
              <MapPin className="w-4 h-4 text-vd-primary flex-shrink-0" />
              <span className="truncate">Top Cities</span>
            </h3>
            <button type="button" onClick={() => setGeoSortDesc(v => !v)} className="text-[10px] text-gray-500 hover:text-white flex-shrink-0 whitespace-nowrap">
              {geoSortDesc ? 'High→Low' : 'Low→High'}
            </button>
          </div>
          <BarRankList loading={showChartsSkeleton} items={stats?.topCities?.map(c => ({ label: c.city, state: c.state, cnt: Number(c.cnt) }))} labelKey="label" valueKey="cnt" subKey="state" sortDesc={geoSortDesc} />
        </div>
        <div className="bg-gray-800 rounded-2xl p-4 sm:p-5 border border-gray-700 min-w-0 overflow-hidden">
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-blue-400 flex-shrink-0" /> Top States
          </h3>
          <BarRankList loading={showChartsSkeleton} items={stats?.topStates?.map(s => ({ label: s.state, cnt: Number(s.cnt) }))} labelKey="label" valueKey="cnt" sortDesc={geoSortDesc} />
        </div>
        <div className="bg-gray-800 rounded-2xl p-4 sm:p-5 border border-gray-700 min-w-0 overflow-hidden">
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2 text-sm">
            <Sparkles className="w-4 h-4 text-yellow-400 flex-shrink-0" /> Top Religions
          </h3>
          <BarRankList loading={showChartsSkeleton} items={stats?.topReligions?.map(r => ({ label: r.religion, cnt: Number(r.cnt) }))} labelKey="label" valueKey="cnt" />
        </div>
      </div>

      {/* Subscription plans breakdown */}
      {(showChartsSkeleton || (stats?.subscriptionByPlan?.length ?? 0) > 0) && (
        <div className="bg-gray-800 rounded-2xl p-4 sm:p-5 border border-gray-700 min-w-0 overflow-hidden">
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2 text-sm">
            <Crown className="w-4 h-4 text-yellow-400 flex-shrink-0" /> Plan Distribution
          </h3>
          {showChartsSkeleton ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-gray-700/40 rounded-xl p-3 border border-gray-700/50">
                  <Skeleton className="h-3 w-16 mb-2" />
                  <Skeleton className="h-6 w-10 mb-1" />
                  <Skeleton className="h-3 w-14" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {stats.subscriptionByPlan.map(plan => (
                <div key={plan.plan} className="bg-gray-700/40 rounded-xl p-3 border border-gray-700/50 min-w-0 overflow-hidden">
                  <p className="text-[11px] text-gray-400 truncate capitalize">{plan.plan}</p>
                  <p className="text-base sm:text-lg font-bold text-white mt-1 tabular-nums truncate">{fmt(plan.cnt)}</p>
                  <p className="text-[11px] text-green-400 mt-0.5 truncate tabular-nums">{fmtCurrency(plan.revenue)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recent members table */}
      <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-700 flex flex-wrap items-center gap-3">
          <h3 className="font-semibold text-white flex items-center gap-2 flex-1">
            <Users className="w-4 h-4 text-vd-primary" /> Recent Members
          </h3>
          <div className="flex gap-1 bg-gray-700/50 rounded-lg p-0.5">
            {[
              { id: 'all', label: 'All' },
              { id: 'premium', label: 'Premium' },
              { id: 'pending', label: 'Pending' },
              { id: 'blocked', label: 'Blocked' },
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setUserFilter(f.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${userFilter === f.id ? 'bg-vd-primary text-white' : 'text-gray-400 hover:text-white'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <Link href="/admin/members" className="text-xs text-vd-primary hover:underline flex items-center gap-1">
            View all <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-700/30">
              <tr>
                {[
                  { key: 'name', label: 'Member' },
                  { key: 'gender', label: 'Gender' },
                  { key: 'city', label: 'Location' },
                  { key: 'profileComplete', label: 'Profile %' },
                  { key: 'createdAt', label: 'Joined' },
                  { key: null, label: 'Status' },
                ].map(col => (
                  <th
                    key={col.label}
                    className={`text-left px-4 py-2.5 text-xs text-gray-400 font-medium whitespace-nowrap ${col.key ? 'cursor-pointer hover:text-white select-none' : ''}`}
                    onClick={col.key ? () => toggleUserSort(col.key) : undefined}
                  >
                    {col.label}
                    {col.key && userSort.key === col.key && (userSort.desc ? ' ↓' : ' ↑')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/30">
              {showChartsSkeleton && (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={`sk-${i}`}>
                    <td colSpan={6} className="px-4 py-3">
                      <Skeleton className="h-8 w-full" />
                    </td>
                  </tr>
                ))
              )}
              {!showChartsSkeleton && sortedUsers.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-gray-500">No members found</td></tr>
              )}
              {!showChartsSkeleton && sortedUsers.map(u => (
                <tr key={u.id} className="hover:bg-gray-700/20 transition-colors">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-700 flex-shrink-0 flex items-center justify-center">
                        {u.photo
                          ? <img src={u.photo} alt="" className="w-full h-full object-cover" />
                          : <span className="text-xs font-bold text-gray-400">{u.name?.[0]}</span>}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-medium truncate">{u.name || '—'}</p>
                        <p className="text-xs text-gray-500 truncate">{u.email || u.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-gray-400 text-xs">{u.gender || '—'}</td>
                  <td className="px-4 py-2.5 text-gray-400 text-xs">{[u.city, u.state].filter(Boolean).join(', ') || '—'}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-gray-700 rounded-full">
                        <div className="h-1.5 bg-vd-primary rounded-full" style={{ width: `${u.profileComplete || 0}%` }} />
                      </div>
                      <span className="text-xs text-gray-400">{u.profileComplete ?? 0}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-gray-400 text-xs whitespace-nowrap">
                    {u.createdAt ? format(new Date(u.createdAt), 'dd MMM yyyy') : '—'}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {u.isPremium && <span className="text-[10px] bg-yellow-900/30 text-yellow-400 px-1.5 py-0.5 rounded-full">Premium</span>}
                      {u.adminVerified
                        ? <span className="text-[10px] bg-green-900/30 text-green-400 px-1.5 py-0.5 rounded-full">Verified</span>
                        : <span className="text-[10px] bg-orange-900/30 text-orange-400 px-1.5 py-0.5 rounded-full">Pending</span>}
                      {!u.isActive && <span className="text-[10px] bg-red-900/30 text-red-400 px-1.5 py-0.5 rounded-full">Blocked</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick actions row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Approve pending users', count: stats?.pendingAdminVerify, href: '/admin/pending', icon: UserCheck, color: 'from-orange-600/20 to-orange-900/10 border-orange-700/40' },
          { label: 'Review reports', count: stats?.pendingReports, href: '/admin/reports', icon: Flag, color: 'from-red-600/20 to-red-900/10 border-red-700/40' },
          { label: 'Manage subscriptions', count: stats?.activeSubscriptions, href: '/admin/subscriptions', icon: Star, color: 'from-yellow-600/20 to-yellow-900/10 border-yellow-700/40' },
          { label: 'Broadcast message', count: null, href: '/admin/broadcast', icon: Bell, color: 'from-blue-600/20 to-blue-900/10 border-blue-700/40' },
        ].map(action => (
          <button
            key={action.href}
            type="button"
            onClick={() => router.push(action.href)}
            className={`bg-gradient-to-br ${action.color} border rounded-2xl p-4 text-left hover:opacity-90 transition-opacity group`}
          >
            <action.icon className="w-5 h-5 text-white/70 mb-2 group-hover:text-white" />
            <p className="text-sm font-semibold text-white">{action.label}</p>
            {action.count != null && <p className="text-xs text-gray-400 mt-0.5">{fmt(action.count)} pending</p>}
          </button>
        ))}
      </div>

      {/* User search at bottom too for quick access */}
      <UserSearchBar />
    </div>
  );
}
