'use client';
import { useEffect, useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import {
  UserCheck, CheckCircle, XCircle, Eye, Search, ChevronLeft, ChevronRight,
  FileText, Calendar, MapPin, Mail, Phone, Hash, Shield, Bell, Send,
  Smartphone, Loader2, Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import AdminUserProfileModal from '@/components/AdminUserProfileModal';
import ApprovalChecklist from '@/components/ApprovalChecklist';
import AdminReminderModal from '@/components/AdminReminderModal';

const REJECTION_PRESET_OPTIONS = [
  { key: 'photos', label: 'Profile photos unclear, inappropriate, or missing' },
  { key: 'documents', label: 'Identity document missing, expired, or does not match profile' },
  { key: 'details', label: 'Profile information incomplete or inconsistent with documents' },
  { key: 'guidelines', label: 'Profile does not meet our community guidelines' },
  { key: 'duplicate', label: 'Duplicate or suspicious account detected' },
  { key: 'custom', label: 'Other — write custom reason below' },
];

// ── Profile Approvals Components ──────────────────────────────────────────────

function RejectModal({ target, onClose, onRejected }) {
  const [preset, setPreset] = useState('photos');
  const [customReason, setCustomReason] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const presetText = REJECTION_PRESET_OPTIONS.find((p) => p.key === preset)?.label || '';
  const reason = preset === 'custom' ? customReason.trim() : presetText;
  const reasonValid = reason.length >= 10;

  const submit = async () => {
    if (!reasonValid) {
      toast.error('Please enter a rejection reason (at least 10 characters)');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${target.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileRejection: { reason, sendEmail },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to reject profile');
        return;
      }
      toast.success(
        sendEmail && data.emailSent
          ? 'Profile rejected — user notified by email, notification & push'
          : sendEmail && !data.emailSent
            ? 'Profile rejected — notification sent (email failed or no email)'
            : 'Profile rejected'
      );
      onRejected?.();
      onClose();
    } catch {
      toast.error('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-700 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-400" />
                Reject profile
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                {target.name} — reason is required and can be emailed to the user
              </p>
            </div>
            <button type="button" onClick={onClose} className="text-gray-500 hover:text-white">
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
              Rejection reason
            </label>
            <select
              value={preset}
              onChange={(e) => setPreset(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:border-red-500/50 outline-none"
            >
              {REJECTION_PRESET_OPTIONS.map((p) => (
                <option key={p.key} value={p.key}>{p.label}</option>
              ))}
            </select>
          </div>

          {preset === 'custom' && (
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
                Custom reason
              </label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                rows={4}
                placeholder="Explain clearly why this profile cannot be approved…"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-red-500/50 outline-none resize-none"
              />
            </div>
          )}

          {preset !== 'custom' && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/25 p-4">
              <p className="text-xs font-bold text-red-300/90 uppercase tracking-wider mb-2">Will be sent to user</p>
              <p className="text-sm text-gray-200 leading-relaxed">{presetText}</p>
            </div>
          )}

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              className="mt-1 rounded border-gray-600"
            />
            <span className="text-sm text-gray-300">
              <strong className="text-white">Send formatted email</strong> to {target.email || 'user'}
              <span className="block text-xs text-gray-500 mt-1">
                Also creates in-app notification and web push (if subscribed)
              </span>
            </span>
          </label>
        </div>

        <div className="p-6 border-t border-gray-800 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={submitting || !reasonValid}
            className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
            Reject profile
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteAccountModal({ target, onClose, onDeleted }) {
  const [confirmEmail, setConfirmEmail] = useState('');
  const [deleting, setDeleting] = useState(false);
  const expected = (target.email || '').trim().toLowerCase();
  const matches = confirmEmail.trim().toLowerCase() === expected && expected.length > 0;

  const submit = async () => {
    if (!matches) {
      toast.error('Enter the user\'s email exactly to confirm');
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${target.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmEmail: confirmEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to delete account');
        return;
      }
      toast.success('Account permanently deleted from database');
      onDeleted?.();
      onClose();
    } catch {
      toast.error('Network error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4">
      <div className="bg-gray-900 rounded-2xl border border-red-900/50 shadow-2xl w-full max-w-lg">
        <div className="p-6 border-b border-gray-800">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-500" />
            Permanently delete account
          </h3>
          <p className="text-sm text-gray-400 mt-2">
            <strong className="text-red-400">{target.name}</strong> — profile, photos, documents, messages,
            interests, subscriptions, and all related records will be removed. This cannot be undone.
          </p>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-300">
            Type <span className="font-mono text-amber-300 bg-gray-800 px-2 py-0.5 rounded">{target.email}</span> to confirm:
          </p>
          <input
            type="email"
            value={confirmEmail}
            onChange={(e) => setConfirmEmail(e.target.value)}
            placeholder="user@email.com"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:border-red-500 outline-none"
            autoComplete="off"
          />
        </div>
        <div className="p-6 border-t border-gray-800 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={deleting || !matches}
            className="flex-1 py-2.5 bg-red-700 hover:bg-red-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Delete forever
          </button>
        </div>
      </div>
    </div>
  );
}

function UserCard({ u, onView, onApprove, onReject, onRemind, onDeleteAccount, statusBadge, selected, onToggleSelect, showReminder }) {
  const rs = u.reminderStats;
  const lastReminded = rs?.lastReminderAt
    ? formatDistanceToNow(new Date(rs.lastReminderAt), { addSuffix: true })
    : null;

  return (
    <div className={`bg-gray-800 rounded-3xl p-5 border transition-colors shadow-lg flex flex-col h-full relative group ${
      selected ? 'border-vd-primary ring-1 ring-vd-primary/40' : 'border-gray-700 hover:border-gray-600'
    }`}>
      {showReminder && onToggleSelect && (
        <label className="absolute top-4 left-4 z-10 cursor-pointer">
          <input
            type="checkbox"
            checked={!!selected}
            onChange={() => onToggleSelect(u.id)}
            className="w-4 h-4 rounded border-gray-600 bg-gray-900 text-vd-primary focus:ring-vd-primary"
          />
        </label>
      )}
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
        {showReminder && lastReminded && (
          <span className="text-xs font-medium bg-amber-500/15 text-amber-400 px-2 py-1 rounded-lg w-full truncate">
            Reminded {lastReminded}
            {rs?.reminderCount > 1 ? ` (${rs.reminderCount}×)` : ''}
          </span>
        )}
        {statusBadge === 'rejected' && u.profileRejectionReason && (
          <p className="text-xs text-red-300/90 bg-red-500/10 border border-red-500/20 rounded-lg px-2 py-2 line-clamp-3 w-full" title={u.profileRejectionReason}>
            {u.profileRejectionReason}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2 mt-auto">
        {statusBadge === 'pending' && showReminder && onRemind && (
          <button
            type="button"
            onClick={() => onRemind(u)}
            className="w-full py-2.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Bell className="w-4 h-4" /> Send Reminder
          </button>
        )}
        <div className="flex gap-2">
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
        {statusBadge === 'rejected' && onDeleteAccount && (
          <button
            type="button"
            onClick={() => onDeleteAccount(u)}
            className="w-full py-2.5 bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/60 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Delete account permanently
          </button>
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
  const [reminderTargets, setReminderTargets] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());

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
  useEffect(() => { setPage(1); setSelectedIds(new Set()); }, [activeTab, debouncedQ]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllOnPage = () => {
    if (selectedIds.size === users.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(users.map((u) => u.id)));
  };

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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm font-medium text-gray-400">
          Total <span className="text-white">{total}</span> records found
        </p>
        {activeTab === 'pending' && users.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={selectAllOnPage}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-gray-800 text-gray-300 hover:text-white border border-gray-700"
            >
              {selectedIds.size === users.length ? 'Deselect all' : 'Select all on page'}
            </button>
            {selectedIds.size > 0 && (
              <button
                type="button"
                onClick={() =>
                  setReminderTargets(users.filter((u) => selectedIds.has(u.id)))
                }
                className="px-4 py-2 rounded-xl text-xs font-bold vd-gradient-gold text-white flex items-center gap-1.5 shadow-lg shadow-vd-primary/20"
              >
                <Send className="w-3.5 h-3.5" />
                Remind selected ({selectedIds.size})
              </button>
            )}
          </div>
        )}
      </div>

      {activeTab === 'rejected' && (
        <div className="rounded-2xl border border-red-500/25 bg-red-500/5 px-4 py-3 text-sm text-red-200/90 flex items-start gap-3">
          <Trash2 className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p>
            <strong className="text-red-300">Permanent delete</strong> removes the user and all related data
            from the database (profile, photos, chats, documents, etc.). You must type their email to confirm.
          </p>
        </div>
      )}

      {activeTab === 'pending' && (
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 px-4 py-3 text-sm text-amber-200/90 flex items-start gap-3">
          <Bell className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <p>
            <strong className="text-amber-300">Profile reminders</strong> send an email, in-app notification,
            and web push (if the user subscribed). Users are limited to one reminder per 24 hours unless you force resend.
          </p>
        </div>
      )}

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
            <UserCard
              key={u.id}
              u={u}
              onView={() => setSelectedId(u.id)}
              onApprove={() => updateUser(u.id, { adminVerified: true })}
              onReject={() => setRejectTarget(u)}
              onRemind={(user) => setReminderTargets([user])}
              onDeleteAccount={activeTab === 'rejected' ? (user) => setDeleteTarget(user) : undefined}
              statusBadge={activeTab}
              showReminder={activeTab === 'pending'}
              selected={selectedIds.has(u.id)}
              onToggleSelect={activeTab === 'pending' ? toggleSelect : undefined}
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

      {selectedId && (
        <AdminUserProfileModal
          userId={selectedId}
          allowPermanentDelete={activeTab === 'rejected'}
          onRequestDelete={() => {
            const u = users.find((x) => x.id === selectedId);
            if (u) setDeleteTarget(u);
          }}
          onClose={() => { setSelectedId(null); load(); }}
        />
      )}

      {reminderTargets && (
        <AdminReminderModal
          targets={reminderTargets}
          onClose={() => setReminderTargets(null)}
          onSent={() => {
            setSelectedIds(new Set());
            load();
          }}
        />
      )}

      {rejectTarget && (
        <RejectModal
          target={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onRejected={() => {
            load();
            window.dispatchEvent(new Event('admin-stats-refresh'));
          }}
        />
      )}

      {deleteTarget && (
        <DeleteAccountModal
          target={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => {
            if (selectedId === deleteTarget.id) setSelectedId(null);
            setDeleteTarget(null);
            load();
            window.dispatchEvent(new Event('admin-stats-refresh'));
          }}
        />
      )}

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
