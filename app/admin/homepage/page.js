'use client';
import { useEffect, useState } from 'react';
import { Edit2, Trash2, Database, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

function Toggle({ value, onChange }) {
  return (
    <div onClick={() => onChange(!value)} className={`w-10 h-5 rounded-full transition-all relative cursor-pointer ${value ? 'bg-vd-primary' : 'bg-gray-600'}`}>
      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${value ? 'left-5' : 'left-0.5'}`} />
    </div>
  );
}

const inp = "w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm focus:outline-none focus:border-pink-500 text-white";

export default function HomepagePage() {
  const [hpTab, setHpTab] = useState('slides');
  const [slides, setSlides] = useState([]);
  const [statsBundle, setStatsBundle] = useState(null);
  const [features, setFeatures] = useState([]);
  const [saving, setSaving] = useState(false);
  const [editSlide, setEditSlide] = useState(null);
  const [editStat, setEditStat] = useState(null);
  const [editFeature, setEditFeature] = useState(null);
  const [newSlide, setNewSlide] = useState({ tag: '', headline: '', highlight: '', sub: '', sortOrder: 0 });
  const [newFeature, setNewFeature] = useState({ icon: 'Heart', title: '', desc: '', sortOrder: 0 });

  const load = async () => {
    const [s, st, f] = await Promise.all([
      fetch('/api/admin/homepage/slides').then(r => r.json()).catch(() => []),
      fetch('/api/admin/homepage/stats').then(r => r.json()).catch(() => null),
      fetch('/api/admin/homepage/features').then(r => r.json()).catch(() => []),
    ]);
    setSlides(Array.isArray(s) ? s : []);
    setStatsBundle(st && !st.error ? st : null);
    setFeatures(Array.isArray(f) ? f : []);
  };
  useEffect(() => { load(); }, []);

  const saveItem = async (endpoint, data, onSuccess) => {
    setSaving(true);
    try {
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (res.ok) { toast.success('Saved'); onSuccess(); load(); } else toast.error('Failed');
    } finally { setSaving(false); }
  };

  const delItem = async (endpoint, id) => {
    if (!confirm('Delete?')) return;
    await fetch(endpoint, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    toast.success('Deleted'); load();
  };

  const setStatsMode = async (manual) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/homepage/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_mode', mode: manual ? 'manual' : 'live' }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatsBundle(data);
        toast.success(manual ? 'Custom display numbers enabled' : 'Real database numbers shown to users');
      } else toast.error(data.error || 'Failed');
    } finally { setSaving(false); }
  };

  const saveStatClaim = async (item) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/homepage/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, value: item.value, suffix: item.suffix }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatsBundle(data);
        setEditStat(null);
        toast.success('Display number saved — custom stats now shown on homepage');
      } else toast.error(data.error || 'Failed');
    } finally { setSaving(false); }
  };

  const ICONS = ['Users', 'Heart', 'Globe', 'Award', 'Star', 'TrendingUp', 'Search', 'Shield'];
  const statsItems = statsBundle?.items || [];
  const statsMode = statsBundle?.mode || 'live';

  return (
    <div className="space-y-6">
      <p className="text-gray-400 text-sm">Manage homepage hero slides, stats, and features.</p>
      <div className="flex gap-2 flex-wrap">
        {[{ id: 'slides', label: 'Hero Slides', count: slides.length }, { id: 'stats', label: 'Stats', count: statsItems.length }, { id: 'features', label: 'Features', count: features.length }].map(t => (
          <button key={t.id} onClick={() => setHpTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${hpTab === t.id ? 'vd-gradient-gold text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'}`}>
            {t.label} <span className="ml-1.5 opacity-60">({t.count})</span>
          </button>
        ))}
      </div>

      {/* SLIDES */}
      {hpTab === 'slides' && (
        <div className="space-y-5">
          <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
            <h3 className="font-bold text-lg mb-4">Add New Slide</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="text-xs text-gray-400 mb-1 block">Tag</label><input value={newSlide.tag} onChange={e => setNewSlide(p => ({ ...p, tag: e.target.value }))} placeholder="e.g. 💑 5M+ Happy Couples" className={inp} /></div>
              <div><label className="text-xs text-gray-400 mb-1 block">Sort Order</label><input type="number" value={newSlide.sortOrder} onChange={e => setNewSlide(p => ({ ...p, sortOrder: parseInt(e.target.value) || 0 }))} className={inp} /></div>
              <div><label className="text-xs text-gray-400 mb-1 block">Headline</label><input value={newSlide.headline} onChange={e => setNewSlide(p => ({ ...p, headline: e.target.value }))} placeholder="e.g. Find Your" className={inp} /></div>
              <div><label className="text-xs text-gray-400 mb-1 block">Highlight (gradient)</label><input value={newSlide.highlight} onChange={e => setNewSlide(p => ({ ...p, highlight: e.target.value }))} placeholder="e.g. Perfect Match" className={inp} /></div>
              <div className="sm:col-span-2"><label className="text-xs text-gray-400 mb-1 block">Subtitle</label><textarea value={newSlide.sub} onChange={e => setNewSlide(p => ({ ...p, sub: e.target.value }))} rows={2} className={inp + ' resize-none'} /></div>
            </div>
            <button disabled={saving} onClick={() => saveItem('/api/admin/homepage/slides', newSlide, () => setNewSlide({ tag: '', headline: '', highlight: '', sub: '', sortOrder: 0 }))}
              className="mt-4 px-6 py-2.5 vd-gradient-gold text-white rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-60">{saving ? 'Saving…' : 'Add Slide'}</button>
          </div>
          <div className="space-y-3">
            {slides.length === 0 && <div className="text-center py-10 text-gray-500 bg-gray-800/50 rounded-2xl border border-gray-700">No slides yet.</div>}
            {slides.map(s => (
              <div key={s.id} className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
                {editSlide?.id === s.id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input value={editSlide.tag} onChange={e => setEditSlide(p => ({ ...p, tag: e.target.value }))} placeholder="Tag" className={inp} />
                      <input type="number" value={editSlide.sortOrder} onChange={e => setEditSlide(p => ({ ...p, sortOrder: parseInt(e.target.value) || 0 }))} placeholder="Sort" className={inp} />
                      <input value={editSlide.headline} onChange={e => setEditSlide(p => ({ ...p, headline: e.target.value }))} placeholder="Headline" className={inp} />
                      <input value={editSlide.highlight} onChange={e => setEditSlide(p => ({ ...p, highlight: e.target.value }))} placeholder="Highlight" className={inp} />
                      <textarea value={editSlide.sub} onChange={e => setEditSlide(p => ({ ...p, sub: e.target.value }))} rows={2} placeholder="Subtitle" className={'sm:col-span-2 ' + inp + ' resize-none'} />
                    </div>
                    <div className="flex gap-2">
                      <button disabled={saving} onClick={() => saveItem('/api/admin/homepage/slides', editSlide, () => setEditSlide(null))} className="px-4 py-2 vd-gradient-gold text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-60">{saving ? 'Saving…' : 'Save'}</button>
                      <button onClick={() => setEditSlide(null)} className="px-4 py-2 border border-gray-600 rounded-xl text-sm hover:bg-gray-700">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1"><span className="text-xs bg-vd-accent-soft text-vd-primary px-2 py-0.5 rounded-full">{s.tag}</span><span className="text-xs text-gray-500">#{s.sortOrder}</span></div>
                      <p className="font-semibold text-white">{s.headline} <span className="vd-gradient-text">{s.highlight}</span></p>
                      <p className="text-sm text-gray-400 mt-1">{s.sub}</p>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button onClick={() => setEditSlide({ ...s })} className="p-1.5 bg-blue-900/30 text-blue-400 hover:bg-blue-900/50 rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => delItem('/api/admin/homepage/slides', s.id)} className="p-1.5 bg-red-900/30 text-red-400 hover:bg-red-900/50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STATS */}
      {hpTab === 'stats' && (
        <div className="space-y-5">
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 space-y-4">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${statsMode === 'live' ? 'bg-green-900/20' : 'bg-amber-900/30'}`}>
                {statsMode === 'live' ? <Database className="w-5 h-5 text-green-400" /> : <Eye className="w-5 h-5 text-amber-400" />}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-white">Homepage stats display</h3>
                <p className="text-xs text-gray-500 mt-1">
                  <strong className="text-gray-400">Real data</strong> = live counts from database (members, stories, countries).
                  <strong className="text-gray-400"> Custom display</strong> = numbers you set below — only shown to visitors; database never changes.
                </p>
              </div>
            </div>
            <div className={`flex items-center justify-between p-4 rounded-xl border ${statsMode === 'live' ? 'bg-green-900/10 border-green-800/30' : 'bg-amber-900/10 border-amber-800/40'}`}>
              <div>
                <p className="text-sm font-semibold text-white">
                  Users see{' '}
                  <span className={statsMode === 'live' ? 'text-green-400' : 'text-amber-400'}>
                    {statsMode === 'live' ? 'real database numbers' : 'custom display numbers'}
                  </span>
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {statsMode === 'live'
                    ? 'Homepage shows actual member count, success stories, countries & verification %'
                    : 'Homepage shows your claimed numbers — actual data stays unchanged in DB'}
                </p>
              </div>
              <Toggle value={statsMode === 'manual'} onChange={(val) => setStatsMode(val)} />
            </div>
            <a href="/" target="_blank" rel="noopener noreferrer" className="text-sm text-pink-400 hover:underline">
              Preview homepage →
            </a>
          </div>

          <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
            <div className="grid grid-cols-4 gap-2 px-4 py-3 bg-gray-900/60 border-b border-gray-700 text-xs font-semibold text-gray-400 uppercase tracking-wide">
              <span className="col-span-1">Stat</span>
              <span className="text-center">Actual</span>
              <span className="text-center">Claimed</span>
              <span className="text-right">Action</span>
            </div>
            {statsItems.length === 0 && (
              <div className="text-center py-10 text-gray-500">Loading stats…</div>
            )}
            {statsItems.map((item) => (
              <div key={item.id} className="grid grid-cols-4 gap-2 px-4 py-4 border-b border-gray-700/60 items-center last:border-b-0">
                {editStat?.id === item.id ? (
                  <div className="col-span-4 space-y-3">
                    <p className="text-sm font-semibold text-white">{item.label}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Display value</label>
                        <input type="number" value={editStat.value}
                          onChange={e => setEditStat(p => ({ ...p, value: parseInt(e.target.value, 10) || 0 }))}
                          className={inp} />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Suffix (e.g. M+, %, +)</label>
                        <input value={editStat.suffix}
                          onChange={e => setEditStat(p => ({ ...p, suffix: e.target.value }))}
                          placeholder="M+, %, +"
                          className={inp} />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      Preview: <span className="text-amber-300 font-semibold">{editStat.value}{editStat.suffix}</span>
                      {' · '}Actual in DB: <span className="text-green-400">{item.actual.display}</span>
                    </p>
                    <div className="flex gap-2">
                      <button disabled={saving} onClick={() => saveStatClaim(editStat)}
                        className="px-4 py-2 vd-gradient-gold text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-60">
                        {saving ? 'Saving…' : 'Save display number'}
                      </button>
                      <button onClick={() => setEditStat(null)} className="px-4 py-2 border border-gray-600 rounded-xl text-sm hover:bg-gray-700">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="text-sm font-semibold text-white">{item.label}</p>
                      <p className="text-xs text-gray-500">{item.icon}</p>
                    </div>
                    <p className="text-center text-sm font-mono text-green-400">{item.actual.display}</p>
                    <p className={`text-center text-sm font-mono font-semibold ${statsMode === 'manual' ? 'text-amber-300' : 'text-gray-400'}`}>
                      {item.claimed.display}
                    </p>
                    <div className="text-right">
                      <button
                        onClick={() => setEditStat({ id: item.id, value: item.claimed.value, suffix: item.claimed.suffix })}
                        className="p-1.5 bg-blue-900/30 text-blue-400 hover:bg-blue-900/50 rounded-lg"
                        title="Edit display number"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-500 leading-relaxed">
            Tip: For Members use value <code className="text-gray-400">20</code> + suffix <code className="text-gray-400">M+</code> to show &quot;20M+&quot;.
            For Countries use <code className="text-gray-400">150</code> + <code className="text-gray-400">+</code>.
            For Verified Profiles use <code className="text-gray-400">98</code> + <code className="text-gray-400">%</code>.
            Turn on custom display to show claimed numbers to users.
          </p>
        </div>
      )}

      {/* FEATURES */}
      {hpTab === 'features' && (
        <div className="space-y-5">
          <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
            <h3 className="font-bold text-lg mb-4">Add New Feature</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="text-xs text-gray-400 mb-1 block">Icon</label><select value={newFeature.icon} onChange={e => setNewFeature(p => ({ ...p, icon: e.target.value }))} className={inp}>{ICONS.map(i => <option key={i} value={i}>{i}</option>)}</select></div>
              <div><label className="text-xs text-gray-400 mb-1 block">Sort Order</label><input type="number" value={newFeature.sortOrder} onChange={e => setNewFeature(p => ({ ...p, sortOrder: parseInt(e.target.value) || 0 }))} className={inp} /></div>
              <div className="sm:col-span-2"><label className="text-xs text-gray-400 mb-1 block">Title</label><input value={newFeature.title} onChange={e => setNewFeature(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Smart Matching" className={inp} /></div>
              <div className="sm:col-span-2"><label className="text-xs text-gray-400 mb-1 block">Description</label><textarea value={newFeature.desc} onChange={e => setNewFeature(p => ({ ...p, desc: e.target.value }))} rows={2} className={inp + ' resize-none'} /></div>
            </div>
            <button disabled={saving} onClick={() => saveItem('/api/admin/homepage/features', newFeature, () => setNewFeature({ icon: 'Heart', title: '', desc: '', sortOrder: 0 }))}
              className="mt-4 px-6 py-2.5 vd-gradient-gold text-white rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-60">{saving ? 'Saving…' : 'Add Feature'}</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {features.length === 0 && <div className="col-span-2 text-center py-10 text-gray-500 bg-gray-800/50 rounded-2xl border border-gray-700">No features yet.</div>}
            {features.map(f => (
              <div key={f.id} className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
                {editFeature?.id === f.id ? (
                  <div className="space-y-2">
                    <select value={editFeature.icon} onChange={e => setEditFeature(p => ({ ...p, icon: e.target.value }))} className={inp}>{ICONS.map(i => <option key={i} value={i}>{i}</option>)}</select>
                    <input value={editFeature.title} onChange={e => setEditFeature(p => ({ ...p, title: e.target.value }))} placeholder="Title" className={inp} />
                    <textarea value={editFeature.desc} onChange={e => setEditFeature(p => ({ ...p, desc: e.target.value }))} rows={2} placeholder="Description" className={inp + ' resize-none'} />
                    <div className="flex gap-2">
                      <button disabled={saving} onClick={() => saveItem('/api/admin/homepage/features', editFeature, () => setEditFeature(null))} className="flex-1 px-3 py-1.5 vd-gradient-gold text-white rounded-lg text-xs font-semibold hover:opacity-90 disabled:opacity-60">{saving ? '...' : 'Save'}</button>
                      <button onClick={() => setEditFeature(null)} className="flex-1 px-3 py-1.5 border border-gray-600 rounded-lg text-xs hover:bg-gray-700">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500">#{f.sortOrder} · {f.icon}</span>
                      <div className="flex gap-1">
                        <button onClick={() => setEditFeature({ ...f })} className="p-1 bg-blue-900/30 text-blue-400 hover:bg-blue-900/50 rounded"><Edit2 className="w-3 h-3" /></button>
                        <button onClick={() => delItem('/api/admin/homepage/features', f.id)} className="p-1 bg-red-900/30 text-red-400 hover:bg-red-900/50 rounded"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    </div>
                    <p className="font-semibold text-white mb-1">{f.title}</p>
                    <p className="text-xs text-gray-400 leading-relaxed">{f.desc}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
