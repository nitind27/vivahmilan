'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Star, UserCheck, Flag, MessageCircle, Heart, TrendingUp, Shield, Search, Phone, X, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import AdminUserProfileModal from '@/components/AdminUserProfileModal';

function StatCard({ icon: Icon, label, value, color, bg, sub }) {
  return (
    <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
      <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <p className="text-2xl font-bold text-white">{value ?? '—'}</p>
      <p className="text-gray-400 text-sm mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

function UserSearchBar() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // found user
  const [notFound, setNotFound] = useState(false);
  const [viewUserId, setViewUserId] = useState(null);
  const inputRef = useRef(null);

  const search = async () => {
    const val = q.trim();
    if (!val) return;
    setLoading(true);
    setResult(null);
    setNotFound(false);
    try {
      // Try phone lookup first via matchmaker API, then fallback to users search
      const res = await fetch(`/api/admin/matchmaker?phone=${encodeURIComponent(val)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.user) { setResult(data.user); return; }
      }
      // Fallback: search by name/email
      const res2 = await fetch(`/api/admin/users?search=${encodeURIComponent(val)}&limit=1`);
      const data2 = await res2.json();
      const user = data2.users?.[0];
      if (user) {
        // Fetch full profile
        const res3 = await fetch(`/api/admin/matchmaker?phone=${encodeURIComponent(user.phone || '')}`);
        if (res3.ok && user.phone) {
          const d3 = await res3.json();
          if (d3.user) { setResult(d3.user); return; }
        }
        setResult({ ...user, gender: user.profile?.gender, dob: user.profile?.dob, religion: user.profile?.religion, caste: user.profile?.caste, city: user.profile?.city, state: user.profile?.state, country: user.profile?.country, education: user.profile?.education, profession: user.profile?.profession, mainPhoto: user.image });
      } else {
        setNotFound(true);
      }
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
      {/* Search header */}
      <div className="px-5 py-4 border-b border-gray-700">
        <p className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Phone className="w-4 h-4 text-vd-primary" /> Quick User Search
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
              <button onClick={clear} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
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

      {/* Not found */}
      {notFound && (
        <div className="px-5 py-4 text-sm text-gray-400 flex items-center gap-2">
          <X className="w-4 h-4 text-red-400" /> No user found for "<span className="text-white">{q}</span>"
        </div>
      )}

      {/* Result card */}
      {result && (() => {
        const age = calcAge(result.dob);
        const photo = result.mainPhoto || result.image;
        return (
          <div className="p-5">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Photo */}
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-700 flex-shrink-0 flex items-center justify-center">
                {photo
                  ? <img src={photo} alt="" className="w-full h-full object-cover" />
                  : <span className="text-3xl font-bold text-gray-400">{result.name?.[0]}</span>}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="text-lg font-bold text-white">{result.name}</h3>
                  {result.adminVerified && <span className="text-xs bg-green-900/30 text-green-400 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Verified</span>}
                  {result.isPremium && <span className="text-xs bg-yellow-900/30 text-yellow-400 px-2 py-0.5 rounded-full">⭐ Premium</span>}
                  {!result.isActive && <span className="text-xs bg-red-900/30 text-red-400 px-2 py-0.5 rounded-full">🚫 Blocked</span>}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1.5 text-xs text-gray-400 mb-3">
                  {result.email && <span className="flex items-center gap-1 col-span-2 sm:col-span-1">📧 {result.email}</span>}
                  {result.phone && <span className="flex items-center gap-1">📞 {result.phone}</span>}
                  {result.gender && <span>⚧ {result.gender}</span>}
                  {age && <span>🎂 {age} years</span>}
                  {result.religion && <span>🙏 {result.religion}{result.caste ? ` · ${result.caste}` : ''}</span>}
                  {(result.city || result.country) && <span>📍 {[result.city, result.state, result.country].filter(Boolean).join(', ')}</span>}
                  {result.education && <span>🎓 {result.education}</span>}
                  {result.profession && <span>💼 {result.profession}</span>}
                  {result.createdAt && <span>📅 Joined {format(new Date(result.createdAt), 'dd MMM yyyy')}</span>}
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setViewUserId(result.id)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-vd-primary text-white rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity"
                  >
                    <Search className="w-3.5 h-3.5" /> View Profile
                  </button>
                  <button
                    onClick={() => router.push(`/admin/matchmaker?userId=${result.id}`)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-pink-700/30 text-pink-400 hover:bg-pink-700/50 rounded-xl text-xs font-semibold transition-colors"
                  >
                    💕 Find Matches
                  </button>
                  <button
                    onClick={() => router.push(`/admin/createprofile?userId=${result.id}`)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-700/30 text-blue-400 hover:bg-blue-700/50 rounded-xl text-xs font-semibold transition-colors"
                  >
                    ✏️ Edit Profile
                  </button>
                  {!result.adminVerified && (
                    <button
                      onClick={async () => {
                        await fetch(`/api/admin/users/${result.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adminVerified: true }) });
                        setResult(r => ({ ...r, adminVerified: true }));
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 bg-green-700/30 text-green-400 hover:bg-green-700/50 rounded-xl text-xs font-semibold transition-colors"
                    >
                      ✅ Approve
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Empty state */}
      {!result && !notFound && !loading && (
        <div className="px-5 py-4 text-xs text-gray-600 text-center">
          Enter phone number, name or email to find a user instantly
        </div>
      )}


    {viewUserId && <AdminUserProfileModal userId={viewUserId} onClose={() => setViewUserId(null)} />}
    </div>
  );
}

export default function OverviewPage() {
  const router = useRouter();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch('/api/admin/stats').then(r => r.json()).then(setStats).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      {/* Quick User Search */}
      <UserSearchBar />

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard icon={Users}         label="Total Users"       value={stats?.totalUsers}          color="text-blue-400"   bg="bg-blue-900/20"   sub={`+${stats?.newUsersToday ?? 0} today`} />
        <StatCard icon={Star}          label="Premium Users"     value={stats?.premiumUsers}         color="text-yellow-400" bg="bg-yellow-900/20" sub={`${stats?.activeSubscriptions ?? 0} active subs`} />
        <StatCard icon={UserCheck}     label="Pending Approval"  value={stats?.pendingAdminVerify}   color="text-orange-400" bg="bg-orange-900/20" sub="Awaiting admin verify" />
        <StatCard icon={Flag}          label="Pending Reports"   value={stats?.pendingReports}       color="text-red-400"    bg="bg-red-900/20" />
        <StatCard icon={MessageCircle} label="Total Messages"    value={stats?.totalMessages}        color="text-vd-primary" bg="bg-vd-accent-soft dark:bg-vd-accent/20" />
        <StatCard icon={Heart}         label="Total Interests"   value={stats?.totalInterests}       color="text-vd-primary" bg="bg-vd-accent-soft dark:bg-vd-accent/20" />
        <StatCard icon={TrendingUp}    label="New This Month"    value={stats?.newUsersMonth}        color="text-green-400"  bg="bg-green-900/20" />
        <StatCard icon={Shield}        label="ID Verifications"  value={stats?.pendingVerifications} color="text-cyan-400"   bg="bg-cyan-900/20"   sub="Pending review" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
          <h3 className="font-semibold mb-4 text-gray-300">Gender Distribution</h3>
          <div className="space-y-3">
            {[{ label: 'Male', val: stats?.maleUsers, color: 'bg-blue-500' }, { label: 'Female', val: stats?.femaleUsers, color: 'bg-vd-primary' }].map(g => (
              <div key={g.label}>
                <div className="flex justify-between text-sm mb-1"><span className="text-gray-400">{g.label}</span><span className="text-white font-medium">{g.val ?? 0}</span></div>
                <div className="h-2 bg-gray-700 rounded-full">
                  <div className={`h-2 ${g.color} rounded-full`} style={{ width: `${stats?.totalUsers ? ((g.val ?? 0) / stats.totalUsers * 100) : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
          <h3 className="font-semibold mb-4 text-gray-300">Quick Actions</h3>
          <div className="space-y-2">
            {[
              { label: `Approve ${stats?.pendingAdminVerify ?? 0} pending users`, href: '/admin/pending',       color: 'bg-orange-900/30 text-orange-400 hover:bg-orange-900/50' },
              { label: `Review ${stats?.pendingReports ?? 0} reports`,            href: '/admin/reports',       color: 'bg-red-900/30 text-red-400 hover:bg-red-900/50' },
              { label: `Verify ${stats?.pendingVerifications ?? 0} documents`,    href: '/admin/verifications', color: 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50' },
              { label: 'Configure subscription plans',                             href: '/admin/plans',         color: 'bg-purple-900/30 text-purple-400 hover:bg-purple-900/50' },
            ].map(a => (
              <button key={a.label} onClick={() => router.push(a.href)}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-colors ${a.color}`}>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
