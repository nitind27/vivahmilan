'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Edit2, Trash2, Plus, ExternalLink, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { ABOUT_VALUE_ICONS } from '@/lib/about';

const SETTING_FIELDS = [
  { key: 'hero_tag', label: 'Hero Tag', placeholder: '🪔 Vivah Dwar Matrimonial' },
  { key: 'hero_title', label: 'Hero Title', placeholder: 'Bringing Hearts Together' },
  { key: 'hero_highlight', label: 'Hero Highlight', placeholder: 'With Trust & Tradition' },
  { key: 'hero_subtitle', label: 'Hero Subtitle', type: 'textarea' },
  { key: 'mission_title', label: 'Mission Title' },
  { key: 'mission_content', label: 'Mission Content', type: 'textarea' },
  { key: 'vision_title', label: 'Vision Title' },
  { key: 'vision_content', label: 'Vision Content', type: 'textarea' },
  { key: 'story_title', label: 'Story Title' },
  { key: 'story_content', label: 'Story Content', type: 'textarea' },
  { key: 'cta_title', label: 'CTA Title' },
  { key: 'cta_subtitle', label: 'CTA Subtitle', type: 'textarea' },
];

export default function AdminAboutPage() {
  const [tab, setTab] = useState('content');
  const [settings, setSettings] = useState({});
  const [values, setValues] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [saving, setSaving] = useState(false);
  const [editValue, setEditValue] = useState(null);
  const [editMilestone, setEditMilestone] = useState(null);
  const [newValue, setNewValue] = useState({ icon: 'Heart', title: '', description: '', sortOrder: 0 });
  const [newMilestone, setNewMilestone] = useState({ year: '', title: '', description: '', sortOrder: 0 });

  const inp = 'w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm focus:outline-none focus:border-pink-500 text-white placeholder:text-gray-500';

  const load = () =>
    fetch('/api/admin/about')
      .then((r) => r.json())
      .then((d) => {
        setSettings(d.settings || {});
        setValues(Array.isArray(d.values) ? d.values : []);
        setMilestones(Array.isArray(d.milestones) ? d.milestones : []);
      })
      .catch(() => {});

  useEffect(() => { load(); }, []);

  const saveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/about', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'settings', settings }),
      });
      if (res.ok) toast.success('About page content saved');
      else toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const saveValue = async (data) => {
    const res = await fetch('/api/admin/about', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'value', ...data }),
    });
    if (res.ok) {
      toast.success(data.id ? 'Value updated' : 'Value added');
      setEditValue(null);
      setNewValue({ icon: 'Heart', title: '', description: '', sortOrder: 0 });
      load();
    } else toast.error('Failed');
  };

  const saveMilestone = async (data) => {
    const res = await fetch('/api/admin/about', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'milestone', ...data }),
    });
    if (res.ok) {
      toast.success(data.id ? 'Milestone updated' : 'Milestone added');
      setEditMilestone(null);
      setNewMilestone({ year: '', title: '', description: '', sortOrder: 0 });
      load();
    } else toast.error('Failed');
  };

  const del = async (type, id) => {
    if (!confirm('Delete this item?')) return;
    await fetch('/api/admin/about', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, id }),
    });
    toast.success('Deleted');
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">About Us Page</h2>
          <p className="text-gray-400 text-sm mt-1">Manage content shown on the public /about page</p>
        </div>
        <Link href="/about" target="_blank" className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm text-gray-300 hover:text-white">
          <ExternalLink className="w-4 h-4" /> Preview Page
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { id: 'content', label: 'Page Content' },
          { id: 'values', label: `Core Values (${values.length})` },
          { id: 'milestones', label: `Milestones (${milestones.length})` },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === t.id ? 'vd-gradient-gold text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'content' && (
        <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700 space-y-4">
          <h3 className="font-bold text-lg text-white">Hero, Mission, Vision & CTA</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {SETTING_FIELDS.map((f) => (
              <div key={f.key} className={f.type === 'textarea' ? 'sm:col-span-2' : ''}>
                <label className="text-xs text-gray-400 mb-1 block">{f.label}</label>
                {f.type === 'textarea' ? (
                  <textarea
                    value={settings[f.key] || ''}
                    onChange={(e) => setSettings((p) => ({ ...p, [f.key]: e.target.value }))}
                    rows={3}
                    placeholder={f.placeholder}
                    className={inp + ' resize-none'}
                  />
                ) : (
                  <input
                    value={settings[f.key] || ''}
                    onChange={(e) => setSettings((p) => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className={inp}
                  />
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={saveSettings}
            className="flex items-center gap-2 px-6 py-2.5 vd-gradient-gold text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-60"
          >
            <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save Content'}
          </button>
        </div>
      )}

      {tab === 'values' && (
        <div className="space-y-5">
          <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
            <h3 className="font-bold text-lg mb-4 text-white">Add Core Value</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Icon</label>
                <select value={newValue.icon} onChange={(e) => setNewValue((p) => ({ ...p, icon: e.target.value }))} className={inp}>
                  {ABOUT_VALUE_ICONS.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Sort Order</label>
                <input type="number" value={newValue.sortOrder} onChange={(e) => setNewValue((p) => ({ ...p, sortOrder: parseInt(e.target.value) || 0 }))} className={inp} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-gray-400 mb-1 block">Title</label>
                <input value={newValue.title} onChange={(e) => setNewValue((p) => ({ ...p, title: e.target.value }))} className={inp} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-gray-400 mb-1 block">Description</label>
                <textarea value={newValue.description} onChange={(e) => setNewValue((p) => ({ ...p, description: e.target.value }))} rows={2} className={inp + ' resize-none'} />
              </div>
            </div>
            <button type="button" onClick={() => saveValue(newValue)} className="mt-4 px-6 py-2.5 vd-gradient-gold text-white rounded-xl text-sm font-semibold hover:opacity-90">
              Add Value
            </button>
          </div>

          <div className="space-y-3">
            {values.map((v) => (
              <div key={v.id} className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
                {editValue?.id === v.id ? (
                  <div className="space-y-3">
                    <select value={editValue.icon} onChange={(e) => setEditValue((p) => ({ ...p, icon: e.target.value }))} className={inp}>
                      {ABOUT_VALUE_ICONS.map((i) => <option key={i} value={i}>{i}</option>)}
                    </select>
                    <input value={editValue.title} onChange={(e) => setEditValue((p) => ({ ...p, title: e.target.value }))} placeholder="Title" className={inp} />
                    <textarea value={editValue.description} onChange={(e) => setEditValue((p) => ({ ...p, description: e.target.value }))} rows={2} className={inp + ' resize-none'} />
                    <input type="number" value={editValue.sortOrder} onChange={(e) => setEditValue((p) => ({ ...p, sortOrder: parseInt(e.target.value) || 0 }))} className={inp} />
                    <div className="flex gap-2">
                      <button type="button" onClick={() => saveValue(editValue)} className="px-4 py-2 vd-gradient-gold text-white rounded-xl text-sm font-semibold">Save</button>
                      <button type="button" onClick={() => setEditValue(null)} className="px-4 py-2 border border-gray-600 rounded-xl text-sm">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">#{v.sortOrder} · {v.icon}</p>
                      <p className="font-semibold text-white">{v.title}</p>
                      <p className="text-sm text-gray-400 mt-1">{v.description}</p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button type="button" onClick={() => setEditValue({ ...v })} className="p-1.5 bg-blue-900/30 text-blue-400 rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button type="button" onClick={() => del('value', v.id)} className="p-1.5 bg-red-900/30 text-red-400 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'milestones' && (
        <div className="space-y-5">
          <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
            <h3 className="font-bold text-lg mb-4 text-white">Add Milestone</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Year</label>
                <input value={newMilestone.year} onChange={(e) => setNewMilestone((p) => ({ ...p, year: e.target.value }))} placeholder="2025" className={inp} />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Sort Order</label>
                <input type="number" value={newMilestone.sortOrder} onChange={(e) => setNewMilestone((p) => ({ ...p, sortOrder: parseInt(e.target.value) || 0 }))} className={inp} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-gray-400 mb-1 block">Title</label>
                <input value={newMilestone.title} onChange={(e) => setNewMilestone((p) => ({ ...p, title: e.target.value }))} className={inp} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-gray-400 mb-1 block">Description</label>
                <textarea value={newMilestone.description} onChange={(e) => setNewMilestone((p) => ({ ...p, description: e.target.value }))} rows={2} className={inp + ' resize-none'} />
              </div>
            </div>
            <button type="button" onClick={() => saveMilestone(newMilestone)} className="mt-4 px-6 py-2.5 vd-gradient-gold text-white rounded-xl text-sm font-semibold hover:opacity-90">
              Add Milestone
            </button>
          </div>

          <div className="space-y-3">
            {milestones.map((m) => (
              <div key={m.id} className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
                {editMilestone?.id === m.id ? (
                  <div className="space-y-3">
                    <input value={editMilestone.year} onChange={(e) => setEditMilestone((p) => ({ ...p, year: e.target.value }))} placeholder="Year" className={inp} />
                    <input value={editMilestone.title} onChange={(e) => setEditMilestone((p) => ({ ...p, title: e.target.value }))} placeholder="Title" className={inp} />
                    <textarea value={editMilestone.description} onChange={(e) => setEditMilestone((p) => ({ ...p, description: e.target.value }))} rows={2} className={inp + ' resize-none'} />
                    <input type="number" value={editMilestone.sortOrder} onChange={(e) => setEditMilestone((p) => ({ ...p, sortOrder: parseInt(e.target.value) || 0 }))} className={inp} />
                    <div className="flex gap-2">
                      <button type="button" onClick={() => saveMilestone(editMilestone)} className="px-4 py-2 vd-gradient-gold text-white rounded-xl text-sm font-semibold">Save</button>
                      <button type="button" onClick={() => setEditMilestone(null)} className="px-4 py-2 border border-gray-600 rounded-xl text-sm">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold text-amber-400">{m.year}</span>
                      <p className="font-semibold text-white mt-0.5">{m.title}</p>
                      <p className="text-sm text-gray-400 mt-1">{m.description}</p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button type="button" onClick={() => setEditMilestone({ ...m })} className="p-1.5 bg-blue-900/30 text-blue-400 rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button type="button" onClick={() => del('milestone', m.id)} className="p-1.5 bg-red-900/30 text-red-400 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
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
