'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MessageCircle, Eye, Sparkles, Phone, UserSearch, Send, X as XIcon, Ban, Unlock, Star, Trash2, CheckCircle, Key, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminUserProfileModal from '@/components/AdminUserProfileModal';
import { PHONE_PLACEHOLDER } from '@/lib/phonePlaceholder';

// ── Admin Direct Chat Modal ───────────────────────────────────────────────────
export function AdminDirectChatModal({ user, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    fetch(`/api/admin/direct-chat?userId=${user.id}`)
      .then(r => r.json())
      .then(data => setMessages(data.messages || []));
  }, [user.id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput('');
    setSending(true);
    const res = await fetch('/api/admin/direct-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, content: text }),
    });
    if (res.ok) {
      const data = await res.json();
      setMessages(prev => [...prev, { id: data.msgId, content: text, senderId: 'admin-self', createdAt: new Date().toISOString() }]);
    } else toast.error('Failed to send');
    setSending(false);
  };

  const photo = user.mainPhoto || user.image;
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-3xl w-full max-w-lg flex flex-col border border-gray-700 shadow-2xl" style={{ height: '80vh' }}>
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-800">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
            {photo ? <img src={photo} alt="" className="w-full h-full object-cover" /> : <span className="w-full h-full flex items-center justify-center text-lg font-bold text-gray-400">{user.name?.[0]}</span>}
          </div>
          <div className="flex-1"><p className="font-semibold text-white text-sm">{user.name}</p><p className="text-xs text-gray-400">{user.email}</p></div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white"><XIcon className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {messages.length === 0 && <p className="text-center text-gray-600 text-sm py-8">No messages yet.</p>}
          {messages.map(msg => {
            const isAdmin = msg.senderId !== user.id;
            return (
              <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs px-3 py-2 rounded-2xl text-sm ${isAdmin ? 'bg-vd-primary text-white rounded-br-sm' : 'bg-gray-800 text-gray-100 rounded-bl-sm'}`}>
                  {isAdmin && <p className="text-xs text-white/60 mb-0.5">You (Admin)</p>}
                  {!isAdmin && <p className="text-xs text-gray-500 mb-0.5">{user.name}</p>}
                  <p>{msg.content}</p>
                  <p className={`text-xs mt-1 ${isAdmin ? 'text-white/50' : 'text-gray-500'}`}>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
        <div className="px-4 py-3 border-t border-gray-800 flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Type a message…" className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-vd-primary" />
          <button onClick={send} disabled={sending || !input.trim()} className="w-10 h-10 bg-vd-primary rounded-xl flex items-center justify-center disabled:opacity-50 hover:opacity-90">
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── All Members Tab ───────────────────────────────────────────────────────────
const PAGE_SIZE = 30;

function formatCount(n) {
  if (n == null) return '…';
  return Number(n).toLocaleString('en-IN');
}

export function AllMembersTab() {
  const [members, setMembers] = useState([]);
  const [total, setTotal] = useState(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [gender, setGender] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [pageCursors, setPageCursors] = useState([null]);
  const [pageIndex, setPageIndex] = useState(0);
  const [chatUser, setChatUser] = useState(null);
  const [viewUserId, setViewUserId] = useState(null);
  const [passwordUser, setPasswordUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const abortRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async ({ cursor = null, direction = 'reset', skipTotal = false } = {}) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    if (direction === 'reset') setLoading(true);
    else setLoadingMore(true);
    setError('');

    const params = new URLSearchParams({ limit: PAGE_SIZE });
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (gender) params.set('gender', gender);
    if (status) params.set('status', status);
    if (skipTotal) params.set('skipTotal', '1');
    if (cursor?.cursorAt && cursor?.cursorId) {
      params.set('cursorAt', cursor.cursorAt);
      params.set('cursorId', cursor.cursorId);
    }

    try {
      const res = await fetch(`/api/admin/members?${params}`, { signal: controller.signal });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load members');

      setMembers(data.members || []);
      if (data.total != null) setTotal(data.total);
      setHasMore(!!data.hasMore);
      setNextCursor(data.nextCursor || null);

      if (direction === 'reset') {
        setPageCursors([null]);
        setPageIndex(0);
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(err.message || 'Failed to load members');
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [debouncedSearch, gender, status]);

  useEffect(() => {
    load({ direction: 'reset' });
    return () => abortRef.current?.abort();
  }, [load]);

  const goNext = () => {
    if (!hasMore || !nextCursor || loadingMore) return;
    const nextPage = pageIndex + 1;
    setPageCursors(prev => {
      const next = [...prev];
      next[nextPage] = nextCursor;
      return next;
    });
    setPageIndex(nextPage);
    load({ cursor: nextCursor, direction: 'forward', skipTotal: true });
  };

  const goPrev = () => {
    if (pageIndex <= 0 || loadingMore) return;
    const prevPage = pageIndex - 1;
    const cursor = pageCursors[prevPage] || null;
    setPageIndex(prevPage);
    load({ cursor, direction: 'back', skipTotal: true });
  };

  const reload = () => load({ direction: 'reset' });

  const calcAge = (dob) => dob ? Math.floor((Date.now() - new Date(dob)) / 31557600000) : null;

  const updateUser = async (id, data) => {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    });
    if (res.ok) { toast.success('Updated'); reload(); } else toast.error('Failed');
  };

  const deleteUser = async (id, name, email) => {
    if (!email) return toast.error('User has no email — cannot confirm delete');
    const typed = prompt(`Permanently delete ${name}?\n\nType their email to confirm:\n${email}`);
    if (!typed || typed.trim().toLowerCase() !== email.trim().toLowerCase()) {
      if (typed !== null) toast.error('Email did not match — delete cancelled');
      return;
    }
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmEmail: typed.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return toast.error(data.error || 'Delete failed');
    toast.success('Account permanently deleted'); reload();
  };

  const handlePasswordChange = async () => {
    if (!newPassword || newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    const res = await fetch(`/api/admin/users/${passwordUser.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: newPassword }),
    });
    if (res.ok) { toast.success(`Password changed for ${passwordUser.name}`); setPasswordUser(null); setNewPassword(''); }
    else toast.error('Failed to change password');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && setDebouncedSearch(search.trim())}
            placeholder="Search name, email, phone…" className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm focus:outline-none focus:border-vd-primary" />
        </div>
        <select value={gender} onChange={e => setGender(e.target.value)} className="px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm focus:outline-none">
          <option value="">All Gender</option><option value="MALE">👨 Male</option><option value="FEMALE">👩 Female</option>
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)} className="px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm focus:outline-none">
          <option value="">All Status</option><option value="verified">✅ Verified</option><option value="premium">⭐ Premium</option>
          <option value="pending">⏳ Pending</option><option value="blocked">🚫 Blocked</option>
        </select>
        <button onClick={reload} disabled={loading} className="px-4 py-2.5 bg-gray-700 rounded-xl text-sm text-white hover:bg-gray-600 disabled:opacity-50 flex items-center gap-1.5">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <p>{formatCount(total)} members{total != null ? ' total' : ''} · showing {members.length} on page {pageIndex + 1}</p>
        {loadingMore && <span className="text-vd-primary">Loading…</span>}
      </div>
      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl px-4 py-3 flex items-center justify-between">
          <p className="text-sm text-red-300">{error}</p>
          <button onClick={reload} className="text-xs px-3 py-1.5 bg-red-800 hover:bg-red-700 text-white rounded-lg">Retry</button>
        </div>
      )}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-2xl border border-gray-700 p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gray-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-700 rounded w-3/4" />
                  <div className="h-3 bg-gray-700 rounded w-1/2" />
                  <div className="h-3 bg-gray-700 rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : members.length === 0 && !error ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-sm">No members found. Try adjusting filters or search.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {members.map(m => {
              const age = calcAge(m.dob);
              const photo = m.mainPhoto || m.image;
              return (
                <div key={m.id} className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden hover:border-vd-primary/50 transition-colors">
                  <div className="flex items-center gap-3 p-4">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gray-700 flex-shrink-0">
                      {photo ? <img src={photo} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-400">{m.name?.[0]}</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-semibold text-white text-sm truncate">{m.name}</p>
                        {!!m.adminVerified && <span className="text-green-400 text-xs">✅</span>}
                        {!!m.isPremium && <span className="text-yellow-400 text-xs">⭐</span>}
                        {!m.isActive && <span className="text-red-400 text-xs">🚫</span>}
                      </div>
                      <p className="text-xs text-gray-400 truncate">{m.email}</p>
                      {m.phone && <p className="text-xs text-gray-500">{m.phone}</p>}
                      {(m.registrationIp || m.lastLoginIp) && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate" title="Registration / Last login IP">
                          🌐 {m.registrationIp || '—'} → {m.lastLoginIp || '—'}
                        </p>
                      )}
                      {(m.lastLoginCity || m.registrationCity) && (
                        <p className="text-xs text-gray-600 truncate">
                          📍 {[m.lastLoginCity || m.registrationCity, m.lastLoginCountry || m.registrationCountry].filter(Boolean).join(', ')}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-1">
                        {m.gender && <span className="text-xs bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded-full">{m.gender === 'MALE' ? '👨' : '👩'} {m.gender}</span>}
                        {age && <span className="text-xs bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded-full">{age}y</span>}
                        {m.city && <span className="text-xs bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded-full">📍{m.city}</span>}
                        {m.religion && <span className="text-xs bg-vd-accent-soft text-vd-primary px-1.5 py-0.5 rounded-full">{m.religion}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-gray-700 px-4 py-3 flex gap-2">
                    <button onClick={() => setViewUserId(m.id)} className="flex-1 text-center text-xs py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors flex items-center justify-center gap-1.5 font-medium">
                      <Eye className="w-3.5 h-3.5" /> View Profile
                    </button>
                    <button onClick={() => setChatUser(m)} className="flex-1 text-center text-xs py-2 bg-vd-primary/20 hover:bg-vd-primary/30 text-vd-primary rounded-xl transition-colors flex items-center justify-center gap-1.5 font-medium">
                      <MessageCircle className="w-3.5 h-3.5" /> Chat
                    </button>
                  </div>
                  
                  {/* Admin Quick Actions */}
                  <div className="border-t border-gray-700 px-4 py-3 bg-gray-800/50 flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-medium">Admin Actions:</span>
                    <div className="flex gap-2">
                      {!m.adminVerified && (
                        <button onClick={() => updateUser(m.id, { adminVerified: true })} className="p-1.5 bg-green-500/20 text-green-500 hover:bg-green-500 hover:text-white rounded-lg transition-colors" title="Approve">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => updateUser(m.id, { isActive: !m.isActive })} className={`p-1.5 rounded-lg transition-colors ${m.isActive ? 'bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white' : 'bg-green-500/20 text-green-500 hover:bg-green-500 hover:text-white'}`} title={m.isActive ? 'Block User' : 'Unblock User'}>
                        {m.isActive ? <Ban className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                      </button>
                      <button onClick={() => updateUser(m.id, { isPremium: !m.isPremium })} className="p-1.5 bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500 hover:text-white rounded-lg transition-colors" title="Toggle Premium">
                        <Star className="w-4 h-4" />
                      </button>
                      <button onClick={() => setPasswordUser({ id: m.id, name: m.name })} className="p-1.5 bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white rounded-lg transition-colors" title="Change Password">
                        <Key className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteUser(m.id, m.name, m.email)} className="p-1.5 bg-red-900/30 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-colors" title="Delete Account">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {(total == null || total > PAGE_SIZE || pageIndex > 0 || hasMore) ? (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button onClick={goPrev} disabled={pageIndex === 0 || loadingMore} className="px-3 py-1.5 bg-gray-800 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-700">← Prev</button>
              <span className="text-sm text-gray-400">Page {pageIndex + 1}{total != null ? ` · ${formatCount(total)} total` : ''}</span>
              <button onClick={goNext} disabled={!hasMore || loadingMore} className="px-3 py-1.5 bg-gray-800 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-700">Next →</button>
            </div>
          ) : null}
        </>
      )}
      
      {/* Password Change Modal */}
      {passwordUser && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-3xl w-full max-w-sm p-6 border border-gray-700 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Change Password</h3>
            <p className="text-sm text-gray-400 mb-4">Set a new password for <span className="text-white font-semibold">{passwordUser.name}</span>.</p>
            <input type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New Password (min 6 chars)"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white mb-4 focus:outline-none focus:border-vd-primary" />
            <div className="flex gap-2">
              <button onClick={() => { setPasswordUser(null); setNewPassword(''); }} className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-semibold transition-colors">Cancel</button>
              <button onClick={handlePasswordChange} className="flex-1 py-2.5 bg-vd-primary hover:opacity-90 text-white rounded-xl text-sm font-semibold transition-opacity">Update</button>
            </div>
          </div>
        </div>
      )}

      {chatUser && <AdminDirectChatModal user={chatUser} onClose={() => setChatUser(null)} />}
      {viewUserId && <AdminUserProfileModal userId={viewUserId} onClose={() => setViewUserId(null)} />}
    </div>
  );
}

// ── Match Maker Tab ───────────────────────────────────────────────────────────
export function MatchMakerTab() {
  const [phone, setPhone] = useState('');
  const [userData, setUserData] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loadingUser, setLoadingUser] = useState(false);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [chatUser, setChatUser] = useState(null);
  const [viewUserId, setViewUserId] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');

  const lookupUser = async () => {
    if (!phone.trim()) return;
    setLoadingUser(true); setUserData(null); setMatches([]);
    try {
      const res = await fetch(`/api/admin/matchmaker?phone=${encodeURIComponent(phone.trim())}`);
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      setUserData(data.user); setActiveTab('profile');
    } catch { toast.error('Lookup failed'); }
    finally { setLoadingUser(false); }
  };

  const findMatches = async () => {
    if (!userData) return;
    setLoadingMatches(true);
    try {
      const res = await fetch(`/api/admin/matchmaker?userId=${userData.id}&limit=30`);
      const data = await res.json();
      setMatches(data.matches || []); setActiveTab('matches');
    } catch { toast.error('Match search failed'); }
    finally { setLoadingMatches(false); }
  };

  const calcAge = (dob) => dob ? Math.floor((Date.now() - new Date(dob)) / 31557600000) : null;
  const InfoRow = ({ icon, label, value }) => value ? (
    <div className="flex items-start gap-2">
      <span className="text-gray-500 text-xs mt-0.5 w-4 flex-shrink-0">{icon}</span>
      <div><p className="text-xs text-gray-500">{label}</p><p className="text-sm text-white font-medium">{value}</p></div>
    </div>
  ) : null;

  return (
    <div className="space-y-5">
      {/* Search */}
      <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
        <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><UserSearch className="w-5 h-5 text-vd-primary" /> Find User by Phone Number</h3>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={phone} onChange={e => setPhone(e.target.value)} onKeyDown={e => e.key === 'Enter' && lookupUser()}
              placeholder={PHONE_PLACEHOLDER} className="w-full pl-9 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-sm text-white focus:outline-none focus:border-vd-primary" />
          </div>
          <button onClick={lookupUser} disabled={loadingUser || !phone.trim()}
            className="px-6 py-3 bg-vd-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
            {loadingUser ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Search className="w-4 h-4" />} Search
          </button>
        </div>
      </div>

      {userData && (
        <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
          <div className="flex border-b border-gray-700">
            {[{ id: 'profile', label: '👤 Profile' }, { id: 'matches', label: `💕 Matches${matches.length ? ` (${matches.length})` : ''}` }].map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === t.id ? 'text-vd-primary border-b-2 border-vd-primary bg-vd-accent-soft/10' : 'text-gray-400 hover:text-white'}`}>
                {t.label}
              </button>
            ))}
          </div>

          {activeTab === 'profile' && (
            <div className="p-5">
              <div className="flex flex-col sm:flex-row gap-5">
                <div className="flex-shrink-0">
                  <div className="w-28 h-28 rounded-2xl overflow-hidden bg-gray-700 mx-auto sm:mx-0">
                    {userData.mainPhoto || userData.image
                      ? <img src={userData.mainPhoto || userData.image} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-500">{userData.name?.[0]}</div>}
                  </div>
                  {userData.photos?.length > 1 && (
                    <div className="flex gap-1 mt-2 justify-center sm:justify-start">
                      {userData.photos.slice(0, 4).map((p, i) => <img key={i} src={p.url} alt="" className="w-8 h-8 rounded-lg object-cover border border-gray-600" />)}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <h2 className="text-xl font-bold text-white">{userData.name}</h2>
                    {!!userData.adminVerified && <span className="text-xs bg-green-900/30 text-green-400 px-2 py-0.5 rounded-full">✅ Verified</span>}
                    {!!userData.isPremium && <span className="text-xs bg-yellow-900/30 text-yellow-400 px-2 py-0.5 rounded-full">⭐ Premium</span>}
                    {!userData.isActive && <span className="text-xs bg-red-900/30 text-red-400 px-2 py-0.5 rounded-full">🚫 Blocked</span>}
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-4">
                    <InfoRow icon="📧" label="Email" value={userData.email} />
                    <InfoRow icon="📞" label="Phone" value={userData.phone} />
                    <InfoRow icon="⚧" label="Gender" value={userData.gender} />
                    <InfoRow icon="🎂" label="Age" value={calcAge(userData.dob) ? `${calcAge(userData.dob)} years` : null} />
                    <InfoRow icon="🙏" label="Religion" value={userData.religion} />
                    <InfoRow icon="👥" label="Caste" value={userData.caste} />
                    <InfoRow icon="📍" label="Location" value={[userData.city, userData.state, userData.country].filter(Boolean).join(', ')} />
                    <InfoRow icon="🎓" label="Education" value={userData.education} />
                    <InfoRow icon="💼" label="Profession" value={userData.profession} />
                    <InfoRow icon="💰" label="Income" value={userData.income} />
                    <InfoRow icon="📏" label="Height" value={userData.height ? `${userData.height} cm` : null} />
                    <InfoRow icon="💍" label="Marital Status" value={userData.maritalStatus?.replace(/_/g, ' ')} />
                    <InfoRow icon="🗣" label="Mother Tongue" value={userData.motherTongue} />
                    <InfoRow icon="👨‍👩‍👧" label="Family Type" value={userData.familyType} />
                  </div>
                  {userData.aboutMe && (
                    <div className="bg-gray-700/50 rounded-xl p-3 mb-4">
                      <p className="text-xs text-gray-400 mb-1">About</p>
                      <p className="text-sm text-gray-200">{userData.aboutMe}</p>
                    </div>
                  )}
                  {userData.documents?.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-400 mb-2">Documents</p>
                      <div className="flex gap-2 flex-wrap">
                        {userData.documents.map(d => (
                          <a key={d.id} href={d.url} target="_blank" rel="noreferrer"
                            className={`text-xs px-2 py-1 rounded-lg border ${d.status === 'APPROVED' ? 'border-green-600 text-green-400' : d.status === 'REJECTED' ? 'border-red-600 text-red-400' : 'border-gray-600 text-gray-400'}`}>
                            {d.type} · {d.status}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={findMatches} disabled={loadingMatches}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-600 to-rose-500 text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50">
                      {loadingMatches ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      Find Best Matches
                    </button>
                    <button onClick={() => setChatUser(userData)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-vd-primary/20 text-vd-primary border border-vd-primary/30 rounded-xl text-sm font-semibold hover:bg-vd-primary/30">
                      <MessageCircle className="w-4 h-4" /> Personal Chat
                    </button>
                    <button onClick={() => setViewUserId(userData.id)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gray-700 text-white rounded-xl text-sm hover:bg-gray-600">
                      <Eye className="w-4 h-4" /> View Profile
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'matches' && (
            <div className="p-5">
              {matches.length === 0 ? (
                <div className="text-center py-12"><Sparkles className="w-12 h-12 text-gray-700 mx-auto mb-3" /><p className="text-gray-500">Click "Find Best Matches" to search</p></div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-gray-500 mb-3">
                    {matches.length} best {userData.gender === 'MALE' ? 'female' : 'male'} matches for {userData.name} — sorted by compatibility
                  </p>
                  {matches.map((m, idx) => {
                    const age = calcAge(m.dob);
                    const score = Math.min(100, Math.round((m.matchScore / 125) * 100));
                    return (
                      <div key={m.id} className="bg-gray-700/50 rounded-2xl p-4 border border-gray-600 hover:border-vd-primary/40 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${idx === 0 ? 'bg-yellow-500 text-gray-900' : idx === 1 ? 'bg-gray-400 text-gray-900' : idx === 2 ? 'bg-orange-600 text-white' : 'bg-gray-700 text-gray-300'}`}>{idx + 1}</div>
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-600 flex-shrink-0">
                            {m.mainPhoto ? <img src={m.mainPhoto} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl font-bold text-gray-400">{m.name?.[0]}</div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-semibold text-white text-sm">{m.name}</p>
                              {!!m.adminVerified && <span className="text-green-400 text-xs">✅</span>}
                              {!!m.isPremium && <span className="text-yellow-400 text-xs">⭐</span>}
                            </div>
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-400 mt-0.5">
                              {age && <span>{age}y</span>}
                              {m.religion && <span>🙏 {m.religion}{m.caste ? ` · ${m.caste}` : ''}</span>}
                              {m.city && <span>📍 {m.city}{m.state ? `, ${m.state}` : ''}</span>}
                              {m.profession && <span>💼 {m.profession}</span>}
                            </div>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <div className={`text-lg font-bold ${score >= 70 ? 'text-green-400' : score >= 40 ? 'text-yellow-400' : 'text-gray-400'}`}>{score}%</div>
                            <div className="text-xs text-gray-500">match</div>
                          </div>
                        </div>
                        <div className="mt-2 h-1.5 bg-gray-600 rounded-full">
                          <div className={`h-1.5 rounded-full ${score >= 70 ? 'bg-green-500' : score >= 40 ? 'bg-yellow-500' : 'bg-gray-500'}`} style={{ width: `${score}%` }} />
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => setViewUserId(m.id)} className="flex-1 text-center text-xs py-1.5 bg-gray-600 hover:bg-gray-500 text-white rounded-lg flex items-center justify-center gap-1">
                            <Eye className="w-3 h-3" /> View Profile
                          </button>
                          <button onClick={() => setChatUser(m)} className="flex-1 text-center text-xs py-1.5 bg-vd-primary/20 hover:bg-vd-primary/30 text-vd-primary rounded-lg flex items-center justify-center gap-1">
                            <MessageCircle className="w-3 h-3" /> Chat
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {chatUser && <AdminDirectChatModal user={chatUser} onClose={() => setChatUser(null)} />}
      {viewUserId && <AdminUserProfileModal userId={viewUserId} onClose={() => setViewUserId(null)} />}
    </div>
  );
}
