'use client';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Shield, CheckCircle, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function VerificationsPage() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [q, setQ] = useState('');
  const [kycLoading, setKycLoading] = useState(null);

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/verifications');
    const data = await res.json();
    setDocs(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const verify = async (docId, status) => {
    await fetch('/api/admin/verifications', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ docId, status }),
    });
    toast.success(status === 'APPROVED' ? '✅ Approved' : '❌ Rejected');
    setDocs(prev => prev.map(d => d.id === docId ? { ...d, status } : d));
  };

  const startKyc = async (userId) => {
    setKycLoading(userId);
    try {
      const res = await fetch('/api/admin/kyc', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.sessionId) { toast.success('KYC invite sent!'); window.open(`/admin/kyc/${data.sessionId}`, '_blank'); }
      else toast.error(data.error || 'Failed');
    } catch { toast.error('Failed'); }
    finally { setKycLoading(null); }
  };

  const filter = (list) => {
    if (!q.trim()) return list;
    const lq = q.toLowerCase();
    return list.filter(d => d.user?.name?.toLowerCase().includes(lq) || d.user?.email?.toLowerCase().includes(lq) || d.type?.toLowerCase().includes(lq));
  };

  const pending  = filter(docs.filter(d => d.status === 'PENDING'));
  const reviewed = filter(docs.filter(d => d.status !== 'PENDING'));

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-vd-primary border-t-transparent rounded-full animate-spin" /></div>;

  const DocCard = ({ doc, showActions }) => (
    <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
      <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-white">{doc.user?.name}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full ${doc.status === 'APPROVED' ? 'bg-green-900/30 text-green-400' : doc.status === 'REJECTED' ? 'bg-red-900/30 text-red-400' : 'bg-yellow-900/30 text-yellow-400'}`}>{doc.status}</span>
          </div>
          <p className="text-gray-400 text-sm">{doc.user?.email}</p>
          <p className="text-gray-500 text-xs mt-1">Document: {doc.type}</p>
          <p className="text-gray-500 text-xs">Submitted: {format(new Date(doc.createdAt), 'dd MMM yyyy, h:mm a')}</p>
          {doc.url && <a href={doc.url} target="_blank" rel="noreferrer" className="text-vd-primary text-xs hover:underline mt-1 inline-block">View Document ↗</a>}
        </div>
        <div className="flex flex-col gap-2 flex-shrink-0">
          <button onClick={() => startKyc(doc.user?.id || doc.userId)} disabled={kycLoading === (doc.user?.id || doc.userId)}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-medium flex items-center gap-1.5 disabled:opacity-50">
            {kycLoading === (doc.user?.id || doc.userId) ? <span className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin" /> : <span>🎥</span>}
            Video KYC
          </button>
          {showActions && <>
            <button onClick={() => verify(doc.id, 'APPROVED')} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium">Approve</button>
            <button onClick={() => verify(doc.id, 'REJECTED')} className="px-4 py-2 bg-red-900/30 text-red-400 hover:bg-red-900/50 rounded-xl text-sm">Reject</button>
          </>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2">
          {[{ id: 'pending', label: 'Pending', count: pending.length }, { id: 'reviewed', label: 'Reviewed', count: reviewed.length }].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === t.id ? 'vd-gradient-gold text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'}`}>
              {t.label}
              {t.count > 0 && <span className={`text-xs w-5 h-5 rounded-full flex items-center justify-center ${activeTab === t.id ? 'bg-white/20' : 'bg-yellow-500'} text-white`}>{t.count}</span>}
            </button>
          ))}
        </div>
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name, email, doc type…"
            className="w-full pl-9 pr-8 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm focus:outline-none focus:border-vd-primary" />
          {q && <button onClick={() => setQ('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs">✕</button>}
        </div>
      </div>

      {activeTab === 'pending' && (
        pending.length === 0
          ? <div className="text-center py-16 text-gray-500 bg-gray-800/50 rounded-2xl border border-gray-700"><Shield className="w-12 h-12 mx-auto mb-3 text-gray-700" /><p>{q ? 'No results' : 'No pending verifications'}</p></div>
          : <div className="space-y-3">{pending.map(d => <DocCard key={d.id} doc={d} showActions={true} />)}</div>
      )}
      {activeTab === 'reviewed' && (
        reviewed.length === 0
          ? <div className="text-center py-16 text-gray-500 bg-gray-800/50 rounded-2xl border border-gray-700"><CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-700" /><p>{q ? 'No results' : 'No reviewed docs'}</p></div>
          : <div className="space-y-3">{reviewed.map(d => <DocCard key={d.id} doc={d} showActions={false} />)}</div>
      )}
    </div>
  );
}
