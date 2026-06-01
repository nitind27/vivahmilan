'use client';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { UserCheck, CheckCircle, XCircle, Eye, Search, ChevronLeft, ChevronRight, FileText, Calendar, MapPin, Mail, Phone, Hash, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminUserProfileModal from '@/components/AdminUserProfileModal';
import ApprovalChecklist from '@/components/ApprovalChecklist';

// ── Profile Approvals Components ──────────────────────────────────────────────

function UserCard({ u, onView, onApprove, onReject, statusBadge }) {
  return (
    <div className="bg-gray-800 rounded-3xl p-5 border border-gray-700 hover:border-gray-600 transition-colors shadow-lg flex flex-col h-full relative group">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-16 h-16 rounded-2xl overflow-hidden vd-gradient-gold flex items-center justify-center flex-shrink-0 shadow-md">
          {u.image ? <img src={u.image} alt="" className="w-full h-full object-cover" /> : <span className="text-white font-bold text-2xl">{u.name?.[0]}</span>}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg text-white truncate">{u.name}</h3>
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1 truncate">
            <Hash className="w-3.5 h-3.5" /> <span className="truncate">{u.id.slice(-8).toUpperCase()}</span>
          </div>
          {statusBadge === 'approved' && <span className="text-xs font-semibold bg-green-500/20 text-green-400 px-2.5 py-1 rounded-full mt-2 inline-block">Approved</span>}
          {statusBadge === 'rejected' && <span className="text-xs font-semibold bg-red-500/20 text-red-400 px-2.5 py-1 rounded-full mt-2 inline-block">Rejected</span>}
          {statusBadge === 'pending' && <span className="text-xs font-semibold bg-yellow-500/20 text-yellow-500 px-2.5 py-1 rounded-full mt-2 inline-block">Pending Review</span>}
        </div>
      </div>

      <div className="bg-gray-900/50 rounded-2xl p-4 flex-1 space-y-3 mb-5">
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <Mail className="w-4 h-4 text-gray-500" />
          <span className="truncate">{u.email}</span>
        </div>
        {u.phone && (
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <Phone className="w-4 h-4 text-gray-500" />
            <span>{u.phone}</span>
          </div>
        )}
        {u.profile?.city && (
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span className="truncate">{u.profile.city}, {u.profile.country}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span>Joined {format(new Date(u.createdAt), 'dd MMM yyyy')}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {u.documents?.length > 0 ? (
          <span className="text-xs font-medium bg-blue-500/20 text-blue-400 px-2 py-1 rounded-lg flex items-center gap-1">
            <FileText className="w-3 h-3" /> {u.documents.length} Docs
          </span>
        ) : (
          <span className="text-xs font-medium bg-gray-700/50 text-gray-400 px-2 py-1 rounded-lg">No Docs</span>
        )}
        {u.profile?.gender && <span className="text-xs font-medium bg-gray-700/80 text-gray-300 px-2 py-1 rounded-lg capitalize">{u.profile.gender.toLowerCase()}</span>}
        {u.profile?.religion && <span className="text-xs font-medium bg-gray-700/80 text-gray-300 px-2 py-1 rounded-lg truncate max-w-[100px]">{u.profile.religion}</span>}
      </div>

      <div className="flex gap-2 mt-auto">
        <button onClick={onView} className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors">
          <Eye className="w-4 h-4" /> View
        </button>
        {statusBadge === 'pending' && (
          <>
            <button onClick={onApprove} className="w-10 flex-shrink-0 bg-green-500/20 hover:bg-green-500 hover:text-white text-green-500 rounded-xl flex items-center justify-center transition-colors">
              <CheckCircle className="w-5 h-5" />
            </button>
            <button onClick={onReject} className="w-10 flex-shrink-0 bg-red-500/20 hover:bg-red-500 hover:text-white text-red-500 rounded-xl flex items-center justify-center transition-colors">
              <XCircle className="w-5 h-5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function ProfilesTab() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedId, setSelectedId] = useState(null);
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [blockModal, setBlockModal] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q), 500);
    return () => clearTimeout(timer);
  }, [q]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?status=${activeTab}&page=${page}&limit=12&search=${encodeURIComponent(debouncedQ)}`);
      const data = await res.json();
      setUsers(data.users || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (e) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [activeTab, page, debouncedQ]);
  useEffect(() => { setPage(1); }, [activeTab, debouncedQ]);

  const updateUser = async (id, data) => {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    });
    const result = await res.json().catch(() => ({}));
    if (res.ok) {
      toast.success(data.adminVerified ? 'Profile approved successfully' : 'Updated');
      load();
      window.dispatchEvent(new Event('admin-stats-refresh'));
    } else if (result.checklist) {
      const user = users.find(u => u.id === id);
      setBlockModal({
        userName: user?.name || 'User',
        message: result.error,
        checklist: result.checklist,
        errors: result.errors || [],
      });
    } else {
      toast.error(result.error || 'Failed to update user');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex p-1 bg-gray-900 rounded-2xl border border-gray-800">
          {[
            { id: 'pending',  label: 'Pending' },
            { id: 'approved', label: 'Approved' },
            { id: 'rejected', label: 'Rejected' },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === t.id ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name or email…"
            className="w-full pl-11 pr-10 py-3 bg-gray-900 border border-gray-700 rounded-2xl text-sm focus:outline-none focus:border-vd-primary transition-colors placeholder-gray-600 font-medium" />
          {q && <button onClick={() => setQ('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs bg-gray-800 rounded-full p-1"><XCircle className="w-4 h-4" /></button>}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-400">Total <span className="text-white">{total}</span> records found</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-32">
          <div className="w-10 h-10 border-4 border-vd-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-32 text-gray-500 bg-gray-900/50 rounded-3xl border border-dashed border-gray-700">
          <UserCheck className="w-16 h-16 mx-auto mb-4 text-gray-700" />
          <p className="text-lg font-medium">{q ? 'No matching users found' : `No ${activeTab} users`}</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {users.map(u => (
            <UserCard key={u.id} u={u} 
              onView={() => setSelectedId(u.id)} 
              onApprove={() => updateUser(u.id, { adminVerified: true })} 
              onReject={() => updateUser(u.id, { isActive: false })} 
              statusBadge={activeTab} 
            />
          ))}
        </div>
      )}

      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-6 border-t border-gray-800">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="p-2 rounded-xl bg-gray-800 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex gap-2">
            {[...Array(totalPages)].map((_, i) => {
              const p = i + 1;
              if (p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)) {
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-10 h-10 rounded-xl text-sm font-bold transition-colors ${page === p ? 'bg-vd-primary text-white shadow-lg shadow-vd-primary/25' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                    {p}
                  </button>
                );
              } else if (p === page - 2 || p === page + 2) {
                return <span key={p} className="w-10 h-10 flex items-center justify-center text-gray-600">...</span>;
              }
              return null;
            })}
          </div>

          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="p-2 rounded-xl bg-gray-800 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {selectedId && <AdminUserProfileModal userId={selectedId} onClose={() => { setSelectedId(null); load(); }} />}

      {blockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-700 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Cannot approve — {blockModal.userName}</h3>
                <p className="text-sm text-gray-400 mt-1">{blockModal.message}</p>
              </div>
              <button onClick={() => setBlockModal(null)} className="text-gray-500 hover:text-white shrink-0">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <ApprovalChecklist checklist={blockModal.checklist} eligible={false} />
            <p className="text-xs text-gray-500 mt-4">
              Ask the user to complete missing items in the app, then try again. Open <strong className="text-gray-400">View</strong> to see full profile details.
            </p>
            <button
              onClick={() => setBlockModal(null)}
              className="mt-4 w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-semibold"
            >
              OK, understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Document Verifications Components ─────────────────────────────────────────

function DocCard({ doc, showActions, onVerify, onKyc, kycLoading }) {
  return (
    <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700 hover:border-gray-600 transition-colors shadow-lg">
      <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-white text-lg">{doc.user?.name}</p>
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${doc.status === 'APPROVED' ? 'bg-green-500/20 text-green-400' : doc.status === 'REJECTED' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-500'}`}>{doc.status}</span>
          </div>
          <p className="text-gray-400 text-sm flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> {doc.user?.email}</p>
          <div className="mt-3 space-y-1">
            <p className="text-gray-300 text-sm flex items-center gap-2"><FileText className="w-3.5 h-3.5 text-vd-primary" /> Document: <span className="font-medium text-white">{doc.type}</span></p>
            <p className="text-gray-400 text-xs flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> Submitted: {format(new Date(doc.createdAt), 'dd MMM yyyy, h:mm a')}</p>
          </div>
          {doc.url && <a href={doc.url} target="_blank" rel="noreferrer" className="text-vd-primary text-sm hover:underline mt-3 inline-flex items-center gap-1 font-medium"><Eye className="w-4 h-4" /> View Document Image</a>}
        </div>
        <div className="flex flex-col gap-2 flex-shrink-0 w-full sm:w-auto">
          <button onClick={() => onKyc(doc.user?.id || doc.userId)} disabled={kycLoading === (doc.user?.id || doc.userId)}
            className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-colors shadow-lg shadow-blue-500/20">
            {kycLoading === (doc.user?.id || doc.userId) ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <span>🎥</span>}
            Video KYC
          </button>
          {showActions && <>
            <button onClick={() => onVerify(doc.id, 'APPROVED')} className="w-full sm:w-auto px-5 py-2.5 bg-green-500/20 hover:bg-green-500 hover:text-white text-green-500 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4" /> Approve
            </button>
            <button onClick={() => onVerify(doc.id, 'REJECTED')} className="w-full sm:w-auto px-5 py-2.5 bg-red-500/20 hover:bg-red-500 hover:text-white text-red-500 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
              <XCircle className="w-4 h-4" /> Reject
            </button>
          </>}
        </div>
      </div>
    </div>
  );
}

function DocsTab() {
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

  if (loading) return <div className="flex justify-center py-32"><div className="w-10 h-10 border-4 border-vd-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex p-1 bg-gray-900 rounded-2xl border border-gray-800">
          {[{ id: 'pending', label: 'Pending Docs', count: pending.length }, { id: 'reviewed', label: 'Reviewed Docs', count: reviewed.length }].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === t.id ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>
              {t.label}
              {t.count > 0 && <span className={`text-xs w-5 h-5 rounded-full flex items-center justify-center ${activeTab === t.id ? 'bg-vd-primary text-white' : 'bg-gray-700 text-gray-400'}`}>{t.count}</span>}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name, email, doc type…"
            className="w-full pl-11 pr-10 py-3 bg-gray-900 border border-gray-700 rounded-2xl text-sm focus:outline-none focus:border-vd-primary transition-colors placeholder-gray-600 font-medium" />
          {q && <button onClick={() => setQ('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs bg-gray-800 rounded-full p-1"><XCircle className="w-4 h-4" /></button>}
        </div>
      </div>

      {activeTab === 'pending' && (
        pending.length === 0
          ? <div className="text-center py-32 text-gray-500 bg-gray-900/50 rounded-3xl border border-dashed border-gray-700"><Shield className="w-16 h-16 mx-auto mb-4 text-gray-700" /><p className="text-lg font-medium">{q ? 'No results' : 'No pending verifications'}</p></div>
          : <div className="grid md:grid-cols-2 gap-5">{pending.map(d => <DocCard key={d.id} doc={d} showActions={true} onVerify={verify} onKyc={startKyc} kycLoading={kycLoading} />)}</div>
      )}
      {activeTab === 'reviewed' && (
        reviewed.length === 0
          ? <div className="text-center py-32 text-gray-500 bg-gray-900/50 rounded-3xl border border-dashed border-gray-700"><CheckCircle className="w-16 h-16 mx-auto mb-4 text-gray-700" /><p className="text-lg font-medium">{q ? 'No results' : 'No reviewed docs'}</p></div>
          : <div className="grid md:grid-cols-2 gap-5">{reviewed.map(d => <DocCard key={d.id} doc={d} showActions={false} onVerify={verify} onKyc={startKyc} kycLoading={kycLoading} />)}</div>
      )}
    </div>
  );
}

// ── Main Page Component ───────────────────────────────────────────────────────

export default function PendingApprovalsHub() {
  const [mainTab, setMainTab] = useState('profiles');

  return (
    <div className="space-y-6">
      {/* Top Level Navigation */}
      <div className="flex bg-gray-900 p-1.5 rounded-2xl border border-gray-800 w-fit">
        <button onClick={() => setMainTab('profiles')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${mainTab === 'profiles' ? 'vd-gradient-gold text-white shadow-lg shadow-vd-primary/20' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
          👤 Profile Approvals
        </button>
        <button onClick={() => setMainTab('docs')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${mainTab === 'docs' ? 'vd-gradient-gold text-white shadow-lg shadow-vd-primary/20' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
          📄 ID Documents
        </button>
      </div>

      {/* Render selected tab */}
      {mainTab === 'profiles' ? <ProfilesTab /> : <DocsTab />}
    </div>
  );
}
