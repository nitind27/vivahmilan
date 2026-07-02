'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Database, Plus, Trash2, RefreshCw, Search, Edit2, X, AlertTriangle,
  Users, MapPin, Filter, ChevronLeft, ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getCastesByReligion, INDIAN_STATES_UTS } from '@/lib/casteData';

const inp = 'w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:border-vd-primary placeholder:text-gray-500';
const lbl = 'text-xs text-gray-400 mb-1 block';

const RELIGIONS = ['Hindu', 'Muslim', 'Sikh', 'Christian', 'Jain', 'Buddhist', 'Parsi', 'Jewish'];
const REGION_TO_STATE = { Delhi: 'Delhi NCR' };
const NORTH_EAST = ['Arunachal Pradesh', 'Assam', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Tripura', 'Sikkim'];
const PAGE_SIZE = 10;

function castesForState(religion, state) {
  const all = getCastesByReligion(religion).filter(
    (c) => !['Doesn\'t Matter', 'Inter-Caste / Inter-Community', 'Inter-Community', 'Prefer Not to Say'].includes(c.val)
  );
  return all.filter((c) => {
    if (c.region === 'Pan India') return true;
    if (c.region === 'North East') return NORTH_EAST.includes(state);
    const mapped = REGION_TO_STATE[c.region] || c.region;
    return mapped === state;
  }).sort((a, b) => a.val.localeCompare(b.val));
}

function EditModal({ profile, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: profile.name || '',
    email: profile.email || '',
    phone: profile.phone || '',
    city: profile.city || '',
    state: profile.state || '',
    caste: profile.caste || '',
    religion: profile.religion || '',
    education: profile.education || '',
    profession: profile.profession || '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/seed-profiles/${profile.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Update failed'); return; }
      toast.success('Dummy profile updated');
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h3 className="font-bold text-white">Edit Dummy Profile</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            ['name', 'Name'], ['email', 'Email'], ['phone', 'Phone'],
            ['city', 'City'], ['state', 'State'], ['caste', 'Caste'],
            ['religion', 'Religion'], ['education', 'Education'], ['profession', 'Profession'],
          ].map(([key, label]) => (
            <div key={key} className={key === 'name' || key === 'email' ? 'sm:col-span-2' : ''}>
              <label className={lbl}>{label}</label>
              <input className={inp} value={form[key]} onChange={(e) => set(key, e.target.value)} />
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-gray-800 flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white">Cancel</button>
          <button type="button" onClick={save} disabled={saving}
            className="px-4 py-2 rounded-xl text-sm font-semibold vd-gradient-gold text-white disabled:opacity-60">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminSeedProfiles() {
  const [summary, setSummary] = useState({ total: 0, males: 0, females: 0, byCaste: [] });
  const [profiles, setProfiles] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);

  const [filterState, setFilterState] = useState('');
  const [filterCaste, setFilterCaste] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [search, setSearch] = useState('');

  const [genReligion, setGenReligion] = useState('Hindu');
  const [genState, setGenState] = useState('Gujarat');
  const [genCaste, setGenCaste] = useState('');
  const [genMales, setGenMales] = useState('10');
  const [genFemales, setGenFemales] = useState('10');

  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteScope, setDeleteScope] = useState('filter');
  const [editProfile, setEditProfile] = useState(null);

  const genCastes = useMemo(() => castesForState(genReligion, genState), [genReligion, genState]);
  const filterCastes = useMemo(() => {
    if (!filterState) return [...new Set(summary.byCaste.map((r) => r.caste))].sort();
    return castesForState('Hindu', filterState).map((c) => c.val);
  }, [filterState, summary.byCaste]);
  const startIdx = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endIdx = Math.min(page * PAGE_SIZE, total);

  useEffect(() => {
    if (genCastes.length && !genCastes.some((c) => c.val === genCaste)) {
      setGenCaste(genCastes[0].val);
    }
  }, [genCastes, genCaste]);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const statsRes = await fetch('/api/admin/seed-profiles/stats');
      const statsData = await statsRes.json();
      if (statsRes.ok) setSummary(statsData);
    } catch {
      toast.error('Failed to load dummy stats');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (filterState) params.set('state', filterState);
      if (filterCaste) params.set('caste', filterCaste);
      if (filterGender) params.set('gender', filterGender);
      if (search.trim()) params.set('search', search.trim());

      const listRes = await fetch(`/api/admin/seed-profiles?${params}`);
      const listData = await listRes.json();

      if (listRes.ok) {
        setProfiles(listData.profiles || []);
        setTotal(listData.total || 0);
        setTotalPages(listData.totalPages || 1);
      }
    } catch {
      toast.error('Failed to load dummy profiles');
    } finally {
      setLoading(false);
    }
  }, [page, filterState, filterCaste, filterGender, search]);

  useEffect(() => { loadList(); }, [loadList]);
  useEffect(() => { loadStats(); }, [loadStats]);

  const generate = async () => {
    if (!genState || !genCaste) { toast.error('Select state and caste'); return; }
    setGenerating(true);
    try {
      const res = await fetch('/api/admin/seed-profiles/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state: genState,
          caste: genCaste,
          religion: genReligion,
          males: parseInt(genMales, 10) || 0,
          females: parseInt(genFemales, 10) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Generation failed'); return; }
      toast.success(data.message || 'Profiles generated');
      setPage(1);
      await Promise.all([loadList(), loadStats()]);
    } finally {
      setGenerating(false);
    }
  };

  const deleteOne = async (id, name) => {
    if (!window.confirm(`Delete dummy profile "${name}" permanently?`)) return;
    const res = await fetch(`/api/admin/seed-profiles/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error || 'Delete failed'); return; }
    toast.success('Deleted');
    await Promise.all([loadList(), loadStats()]);
  };

  const bulkDelete = async () => {
    if (deleteConfirm !== 'DELETE SEED DATA') {
      toast.error('Type DELETE SEED DATA to confirm');
      return;
    }
    const msg = deleteScope === 'all'
      ? `Delete ALL ${summary.total.toLocaleString()} dummy profiles? This cannot be undone.`
      : `Delete dummy profiles for ${filterState || 'any state'} / ${filterCaste || 'any caste'}?`;
    if (!window.confirm(msg)) return;

    setDeleting(true);
    try {
      const res = await fetch('/api/admin/seed-profiles/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scope: deleteScope,
          state: filterState,
          caste: filterCaste,
          confirm: deleteConfirm,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Bulk delete failed'); return; }
      toast.success(data.message);
      setDeleteConfirm('');
      setPage(1);
      await Promise.all([loadList(), loadStats()]);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Dummy Profiles', value: summary.total, icon: Database, color: 'text-amber-400' },
          { label: 'Male', value: summary.males, icon: Users, color: 'text-blue-400' },
          { label: 'Female', value: summary.females, icon: Users, color: 'text-pink-400' },
        ].map((s) => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-gray-800 flex items-center justify-center">
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-2xl font-bold text-white">{Number(s.value).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Generate */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <h2 className="font-bold text-white flex items-center gap-2 mb-4">
          <Plus className="w-5 h-5 text-vd-primary" /> Add Dummy Profiles (Caste-wise)
        </h2>
        <p className="text-xs text-gray-500 mb-4">
          Realistic Indian names, full profile, no photos. Password for all: <strong className="text-gray-300">12345678</strong>
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
          <div>
            <label className={lbl}>Religion</label>
            <select className={inp} value={genReligion} onChange={(e) => setGenReligion(e.target.value)}>
              {RELIGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>State</label>
            <select className={inp} value={genState} onChange={(e) => setGenState(e.target.value)}>
              {INDIAN_STATES_UTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>Caste / Community</label>
            <select className={inp} value={genCaste} onChange={(e) => setGenCaste(e.target.value)}>
              {genCastes.map((c) => <option key={c.val} value={c.val}>{c.val}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>Male profiles</label>
            <input type="number" min="0" max="500" className={inp} value={genMales} onChange={(e) => setGenMales(e.target.value)} />
          </div>
          <div>
            <label className={lbl}>Female profiles</label>
            <input type="number" min="0" max="500" className={inp} value={genFemales} onChange={(e) => setGenFemales(e.target.value)} />
          </div>
        </div>
        <button type="button" onClick={generate} disabled={generating}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold vd-gradient-gold text-white disabled:opacity-60">
          <Plus className="w-4 h-4" />
          {generating ? 'Generating… (may take a minute)' : 'Generate Profiles'}
        </button>
      </div>

      {/* Caste breakdown */}
      {summary.byCaste?.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="font-bold text-white mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-vd-primary" /> Caste-wise Count (top 500)
            {statsLoading ? <span className="text-[10px] text-gray-500">(updating...)</span> : null}
          </h2>
          <div className="overflow-x-auto max-h-48 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="text-gray-500 text-xs sticky top-0 bg-gray-900">
                <tr>
                  <th className="text-left p-2">State</th>
                  <th className="text-left p-2">Caste</th>
                  <th className="text-right p-2">M</th>
                  <th className="text-right p-2">F</th>
                  <th className="text-right p-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {summary.byCaste.map((r) => (
                  <tr key={`${r.state}-${r.caste}`} className="border-t border-gray-800 hover:bg-gray-800/50 cursor-pointer"
                    onClick={() => { setFilterState(r.state); setFilterCaste(r.caste); setPage(1); }}>
                    <td className="p-2 text-gray-300">{r.state}</td>
                    <td className="p-2 text-white">{r.caste}</td>
                    <td className="p-2 text-right text-blue-400">{r.males}</td>
                    <td className="p-2 text-right text-pink-400">{r.females}</td>
                    <td className="p-2 text-right font-semibold text-amber-400">{r.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bulk delete */}
      <div className="bg-red-950/30 border border-red-900/50 rounded-2xl p-5">
        <h2 className="font-bold text-red-400 flex items-center gap-2 mb-2">
          <AlertTriangle className="w-5 h-5" /> Delete Dummy Data
        </h2>
        <p className="text-xs text-gray-500 mb-4">
          Only profiles marked as dummy/seed are affected. Real user accounts are never shown or deleted here.
        </p>
        <div className="flex flex-wrap gap-3 mb-3">
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input type="radio" checked={deleteScope === 'filter'} onChange={() => setDeleteScope('filter')} />
            Delete filtered (use filters below)
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input type="radio" checked={deleteScope === 'all'} onChange={() => setDeleteScope('all')} />
            Delete ALL dummy data ({summary.total.toLocaleString()})
          </label>
        </div>
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className={lbl}>Type DELETE SEED DATA to confirm</label>
            <input className={inp} value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="DELETE SEED DATA" />
          </div>
          <button type="button" onClick={bulkDelete} disabled={deleting}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-500 text-white disabled:opacity-60">
            <Trash2 className="w-4 h-4" />
            {deleting ? 'Deleting…' : 'Delete Dummy Data'}
          </button>
        </div>
      </div>

      {/* List filters */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[160px]">
            <label className={lbl}><Filter className="w-3 h-3 inline mr-1" />State</label>
            <select className={inp} value={filterState} onChange={(e) => { setFilterState(e.target.value); setPage(1); }}>
              <option value="">All states</option>
              {INDIAN_STATES_UTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className={lbl}>Caste</label>
            <select className={inp} value={filterCaste} onChange={(e) => { setFilterCaste(e.target.value); setPage(1); }}>
              <option value="">All castes</option>
              {filterCastes.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="w-32">
            <label className={lbl}>Gender</label>
            <select className={inp} value={filterGender} onChange={(e) => { setFilterGender(e.target.value); setPage(1); }}>
              <option value="">All</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className={lbl}><Search className="w-3 h-3 inline mr-1" />Search</label>
            <input className={inp} value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, email, city…" onKeyDown={(e) => e.key === 'Enter' && loadList()} />
          </div>
          <button type="button" onClick={() => { setPage(1); loadList(); }}
            className="px-4 py-2.5 rounded-xl text-sm bg-gray-800 hover:bg-gray-700 text-white flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Profiles table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <p className="text-sm text-gray-400">
            Showing <span className="text-white font-semibold">{startIdx}-{endIdx}</span> of{' '}
            <span className="text-white font-semibold">{total.toLocaleString()}</span> dummy profiles
          </p>
          <div className="flex items-center gap-2">
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
              className="p-2 rounded-lg bg-gray-800 disabled:opacity-40 hover:bg-gray-700">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-gray-500">{page} / {totalPages}</span>
            <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
              className="p-2 rounded-lg bg-gray-800 disabled:opacity-40 hover:bg-gray-700">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading dummy profiles…</div>
        ) : profiles.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No dummy profiles found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-gray-500 text-xs bg-gray-950/50">
                <tr>
                  <th className="text-left p-3">Name</th>
                  <th className="text-left p-3">Email</th>
                  <th className="text-left p-3">Gender</th>
                  <th className="text-left p-3">State / Caste</th>
                  <th className="text-left p-3">City</th>
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((p) => (
                  <tr key={p.id} className="border-t border-gray-800 hover:bg-gray-800/40">
                    <td className="p-3 text-white font-medium">{p.name}</td>
                    <td className="p-3 text-gray-400 text-xs max-w-[180px] truncate">{p.email}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${p.gender === 'MALE' ? 'bg-blue-900/40 text-blue-300' : 'bg-pink-900/40 text-pink-300'}`}>
                        {p.gender}
                      </span>
                    </td>
                    <td className="p-3 text-gray-400 text-xs">
                      <div>{p.state}</div>
                      <div className="text-gray-500">{p.caste}</div>
                    </td>
                    <td className="p-3 text-gray-400">{p.city}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button type="button" onClick={() => setEditProfile(p)}
                          className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => deleteOne(p.id, p.name)}
                          className="p-2 rounded-lg bg-red-900/30 hover:bg-red-800/50 text-red-400" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editProfile && (
        <EditModal
          profile={editProfile}
          onClose={() => setEditProfile(null)}
          onSaved={async () => { await Promise.all([loadList(), loadStats()]); }}
        />
      )}
    </div>
  );
}
