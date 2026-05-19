'use client';
import { useState, useEffect } from 'react';
import { Users, Save, Trash2, Search, Percent, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function AffiliatesPage() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // New Agent Form
  const [search, setSearch] = useState('');
  const [user, setUser] = useState(null);
  const [code, setCode] = useState('');
  const [pct, setPct] = useState(10);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () => {
    fetch('/api/admin/affiliates')
      .then(r => r.json())
      .then(d => setAgents(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const searchUser = async () => {
    if (!search.trim()) return;
    setSearching(true);
    const res = await fetch(`/api/admin/users?search=${encodeURIComponent(search)}&limit=1`);
    const data = await res.json();
    if (data.users?.length) {
      setUser(data.users[0]);
      setCode(data.users[0].name.split(' ')[0].toUpperCase() + Math.floor(100 + Math.random() * 900));
    } else {
      toast.error('User not found');
      setUser(null);
    }
    setSearching(false);
  };

  const createAgent = async () => {
    if (!user || !code) return;
    setSaving(true);
    const res = await fetch('/api/admin/affiliates', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, referralCode: code.toUpperCase(), commissionPct: parseInt(pct) })
    });
    if (res.ok) {
      toast.success('Agent created!');
      setUser(null); setSearch(''); setCode(''); setPct(10);
      load();
    } else {
      const e = await res.json();
      toast.error(e.error || 'Failed to create');
    }
    setSaving(false);
  };

  const removeAgent = async (id) => {
    if (!confirm('Remove this agent?')) return;
    await fetch(`/api/admin/affiliates?id=${id}`, { method: 'DELETE' });
    toast.success('Agent removed');
    load();
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-3xl p-6 border border-gray-700 shadow-xl">
        <h3 className="font-bold text-xl text-white mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-vd-primary" /> Create New Affiliate Agent</h3>
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchUser()}
              placeholder="Search user by email or phone to make them an agent..."
              className="w-full pl-11 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:border-vd-primary" />
          </div>
          <button onClick={searchUser} disabled={searching || !search}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
            {searching ? 'Searching...' : 'Find User'}
          </button>
        </div>

        {user && (
          <div className="bg-gray-900 rounded-2xl p-5 border border-gray-700 flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <p className="text-xs text-gray-400 mb-1">Selected User</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 font-bold overflow-hidden">
                  {user.image ? <img src={user.image} className="w-full h-full object-cover" /> : user.name?.[0]}
                </div>
                <div>
                  <p className="font-semibold text-white">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email || user.phone}</p>
                </div>
              </div>
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-semibold text-gray-400 mb-1">Referral Code</label>
              <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white font-mono uppercase focus:outline-none focus:border-vd-primary" />
            </div>
            <div className="w-28">
              <label className="block text-xs font-semibold text-gray-400 mb-1">Commission %</label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <input type="number" value={pct} onChange={e => setPct(e.target.value)} min="1" max="100" className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:border-vd-primary" />
              </div>
            </div>
            <button onClick={createAgent} disabled={saving} className="px-6 py-2.5 bg-vd-primary hover:opacity-90 text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-2">
              <Save className="w-4 h-4" /> Create Agent
            </button>
          </div>
        )}
      </div>

      <div className="bg-gray-800 rounded-3xl p-6 border border-gray-700 shadow-xl">
        <h3 className="font-bold text-xl text-white mb-6 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-green-400" /> Active Agents</h3>
        
        {loading ? (
          <div className="flex justify-center py-10"><div className="w-8 h-8 border-2 border-vd-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : agents.length === 0 ? (
          <div className="text-center py-10 text-gray-500">No agents created yet. Search above to add one.</div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {agents.map(a => (
              <div key={a.id} className="bg-gray-900 rounded-2xl p-5 border border-gray-700 flex flex-col relative group">
                <button onClick={() => removeAgent(a.id)} className="absolute top-3 right-3 p-1.5 bg-red-900/30 text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white">
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center font-bold overflow-hidden shadow-md">
                    {a.userImage ? <img src={a.userImage} className="w-full h-full object-cover" /> : <span className="text-gray-400 text-lg">{a.userName?.[0]}</span>}
                  </div>
                  <div>
                    <h4 className="font-bold text-white leading-tight">{a.userName}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">{a.userEmail || a.userPhone}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-800 rounded-xl p-3 border border-gray-700/50">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Code</p>
                    <p className="font-mono text-vd-primary font-bold">{a.referralCode}</p>
                  </div>
                  <div className="bg-gray-800 rounded-xl p-3 border border-gray-700/50">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Commission</p>
                    <p className="font-bold text-white">{a.commissionPct}%</p>
                  </div>
                </div>
                
                <div className="bg-green-900/10 border border-green-500/20 rounded-xl p-3 flex justify-between items-center mt-auto">
                  <span className="text-xs text-gray-400 font-medium">Total Earnings</span>
                  <span className="font-bold text-green-400">₹{Number(a.totalEarnings).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
