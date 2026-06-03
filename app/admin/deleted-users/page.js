'use client';
import { useCallback, useEffect, useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { Search, RefreshCw, Trash2, Mail, Phone, UserX, AlertCircle } from 'lucide-react';

export default function DeletedUsersPage() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ limit: '80' });
      if (debounced) params.set('search', debounced);
      const res = await fetch(`/api/admin/deleted-users?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setUsers(data.users || []);
      setTotal(data.total ?? 0);
    } catch (e) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [debounced]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <UserX className="w-7 h-7 text-red-400" />
          Deleted Users
        </h1>
        <p className="text-sm text-gray-400 mt-1 max-w-2xl">
          Members permanently removed after rejection. The same email can register again — when they do,
          they are removed from this list automatically.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search email, name, phone…"
            className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:border-vd-primary"
          />
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="px-4 py-2.5 bg-gray-700 rounded-xl text-sm text-white hover:bg-gray-600 disabled:opacity-50 flex items-center gap-1.5"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <p className="text-xs text-gray-500">{total} deleted account{total === 1 ? '' : 's'} on record</p>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl px-4 py-3 text-sm text-red-300">{error}</div>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-500 text-sm">Loading…</div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Trash2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No deleted users in archive.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-700 bg-gray-800/50">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-gray-400 border-b border-gray-700">
                <th className="px-4 py-3 font-semibold">Member</th>
                <th className="px-4 py-3 font-semibold">Rejected</th>
                <th className="px-4 py-3 font-semibold">Deleted</th>
                <th className="px-4 py-3 font-semibold">By</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-gray-800/80 hover:bg-gray-800/80">
                  <td className="px-4 py-4">
                    <p className="font-semibold text-white">{u.name || '—'}</p>
                    <p className="text-gray-400 flex items-center gap-1 mt-0.5">
                      <Mail className="w-3.5 h-3.5" /> {u.email}
                    </p>
                    {u.phone && (
                      <p className="text-gray-500 flex items-center gap-1 mt-0.5 text-xs">
                        <Phone className="w-3 h-3" /> {u.phone}
                      </p>
                    )}
                    {u.rejectionReason && (
                      <p className="text-xs text-amber-400/90 mt-2 line-clamp-2 flex gap-1">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                        {u.rejectionReason}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-4 text-gray-400 whitespace-nowrap">
                    {u.rejectedAt
                      ? format(new Date(u.rejectedAt), 'dd MMM yyyy')
                      : '—'}
                  </td>
                  <td className="px-4 py-4 text-gray-300 whitespace-nowrap">
                    <span>{format(new Date(u.deletedAt), 'dd MMM yyyy, HH:mm')}</span>
                    <span className="block text-xs text-gray-500">
                      {formatDistanceToNow(new Date(u.deletedAt), { addSuffix: true })}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-gray-400 text-xs">
                    {u.deletedByAdminName || u.deletedByAdminId?.slice(-8) || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
