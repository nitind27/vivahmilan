'use client';
import { useEffect, useState } from 'react';
import { RefreshCw, IndianRupee, TrendingUp, CreditCard, Users } from 'lucide-react';

function fmt(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}

function StatCard({ icon: Icon, label, value, sub, color = 'text-vd-primary' }) {
  return (
    <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
      <Icon className={`w-8 h-8 ${color} mb-2`} />
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-gray-400">{label}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

export default function RevenuePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch('/api/admin/revenue')
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const s = data?.summary || {};
  const maxDaily = Math.max(...(data?.dailyTrend || []).map(d => d.revenue), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Revenue Dashboard</h1>
          <p className="text-sm text-gray-400">Subscriptions & payments overview</p>
        </div>
        <button onClick={load} className="p-2 rounded-xl bg-gray-800 border border-gray-700 text-gray-400 hover:text-white">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && !data ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-gray-800 rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={IndianRupee} label="Total Revenue" value={fmt(s.totalRevenue)} sub={`${s.totalOrders} orders`} />
            <StatCard icon={TrendingUp} label="Last 30 Days" value={fmt(s.revenue30d)} color="text-green-400" />
            <StatCard icon={CreditCard} label="Last 7 Days" value={fmt(s.revenue7d)} color="text-blue-400" />
            <StatCard icon={Users} label="Active Plans" value={s.activeSubscriptions} sub={`${s.expiredLast30d} expired (30d)`} color="text-purple-400" />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
              <h3 className="font-bold text-white mb-4">Revenue by Plan</h3>
              {(data?.byPlan || []).length === 0 ? (
                <p className="text-gray-500 text-sm">No subscription data yet.</p>
              ) : (
                <div className="space-y-3">
                  {data.byPlan.map(row => (
                    <div key={row.plan} className="flex items-center justify-between text-sm">
                      <span className="text-white font-medium">{row.plan}</span>
                      <span className="text-gray-400">{row.orders} orders · <span className="text-vd-primary">{fmt(row.revenue)}</span></span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
              <h3 className="font-bold text-white mb-4">30-Day Trend</h3>
              <div className="flex items-end gap-1 h-32">
                {(data?.dailyTrend || []).map(d => (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-1" title={`${d.day}: ${fmt(d.revenue)}`}>
                    <div className="w-full bg-vd-primary/80 rounded-t" style={{ height: `${Math.max(4, (d.revenue / maxDaily) * 100)}%` }} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-700">
              <h3 className="font-bold text-white">Recent Subscriptions</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 text-left border-b border-gray-700">
                    <th className="p-3">User</th>
                    <th className="p-3">Plan</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.recentSubscriptions || []).map(row => (
                    <tr key={row.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                      <td className="p-3 text-white">{row.name}<div className="text-xs text-gray-500">{row.email}</div></td>
                      <td className="p-3 text-gray-300">{row.plan}</td>
                      <td className="p-3 text-vd-primary font-semibold">{fmt(row.amount)}</td>
                      <td className="p-3"><span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">{row.status}</span></td>
                      <td className="p-3 text-gray-400 text-xs">{new Date(row.createdAt).toLocaleDateString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
