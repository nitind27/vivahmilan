'use client';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Flag, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetch('/api/admin/reports').then(r => r.json()).then(d => { setReports(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  const handle = async (reportId, status) => {
    await fetch('/api/admin/reports', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reportId, status }) });
    toast.success('Updated');
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status } : r));
  };

  const blockUser = async (userId) => {
    await fetch(`/api/admin/users/${userId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: false }) });
    toast.success('User blocked');
  };

  const filtered = reports.filter(r => {
    const lq = q.toLowerCase();
    return (!q || r.reporter?.name?.toLowerCase().includes(lq) || r.reporter?.email?.toLowerCase().includes(lq) ||
      r.target?.name?.toLowerCase().includes(lq) || r.reason?.toLowerCase().includes(lq)) &&
      (!statusFilter || r.status === statusFilter);
  });

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-vd-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search reporter, target, reason…"
            className="w-full pl-9 pr-8 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm focus:outline-none focus:border-vd-primary" />
          {q && <button onClick={() => setQ('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs">✕</button>}
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm focus:outline-none">
          <option value="">All Status</option><option value="PENDING">⏳ Pending</option><option value="RESOLVED">✅ Resolved</option>
        </select>
        <span className="text-xs text-gray-500 self-center">{filtered.length} of {reports.length}</span>
      </div>

      {filtered.length === 0
        ? <div className="text-center py-16 text-gray-500"><Flag className="w-12 h-12 mx-auto mb-3 text-gray-700" /><p>{q ? 'No results' : 'No reports'}</p></div>
        : <div className="space-y-4">
          {filtered.map(r => (
            <div key={r.id} className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
              <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${r.status === 'PENDING' ? 'bg-yellow-900/30 text-yellow-400' : 'bg-green-900/30 text-green-400'}`}>{r.status}</span>
                  <p className="text-sm mt-2"><span className="text-gray-400">Reporter:</span> <span className="text-white">{r.reporter?.name}</span> ({r.reporter?.email})</p>
                  <p className="text-sm"><span className="text-gray-400">Target:</span> <span className="text-white">{r.target?.name}</span> ({r.target?.email})</p>
                  <p className="text-sm mt-1"><span className="text-gray-400">Reason:</span> {r.reason}</p>
                  {r.details && <p className="text-xs text-gray-500 mt-1">{r.details}</p>}
                  <p className="text-xs text-gray-600 mt-1">{format(new Date(r.createdAt), 'dd MMM yyyy')}</p>
                </div>
                {r.status === 'PENDING' && (
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button onClick={() => handle(r.id, 'RESOLVED')} className="px-3 py-1.5 bg-green-900/30 text-green-400 hover:bg-green-900/50 rounded-xl text-xs">Resolve</button>
                    <button onClick={() => blockUser(r.target?.id)} className="px-3 py-1.5 bg-red-900/30 text-red-400 hover:bg-red-900/50 rounded-xl text-xs">Block User</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      }
    </div>
  );
}
