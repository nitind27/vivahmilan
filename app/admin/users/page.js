'use client';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Search, CheckCircle, Ban, Unlock, Star, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);

  const load = async (p = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: p, limit: 50 });
    if (search) params.set('search', search);
    const res = await fetch(`/api/admin/users?${params}`);
    const data = await res.json();
    setUsers(data.users || []);
    setTotal(data.total || 0);
    setPage(p);
    setLoading(false);
  };

  useEffect(() => { load(1); }, []);

  const updateUser = async (id, data) => {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    });
    if (res.ok) { toast.success('Updated'); load(page); } else toast.error('Failed');
  };

  const deleteUser = async (id, name) => {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
    await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    toast.success('Deleted'); load(page);
  };

  const filtered = users.filter(u => {
    if (filter === 'premium') return u.isPremium;
    if (filter === 'pending') return !u.adminVerified;
    if (filter === 'blocked') return !u.isActive;
    if (filter === 'verified') return u.verificationBadge;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load(1)}
            placeholder="Search name, email…"
            className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm focus:outline-none focus:border-vd-primary" />
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)}
          className="px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm focus:outline-none">
          <option value="all">All Users ({users.length})</option>
          <option value="pending">Pending Approval</option>
          <option value="premium">Premium</option>
          <option value="verified">ID Verified</option>
          <option value="blocked">Blocked</option>
        </select>
        <button onClick={() => load(1)} className="px-4 py-2.5 bg-vd-primary text-white rounded-xl text-sm hover:opacity-90">Search</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-vd-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-700/50">
                  <tr>{['User','Phone','Location','Joined','Status','Actions'].map(h => <th key={h} className="text-left px-4 py-3 text-gray-400 font-medium">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {filtered.map(u => (
                    <tr key={u.id} className="hover:bg-gray-700/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-600 overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {u.image ? <img src={u.image} alt="" className="w-full h-full object-cover" /> : <span className="text-xs font-bold text-gray-300">{u.name?.[0]}</span>}
                          </div>
                          <div>
                            <p className="font-medium text-white">{u.name}</p>
                            <p className="text-xs text-gray-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{u.phone || '—'}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{u.profile?.city || '—'}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{format(new Date(u.createdAt), 'dd MMM yy')}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full w-fit ${u.isActive ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>{u.isActive ? 'Active' : 'Blocked'}</span>
                          {u.isPremium && <span className="text-xs bg-yellow-900/30 text-yellow-400 px-2 py-0.5 rounded-full w-fit">{u.premiumPlan || 'Premium'}</span>}
                          {u.verificationBadge && <span className="text-xs bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded-full w-fit">Verified</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          {!u.adminVerified && <button onClick={() => updateUser(u.id, { adminVerified: true })} className="p-1.5 bg-green-900/30 text-green-400 rounded-lg" title="Approve"><CheckCircle className="w-3.5 h-3.5" /></button>}
                          <button onClick={() => updateUser(u.id, { isActive: !u.isActive })} className={`p-1.5 rounded-lg ${u.isActive ? 'bg-red-900/30 text-red-400' : 'bg-green-900/30 text-green-400'}`} title={u.isActive ? 'Block' : 'Unblock'}>
                            {u.isActive ? <Ban className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={() => updateUser(u.id, { isPremium: !u.isPremium })} className="p-1.5 bg-yellow-900/30 text-yellow-400 rounded-lg" title="Toggle Premium"><Star className="w-3.5 h-3.5" /></button>
                          <button onClick={() => deleteUser(u.id, u.name)} className="p-1.5 bg-red-900/30 text-red-400 rounded-lg" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && <div className="text-center py-10 text-gray-500">No users found</div>}
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map(u => (
              <div key={u.id} className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gray-600 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {u.image ? <img src={u.image} alt="" className="w-full h-full object-cover" /> : <span className="font-bold text-gray-300">{u.name?.[0]}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">{u.name}</p>
                    <p className="text-xs text-gray-400 truncate">{u.email}</p>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${u.isActive ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>{u.isActive ? 'Active' : 'Blocked'}</span>
                    {u.isPremium && <span className="text-xs bg-yellow-900/30 text-yellow-400 px-2 py-0.5 rounded-full">{u.premiumPlan || 'Premium'}</span>}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">{u.profile?.city || '—'} · {format(new Date(u.createdAt), 'dd MMM yy')}</p>
                  <div className="flex gap-1.5">
                    {!u.adminVerified && <button onClick={() => updateUser(u.id, { adminVerified: true })} className="p-1.5 bg-green-900/30 text-green-400 rounded-lg"><CheckCircle className="w-3.5 h-3.5" /></button>}
                    <button onClick={() => updateUser(u.id, { isActive: !u.isActive })} className={`p-1.5 rounded-lg ${u.isActive ? 'bg-red-900/30 text-red-400' : 'bg-green-900/30 text-green-400'}`}>
                      {u.isActive ? <Ban className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => updateUser(u.id, { isPremium: !u.isPremium })} className="p-1.5 bg-yellow-900/30 text-yellow-400 rounded-lg"><Star className="w-3.5 h-3.5" /></button>
                    <button onClick={() => deleteUser(u.id, u.name)} className="p-1.5 bg-red-900/30 text-red-400 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {total > 50 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button onClick={() => load(page - 1)} disabled={page === 1} className="px-3 py-1.5 bg-gray-800 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-700">← Prev</button>
              <span className="text-sm text-gray-400">Page {page} of {Math.ceil(total / 50)}</span>
              <button onClick={() => load(page + 1)} disabled={page >= Math.ceil(total / 50)} className="px-3 py-1.5 bg-gray-800 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-700">Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
