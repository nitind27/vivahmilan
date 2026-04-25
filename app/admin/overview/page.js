'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Star, UserCheck, Flag, MessageCircle, Heart, TrendingUp, Shield, BarChart2 } from 'lucide-react';

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

export default function OverviewPage() {
  const router = useRouter();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch('/api/admin/stats').then(r => r.json()).then(setStats).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard icon={Users}      label="Total Users"       value={stats?.totalUsers}          color="text-blue-400"    bg="bg-blue-900/20"    sub={`+${stats?.newUsersToday ?? 0} today`} />
        <StatCard icon={Star}       label="Premium Users"     value={stats?.premiumUsers}         color="text-yellow-400"  bg="bg-yellow-900/20"  sub={`${stats?.activeSubscriptions ?? 0} active subs`} />
        <StatCard icon={UserCheck}  label="Pending Approval"  value={stats?.pendingAdminVerify}   color="text-orange-400"  bg="bg-orange-900/20"  sub="Awaiting admin verify" />
        <StatCard icon={Flag}       label="Pending Reports"   value={stats?.pendingReports}       color="text-red-400"     bg="bg-red-900/20" />
        <StatCard icon={MessageCircle} label="Total Messages" value={stats?.totalMessages}        color="text-vd-primary"  bg="bg-vd-accent-soft dark:bg-vd-accent/20" />
        <StatCard icon={Heart}      label="Total Interests"   value={stats?.totalInterests}       color="text-vd-primary"  bg="bg-vd-accent-soft dark:bg-vd-accent/20" />
        <StatCard icon={TrendingUp} label="New This Month"    value={stats?.newUsersMonth}        color="text-green-400"   bg="bg-green-900/20" />
        <StatCard icon={Shield}     label="ID Verifications"  value={stats?.pendingVerifications} color="text-cyan-400"    bg="bg-cyan-900/20"    sub="Pending review" />
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
