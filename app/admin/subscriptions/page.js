'use client';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Search } from 'lucide-react';

export default function SubscriptionsPage() {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetch('/api/admin/subscriptions').then(r => r.json()).then(d => { setSubs(Array.isArray(d) ? d : []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = subs.filter(s => {
    const lq = q.toLowerCase();
    return (!q || s.user?.name?.toLowerCase().includes(lq) || s.user?.email?.toLowerCase().includes(lq)) &&
      (!planFilter || s.plan === planFilter) && (!statusFilter || s.status === statusFilter);
  });

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-vd-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search user name or email…"
            className="w-full pl-9 pr-8 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm focus:outline-none focus:border-vd-primary" />
          {q && <button onClick={() => setQ('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs">✕</button>}
        </div>
        <select value={planFilter} onChange={e => setPlanFilter(e.target.value)} className="px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm focus:outline-none">
          <option value="">All Plans</option><option value="SILVER">🥈 Silver</option><option value="GOLD">🥇 Gold</option><option value="PLATINUM">💎 Platinum</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm focus:outline-none">
          <option value="">All Status</option><option value="ACTIVE">✅ Active</option><option value="EXPIRED">❌ Expired</option>
        </select>
        <span className="text-xs text-gray-500 self-center">{filtered.length} of {subs.length}</span>
      </div>

      <div className="hidden md:block bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-700/50"><tr>{['User','Plan','Amount','Status','Start','End'].map(h => <th key={h} className="text-left px-4 py-3 text-gray-400 font-medium">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-700/50">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-gray-700/30">
                  <td className="px-4 py-3 text-white">{s.user?.name || s.userId}</td>
                  <td className="px-4 py-3"><span className="text-xs bg-yellow-900/30 text-yellow-400 px-2 py-0.5 rounded-full">{s.plan}</span></td>
                  <td className="px-4 py-3 text-green-400">₹{Number(s.amount).toLocaleString()}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${s.status === 'ACTIVE' ? 'bg-green-900/30 text-green-400' : 'bg-gray-700 text-gray-400'}`}>{s.status}</span></td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{s.startDate ? format(new Date(s.startDate), 'dd MMM yy') : '—'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{s.endDate ? format(new Date(s.endDate), 'dd MMM yy') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <div className="text-center py-10 text-gray-500">{q ? 'No results' : 'No subscriptions yet'}</div>}
      </div>

      <div className="md:hidden space-y-3">
        {filtered.map(s => (
          <div key={s.id} className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-white">{s.user?.name || 'Unknown'}</p>
              <span className="text-xs bg-yellow-900/30 text-yellow-400 px-2 py-0.5 rounded-full">{s.plan}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span className="text-green-400 font-medium">₹{Number(s.amount).toLocaleString()}</span>
              <span className={`px-2 py-0.5 rounded-full ${s.status === 'ACTIVE' ? 'bg-green-900/30 text-green-400' : 'bg-gray-700 text-gray-400'}`}>{s.status}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">{s.startDate ? format(new Date(s.startDate), 'dd MMM yy') : '—'} → {s.endDate ? format(new Date(s.endDate), 'dd MMM yy') : '—'}</p>
          </div>
        ))}
        {filtered.length === 0 && <div className="text-center py-10 text-gray-500">{q ? 'No results' : 'No subscriptions'}</div>}
      </div>
    </div>
  );
}
