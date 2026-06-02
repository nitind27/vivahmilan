'use client';
import { useEffect, useState } from 'react';
import { Trash2, Database, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { key: 'religion', label: 'Religion' },
  { key: 'caste_Hindu', label: 'Community — Hindu' },
  { key: 'caste_Muslim', label: 'Community — Muslim' },
  { key: 'caste_Christian', label: 'Community — Christian' },
  { key: 'caste_Sikh', label: 'Community — Sikh' },
  { key: 'caste_Jain', label: 'Community — Jain' },
  { key: 'caste_Buddhist', label: 'Community — Buddhist' },
  { key: 'caste_Parsi', label: 'Community — Parsi' },
  { key: 'caste_Jewish', label: 'Community — Jewish' },
  { key: 'caste_NoReligion', label: 'Community — No Religion' },
  { key: 'caste_Other', label: 'Community — Other' },
  { key: 'gotra', label: 'Gotra' },
  { key: 'motherTongue', label: 'Mother Tongue' },
  { key: 'education', label: 'Education' },
  { key: 'profession', label: 'Profession' },
  { key: 'income', label: 'Income' },
  { key: 'diet', label: 'Diet' },
  { key: 'bodyType', label: 'Body Type' },
  { key: 'complexion', label: 'Complexion' },
  { key: 'familyType', label: 'Family Type' },
  { key: 'familyStatus', label: 'Family Status' },
  { key: 'horoscopeSign', label: 'Horoscope Sign' },
  { key: 'nakshatra', label: 'Nakshatra' },
];

export default function OptionsPage() {
  const [options, setOptions] = useState([]);
  const [category, setCategory] = useState('religion');
  const [newOpt, setNewOpt] = useState({ value: '', label: '', group: '' });
  const [seeding, setSeeding] = useState(false);

  const load = () => fetch('/api/profile-options').then(r => r.json()).then(setOptions).catch(() => {});
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!newOpt.value || !newOpt.label) { toast.error('Value and label required'); return; }
    const res = await fetch('/api/profile-options', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ category, ...newOpt }) });
    if (res.ok) { toast.success('Added'); setNewOpt({ value: '', label: '', group: '' }); load(); }
    else { const d = await res.json(); toast.error(d.error); }
  };

  const toggle = async (id, isActive) => {
    await fetch('/api/profile-options', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, isActive: !isActive }) });
    load();
  };

  const del = async (id) => {
    if (!confirm('Delete this option?')) return;
    await fetch('/api/profile-options', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    toast.success('Deleted'); load();
  };

  const seedDefaults = async () => {
    if (!confirm('Create table (if missing) and insert all default options from caste/religion data? Existing rows are kept.')) return;
    setSeeding(true);
    try {
      const res = await fetch('/api/admin/profile-options/seed', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Seed failed');
      toast.success(data.message || `Inserted ${data.inserted} options`);
      load();
    } catch (e) {
      toast.error(e.message || 'Seed failed');
    } finally {
      setSeeding(false);
    }
  };

  const filtered = options.filter(o => o.category === category);
  const groups = [...new Set(filtered.map(o => o.group).filter(Boolean))];
  const ungrouped = filtered.filter(o => !o.group);
  const catLabel = CATEGORIES.find(c => c.key === category)?.label || category;
  const inp = "w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-xl text-sm focus:outline-none focus:border-vd-primary";

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Profile Options Manager</h2>
          <p className="text-gray-400 text-sm mt-0.5">Add, edit, or disable options in user profile forms</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={seedDefaults}
            disabled={seeding}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-60"
          >
            {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
            Restore default options
          </button>
          <span className="text-xs bg-gray-700 text-gray-300 px-3 py-1.5 rounded-full">{filtered.length} in {catLabel}</span>
        </div>
      </div>

      <div className="rounded-xl border border-gray-700 bg-gray-800/80 px-4 py-3 text-xs text-gray-400">
        <strong className="text-gray-300">Database:</strong> Run{' '}
        <code className="text-emerald-400">migrations/profileoption_setup.sql</code> then{' '}
        <code className="text-emerald-400">node prisma/seed-options.js</code> — or use the green button above.
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(c => (
          <button key={c.key} onClick={() => setCategory(c.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${category === c.key ? 'vd-gradient-gold text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'}`}>
            {c.label} <span className="ml-1 opacity-60">{options.filter(o => o.category === c.key).length}</span>
          </button>
        ))}
      </div>

      <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
        <p className="text-sm font-semibold text-gray-300 mb-3">Add to "{catLabel}"</p>
        <div className="grid grid-cols-3 gap-3">
          <div><label className="text-xs text-gray-400 mb-1 block">Value (DB)</label><input value={newOpt.value} onChange={e => setNewOpt(p => ({ ...p, value: e.target.value, label: p.label || e.target.value }))} placeholder="e.g. Sharma" className={inp} /></div>
          <div><label className="text-xs text-gray-400 mb-1 block">Display Label</label><input value={newOpt.label} onChange={e => setNewOpt(p => ({ ...p, label: e.target.value }))} placeholder="e.g. Sharma" className={inp} /></div>
          <div><label className="text-xs text-gray-400 mb-1 block">Group (optional)</label><input value={newOpt.group} onChange={e => setNewOpt(p => ({ ...p, group: e.target.value }))} placeholder="e.g. Brahmin" list={`grp-${category}`} className={inp} /><datalist id={`grp-${category}`}>{groups.map(g => <option key={g} value={g} />)}</datalist></div>
        </div>
        <button onClick={add} className="mt-3 vd-gradient-gold text-white px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-90">+ Add Option</button>
      </div>

      <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
        <div className="px-4 py-3 bg-gray-700/50 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-300">{catLabel} Options</p>
          <p className="text-xs text-gray-500">{filtered.filter(o => o.isActive).length} active / {filtered.length} total</p>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: 500 }}>
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-gray-500 text-sm">No options yet. Add some above.</div>
          ) : (
            <>
              {groups.map(group => (
                <div key={group}>
                  <div className="px-4 py-2 bg-gray-700/30 text-xs font-bold text-gray-400 uppercase tracking-wider sticky top-0">{group}</div>
                  {filtered.filter(o => o.group === group).map(opt => (
                    <div key={opt.id} className={`flex items-center gap-3 px-4 py-2.5 border-b border-gray-700/50 hover:bg-gray-700/30 ${!opt.isActive ? 'opacity-40' : ''}`}>
                      <div className="flex-1 min-w-0"><span className="text-sm text-white">{opt.label}</span>{opt.value !== opt.label && <span className="text-xs text-gray-500 ml-2">({opt.value})</span>}</div>
                      <button onClick={() => toggle(opt.id, opt.isActive)} className={`text-xs px-2.5 py-1 rounded-lg ${opt.isActive ? 'bg-green-900/30 text-green-400 hover:bg-green-900/50' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}>{opt.isActive ? 'Active' : 'Disabled'}</button>
                      <button onClick={() => del(opt.id)} className="p-1.5 text-gray-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                </div>
              ))}
              {ungrouped.length > 0 && (
                <>
                  {groups.length > 0 && <div className="px-4 py-2 bg-gray-700/30 text-xs font-bold text-gray-400 uppercase tracking-wider">Other</div>}
                  {ungrouped.map(opt => (
                    <div key={opt.id} className={`flex items-center gap-3 px-4 py-2.5 border-b border-gray-700/50 hover:bg-gray-700/30 ${!opt.isActive ? 'opacity-40' : ''}`}>
                      <div className="flex-1 min-w-0"><span className="text-sm text-white">{opt.label}</span>{opt.value !== opt.label && <span className="text-xs text-gray-500 ml-2">({opt.value})</span>}</div>
                      <button onClick={() => toggle(opt.id, opt.isActive)} className={`text-xs px-2.5 py-1 rounded-lg ${opt.isActive ? 'bg-green-900/30 text-green-400 hover:bg-green-900/50' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}>{opt.isActive ? 'Active' : 'Disabled'}</button>
                      <button onClick={() => del(opt.id)} className="p-1.5 text-gray-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
