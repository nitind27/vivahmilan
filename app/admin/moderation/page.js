'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Shield, UserCheck, Flag, CheckSquare, Square, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ModerationPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [acting, setActing] = useState(false);

  const load = () => {
    setLoading(true);
    fetch(`/api/admin/moderation?type=${filter}`)
      .then(r => r.json())
      .then(d => { setItems(d.items || []); setSelected(new Set()); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const itemKey = (i) => `${i.queueType}-${i.id || i.userId}`;

  const toggle = (key) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const bulkAction = async (action) => {
    const profileIds = items.filter(i => i.queueType === 'profile' && selected.has(itemKey(i))).map(i => i.id);
    const docIds = items.filter(i => i.queueType === 'kyc' && selected.has(itemKey(i))).map(i => i.id);
    const reportIds = items.filter(i => i.queueType === 'report' && selected.has(itemKey(i))).map(i => i.id);

    setActing(true);
    try {
      let body = { action };
      if (action === 'approve_profiles') body.userIds = profileIds;
      if (action === 'approve_documents') body.documentIds = docIds;
      if (action === 'resolve_reports') body.reportIds = reportIds;

      const res = await fetch('/api/admin/moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success('Done!');
        load();
      } else toast.error('Action failed');
    } finally {
      setActing(false);
    }
  };

  const typeIcon = (t) => {
    if (t === 'profile') return UserCheck;
    if (t === 'kyc') return Shield;
    return Flag;
  };

  const typeColor = (t) => {
    if (t === 'profile') return 'text-orange-400 bg-orange-900/20';
    if (t === 'kyc') return 'text-cyan-400 bg-cyan-900/20';
    return 'text-red-400 bg-red-900/20';
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-vd-primary" /> Moderation Queue
        </h2>
        <div className="flex gap-1 bg-gray-800 rounded-xl p-1 border border-gray-700 ml-auto">
          {['all', 'profiles', 'kyc', 'reports'].map(f => (
            <button key={f} type="button" onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize ${filter === f ? 'bg-vd-primary text-white' : 'text-gray-400 hover:text-white'}`}>
              {f}
            </button>
          ))}
        </div>
        <button type="button" onClick={load} className="p-2 bg-gray-800 rounded-xl border border-gray-700 hover:bg-gray-700">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {selected.size > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-gray-800 rounded-xl border border-gray-700">
          <span className="text-xs text-gray-400 self-center">{selected.size} selected</span>
          <button type="button" disabled={acting} onClick={() => bulkAction('approve_profiles')} className="px-3 py-1.5 bg-green-900/30 text-green-400 rounded-lg text-xs font-semibold">Approve Profiles</button>
          <button type="button" disabled={acting} onClick={() => bulkAction('approve_documents')} className="px-3 py-1.5 bg-cyan-900/30 text-cyan-400 rounded-lg text-xs font-semibold">Approve KYC</button>
          <button type="button" disabled={acting} onClick={() => bulkAction('resolve_reports')} className="px-3 py-1.5 bg-red-900/30 text-red-400 rounded-lg text-xs font-semibold">Resolve Reports</button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-vd-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : items.length === 0 ? (
        <p className="text-center py-16 text-gray-500">Queue is empty — all caught up!</p>
      ) : (
        <div className="space-y-2">
          {items.map(item => {
            const Icon = typeIcon(item.queueType);
            const key = itemKey(item);
            const isSel = selected.has(key);
            return (
              <div key={key} className={`flex items-center gap-3 p-4 bg-gray-800 rounded-xl border transition-all ${isSel ? 'border-vd-primary' : 'border-gray-700'}`}>
                <button type="button" onClick={() => toggle(key)} className="text-gray-400 hover:text-white flex-shrink-0">
                  {isSel ? <CheckSquare className="w-5 h-5 text-vd-primary" /> : <Square className="w-5 h-5" />}
                </button>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${typeColor(item.queueType)}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{item.name || item.targetName || item.queueLabel}</p>
                  <p className="text-xs text-gray-500 truncate">{item.queueLabel} · {item.email || item.reason}</p>
                  <p className="text-[10px] text-gray-600 mt-0.5">{item.createdAt ? format(new Date(item.createdAt), 'dd MMM yyyy, h:mm a') : ''}</p>
                </div>
                <button
                  type="button"
                  onClick={() => router.push(item.queueType === 'report' ? '/admin/reports' : '/admin/pending')}
                  className="text-xs px-3 py-1.5 bg-gray-700 rounded-lg text-gray-300 hover:text-white flex-shrink-0"
                >
                  Open
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
