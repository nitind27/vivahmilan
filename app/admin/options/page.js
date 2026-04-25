'use client';
import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { key: 'religion', label: 'Religion' }, { key: 'caste_Hindu', label: 'Caste - Hindu' },
  { key: 'caste_Muslim', label: 'Caste - Muslim' }, { key: 'caste_Christian', label: 'Caste - Christian' },
  { key: 'caste_Sikh', label: 'Caste - Sikh' }, { key: 'caste_Jain', label: 'Caste - Jain' },
  { key: 'gotra', label: 'Gotra' }, { key: 'motherTongue', label: 'Mother Tongue' },
  { key: 'education', label: 'Education' }, { key: 'profession', label: 'Profession' },
  { key: 'income', label: 'Income' }, { key: 'diet', label: 'Diet' },
  { key: 'bodyType', label: 'Body Type' }, { key: 'complexion', label: 'Complexion' },
  { key: 'familyType', label: 'Family Type' }, { key: 'familyStatus', label: 'Family Status' },
  { key: 'horoscopeSign', label: 'Horoscope Sign' }, { key: 'nakshatra', label: 'Nakshatra' },
];

export default function OptionsPage() {
  const [options, setOptions] = useState([]);
  const [category, setCategory] = useState('religion');
  const [newOpt, setNewOpt] = useState({ value: '', label: '', group: '' });

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

  const filtered = options.filter(o => o.category === category);
  const groups = [...new Set(filtered.map(o => o.group).filter(Boolean))];
  const ungrouped = filtered.filter(o => !o.group);
  const catLabel = CATEGORIES.find(c => c.key === category)?.label || category;
  const inp = "w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-xl text-sm focus:outline-none focus:border-vd-primary";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Profile Options Manager</h2>
          <p className="text-gray-400 text-sm mt-0.5">Add, edit, or disable options in user profile forms</p>
        </div>
        <span className="text-xs bg-gray-700 text-gray-300 px-3 py-1.5 rounded-full">{filtered.length} in {catLabel}</span>
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
