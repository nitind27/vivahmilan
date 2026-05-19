'use client';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Search, Crown, Mail, Phone, Calendar, IndianRupee, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SubscriptionsPage() {
  const [subs, setSubs] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    // Fetch subscriptions
    fetch('/api/admin/subscriptions')
      .then(r => r.json())
      .then(d => { setSubs(Array.isArray(d) ? d : []); })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Fetch dynamic plans for the dropdown filter
    fetch('/api/admin/plans')
      .then(r => r.json())
      .then(d => { setPlans(Array.isArray(d) ? d : []); })
      .catch(() => {});
  }, []);

  const filtered = subs.filter(s => {
    const lq = q.toLowerCase();
    return (!q || s.user?.name?.toLowerCase().includes(lq) || s.user?.email?.toLowerCase().includes(lq) || s.user?.phone?.includes(lq)) &&
      (!planFilter || s.plan === planFilter) && (!statusFilter || s.status === statusFilter);
  });

  if (loading) return <div className="flex justify-center py-32"><div className="w-10 h-10 border-4 border-vd-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search user name, email, or phone…"
            className="w-full pl-11 pr-10 py-3 bg-gray-900 border border-gray-700 rounded-2xl text-sm focus:outline-none focus:border-vd-primary transition-colors placeholder-gray-600 font-medium" />
          {q && <button onClick={() => setQ('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs bg-gray-800 rounded-full p-1">✕</button>}
        </div>
        
        <div className="flex gap-3 w-full sm:w-auto">
          <select value={planFilter} onChange={e => setPlanFilter(e.target.value)} 
            className="flex-1 sm:flex-none px-4 py-3 bg-gray-900 border border-gray-700 rounded-2xl text-sm font-medium focus:outline-none focus:border-vd-primary transition-colors text-gray-300">
            <option value="">All Plans</option>
            {plans.map(p => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>
          
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} 
            className="flex-1 sm:flex-none px-4 py-3 bg-gray-900 border border-gray-700 rounded-2xl text-sm font-medium focus:outline-none focus:border-vd-primary transition-colors text-gray-300">
            <option value="">All Status</option>
            <option value="ACTIVE">✅ Active</option>
            <option value="EXPIRED">❌ Expired</option>
            <option value="CANCELLED">🚫 Cancelled</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-400">Showing <span className="text-white">{filtered.length}</span> of {subs.length} subscriptions</p>
      </div>

      {/* ── Subscriptions List ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-32 text-gray-500 bg-gray-900/50 rounded-3xl border border-dashed border-gray-700">
          <Crown className="w-16 h-16 mx-auto mb-4 text-gray-700" />
          <p className="text-lg font-medium">{q || planFilter || statusFilter ? 'No matching subscriptions found' : 'No subscriptions yet'}</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map(s => {
            const isActive = s.status === 'ACTIVE';
            return (
              <div key={s.id} className="bg-gray-800 rounded-3xl p-5 border border-gray-700 hover:border-gray-600 transition-colors shadow-lg flex flex-col h-full relative group">
                
                {/* User Info Header */}
                <div className="flex flex-col sm:flex-row items-start gap-4 mb-5">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gray-700 flex items-center justify-center flex-shrink-0 shadow-md">
                    {s.user?.image ? (
                      <img src={s.user.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-bold text-xl">{s.user?.name?.[0] || '?'}</span>
                    )}
                  </div>
                  <div className="flex-1 w-full">
                    <h3 className="font-bold text-lg text-white mb-1.5 leading-tight">{s.user?.name || s.userId}</h3>
                    <div className="space-y-1.5 bg-gray-900/40 p-3 rounded-xl border border-gray-700/50">
                      <div className="flex items-start gap-2 text-sm text-gray-300">
                        <Mail className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <span className="break-all leading-tight">{s.user?.email || 'No Email'}</span>
                      </div>
                      {s.user?.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <Phone className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          <span>{s.user.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Plan Info Card */}
                <div className="bg-gray-900/50 rounded-2xl p-4 mb-4 border border-gray-800 flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Subscription</span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold shadow-sm ${isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                      {s.status}
                    </span>
                  </div>
                  
                  <div className="flex items-baseline gap-2 mb-4">
                    <h4 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 uppercase tracking-tight">
                      {s.plan}
                    </h4>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-300 bg-gray-800 p-2 rounded-xl">
                      <IndianRupee className="w-4 h-4 text-green-500" />
                      <span className="font-semibold">{Number(s.amount).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400 bg-gray-800 p-2 rounded-xl">
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Start</span>
                      <span className="font-medium text-white">{s.startDate ? format(new Date(s.startDate), 'dd MMM yyyy') : '—'}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400 bg-gray-800 p-2 rounded-xl border border-red-500/10">
                      <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> End</span>
                      <span className={`font-medium ${isActive ? 'text-white' : 'text-red-400'}`}>{s.endDate ? format(new Date(s.endDate), 'dd MMM yyyy') : '—'}</span>
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
