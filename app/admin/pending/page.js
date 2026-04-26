'use client';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { UserCheck, CheckCircle, XCircle, Eye, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminUserProfileModal from '@/components/AdminUserProfileModal';

function UserRow({ u, onView, onApprove, onReject, showActions, statusBadge }) {
  return (
    <div className="bg-gray-800 rounded-2xl p-4 border border-gray-700 flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="w-14 h-14 rounded-2xl overflow-hidden vd-gradient-gold flex items-center justify-center flex-shrink-0">
        {u.image ? <img src={u.image} alt="" className="w-full h-full object-cover" /> : <span className="text-white font-bold text-xl">{u.name?.[0]}</span>}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-white">{u.name}</p>
          {statusBadge === 'approved' && <span className="text-xs bg-green-900/30 text-green-400 px-2 py-0.5 rounded-full">✅ Approved</span>}
          {statusBadge === 'rejected' && <span className="text-xs bg-red-900/30 text-red-400 px-2 py-0.5 rounded-full">❌ Rejected</span>}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-400 mt-0.5">
          <span>{u.email}</span>
          {u.phone && <span>{u.phone}</span>}
          {u.profile?.city && <span>📍 {u.profile.city}, {u.profile.country}</span>}
          <span>📅 {format(new Date(u.createdAt), 'dd MMM yyyy')}</span>
        </div>
        <div className="flex gap-2 mt-1.5 flex-wrap">
          {u.documents?.length > 0 && <span className="text-xs bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded-full">{u.documents.length} doc(s)</span>}
          {u.profile?.religion && <span className="text-xs bg-vd-accent-soft text-vd-primary px-2 py-0.5 rounded-full">{u.profile.religion}</span>}
          {u.profile?.gender && <span className="text-xs bg-vd-accent-soft text-vd-primary px-2 py-0.5 rounded-full">{u.profile.gender}</span>}
        </div>
      </div>
      <div className="flex gap-2 flex-shrink-0 flex-wrap">
        <button onClick={onView} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl text-xs flex items-center gap-1">
          <Eye className="w-3.5 h-3.5" /> View
        </button>
        {showActions && <>
          <button onClick={onApprove} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-medium flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> Approve
          </button>
          <button onClick={onReject} className="px-3 py-1.5 bg-red-900/30 text-red-400 hover:bg-red-900/50 rounded-xl text-xs flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" /> Reject
          </button>
        </>}
      </div>
    </div>
  );
}

export default function PendingPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedId, setSelectedId] = useState(null);
  const [q, setQ] = useState('');

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/users?limit=200');
    const data = await res.json();
    setUsers(data.users || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateUser = async (id, data) => {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    });
    if (res.ok) { toast.success('Updated'); load(); } else toast.error('Failed');
  };

  const filter = (list) => {
    if (!q.trim()) return list;
    const lq = q.toLowerCase();
    return list.filter(u =>
      u.name?.toLowerCase().includes(lq) || u.email?.toLowerCase().includes(lq) ||
      u.phone?.includes(lq) || u.profile?.city?.toLowerCase().includes(lq) ||
      u.profile?.religion?.toLowerCase().includes(lq) || u.profile?.gender?.toLowerCase().includes(lq)
    );
  };

  const pending  = filter(users.filter(u => !u.adminVerified && u.isActive && u.role === 'USER'));
  const approved = filter(users.filter(u => u.adminVerified && u.isActive && u.role === 'USER'));
  const rejected = filter(users.filter(u => !u.isActive && u.role === 'USER'));

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-vd-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex gap-2">
          {[
            { id: 'pending',  label: 'Pending',             count: pending.length,            color: 'bg-yellow-500' },
            { id: 'reviewed', label: 'Approved & Rejected',  count: approved.length + rejected.length, color: 'bg-gray-600' },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === t.id ? 'vd-gradient-gold text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'}`}>
              {t.label}
              {t.count > 0 && <span className={`text-xs w-5 h-5 rounded-full flex items-center justify-center ${activeTab === t.id ? 'bg-white/20 text-white' : `${t.color} text-white`}`}>{t.count}</span>}
            </button>
          ))}
        </div>
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name, email, phone…"
            className="w-full pl-9 pr-8 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm focus:outline-none focus:border-vd-primary" />
          {q && <button onClick={() => setQ('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs">✕</button>}
        </div>
      </div>

      {activeTab === 'pending' && (
        pending.length === 0
          ? <div className="text-center py-16 text-gray-500"><UserCheck className="w-12 h-12 mx-auto mb-3 text-gray-700" /><p>{q ? 'No results' : 'No pending approvals'}</p></div>
          : <div className="space-y-3">{pending.map(u => <UserRow key={u.id} u={u} onView={() => setSelectedId(u.id)} onApprove={() => updateUser(u.id, { adminVerified: true })} onReject={() => updateUser(u.id, { isActive: false })} showActions={true} />)}</div>
      )}

      {activeTab === 'reviewed' && (
        <div className="space-y-6">
          <div>
            <h3 className="font-bold text-green-400 mb-3 flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4" /> Approved ({approved.length})</h3>
            {approved.length === 0 ? <div className="text-center py-8 text-gray-500 bg-gray-800/50 rounded-2xl border border-gray-700 text-sm">{q ? 'No results' : 'No approved users'}</div>
              : <div className="space-y-3">{approved.map(u => <UserRow key={u.id} u={u} onView={() => setSelectedId(u.id)} showActions={false} statusBadge="approved" />)}</div>}
          </div>
          <div>
            <h3 className="font-bold text-red-400 mb-3 flex items-center gap-2 text-sm"><XCircle className="w-4 h-4" /> Rejected ({rejected.length})</h3>
            {rejected.length === 0 ? <div className="text-center py-8 text-gray-500 bg-gray-800/50 rounded-2xl border border-gray-700 text-sm">{q ? 'No results' : 'No rejected users'}</div>
              : <div className="space-y-3">{rejected.map(u => <UserRow key={u.id} u={u} onView={() => setSelectedId(u.id)} showActions={false} statusBadge="rejected" />)}</div>}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <AdminUserProfileModal userId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}
