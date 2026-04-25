'use client';
import { useEffect, useState } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const inp = "w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm focus:outline-none focus:border-pink-500 text-white";

export default function HomepagePage() {
  const [hpTab, setHpTab] = useState('slides');
  const [slides, setSlides] = useState([]);
  const [stats, setStats] = useState([]);
  const [features, setFeatures] = useState([]);
  const [saving, setSaving] = useState(false);
  const [editSlide, setEditSlide] = useState(null);
  const [editStat, setEditStat] = useState(null);
  const [editFeature, setEditFeature] = useState(null);
  const [newSlide, setNewSlide] = useState({ tag: '', headline: '', highlight: '', sub: '', sortOrder: 0 });
  const [newStat, setNewStat] = useState({ icon: 'Heart', value: 0, suffix: '', label: '', sortOrder: 0 });
  const [newFeature, setNewFeature] = useState({ icon: 'Heart', title: '', desc: '', sortOrder: 0 });

  const load = async () => {
    const [s, st, f] = await Promise.all([
      fetch('/api/admin/homepage/slides').then(r => r.json()).catch(() => []),
      fetch('/api/admin/homepage/stats').then(r => r.json()).catch(() => []),
      fetch('/api/admin/homepage/features').then(r => r.json()).catch(() => []),
    ]);
    setSlides(Array.isArray(s) ? s : []);
    setStats(Array.isArray(st) ? st : []);
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

  const ICONS = ['Users', 'Heart', 'Globe', 'Award', 'Star', 'TrendingUp', 'Search', 'Shield'];

  return (
    <div className="space-y-6">
      <p className="text-gray-400 text-sm">Manage homepage hero slides, stats, and features.</p>
      <div className="flex gap-2 flex-wrap">
        {[{ id: 'slides', label: 'Hero Slides', count: slides.length }, { id: 'stats', label: 'Stats', count: stats.length }, { id: 'features', label: 'Features', count: features.length }].map(t => (
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
          <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
            <h3 className="font-bold text-lg mb-4">Add New Stat</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div><label className="text-xs text-gray-400 mb-1 block">Icon</label><select value={newStat.icon} onChange={e => setNewStat(p => ({ ...p, icon: e.target.value }))} className={inp}>{ICONS.map(i => <option key={i} value={i}>{i}</option>)}</select></div>
              <div><label className="text-xs text-gray-400 mb-1 block">Value</label><input type="number" value={newStat.value} onChange={e => setNewStat(p => ({ ...p, value: parseInt(e.target.value) || 0 }))} className={inp} /></div>
              <div><label className="text-xs text-gray-400 mb-1 block">Suffix</label><input value={newStat.suffix} onChange={e => setNewStat(p => ({ ...p, suffix: e.target.value }))} placeholder="M+, %" className={inp} /></div>
              <div><label className="text-xs text-gray-400 mb-1 block">Label</label><input value={newStat.label} onChange={e => setNewStat(p => ({ ...p, label: e.target.value }))} placeholder="Members" className={inp} /></div>
              <div><label className="text-xs text-gray-400 mb-1 block">Sort Order</label><input type="number" value={newStat.sortOrder} onChange={e => setNewStat(p => ({ ...p, sortOrder: parseInt(e.target.value) || 0 }))} className={inp} /></div>
            </div>
            <button disabled={saving} onClick={() => saveItem('/api/admin/homepage/stats', newStat, () => setNewStat({ icon: 'Heart', value: 0, suffix: '', label: '', sortOrder: 0 }))}
              className="mt-4 px-6 py-2.5 vd-gradient-gold text-white rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-60">{saving ? 'Saving…' : 'Add Stat'}</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {stats.length === 0 && <div className="col-span-2 text-center py-10 text-gray-500 bg-gray-800/50 rounded-2xl border border-gray-700">No stats yet.</div>}
            {stats.map(s => (
              <div key={s.id} className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
                {editStat?.id === s.id ? (
                  <div className="space-y-2">
                    <select value={editStat.icon} onChange={e => setEditStat(p => ({ ...p, icon: e.target.value }))} className={inp}>{ICONS.map(i => <option key={i} value={i}>{i}</option>)}</select>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="number" value={editStat.value} onChange={e => setEditStat(p => ({ ...p, value: parseInt(e.target.value) || 0 }))} placeholder="Value" className={inp} />
                      <input value={editStat.suffix} onChange={e => setEditStat(p => ({ ...p, suffix: e.target.value }))} placeholder="Suffix" className={inp} />
                    </div>
                    <input value={editStat.label} onChange={e => setEditStat(p => ({ ...p, label: e.target.value }))} placeholder="Label" className={inp} />
                    <div className="flex gap-2">
                      <button disabled={saving} onClick={() => saveItem('/api/admin/homepage/stats', editStat, () => setEditStat(null))} className="flex-1 px-3 py-1.5 vd-gradient-gold text-white rounded-lg text-xs font-semibold hover:opacity-90 disabled:opacity-60">{saving ? '...' : 'Save'}</button>
                      <button onClick={() => setEditStat(null)} className="flex-1 px-3 py-1.5 border border-gray-600 rounded-lg text-xs hover:bg-gray-700">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500">#{s.sortOrder} · {s.icon}</span>
                      <div className="flex gap-1">
                        <button onClick={() => setEditStat({ ...s })} className="p-1 bg-blue-900/30 text-blue-400 hover:bg-blue-900/50 rounded"><Edit2 className="w-3 h-3" /></button>
                        <button onClick={() => delItem('/api/admin/homepage/stats', s.id)} className="p-1 bg-red-900/30 text-red-400 hover:bg-red-900/50 rounded"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    </div>
                    <p className="text-2xl font-bold vd-gradient-text">{s.value}{s.suffix}</p>
                    <p className="text-sm text-gray-400 mt-0.5">{s.label}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
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
