'use client';
import { useEffect, useState } from 'react';
import { Edit2, Trash2, Plus, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { FAQ_CATEGORIES, FAQ_ICONS } from '@/lib/faqShared';

const EMPTY = {
  category: 'General',
  question: '',
  answer: '',
  icon: 'HelpCircle',
  sortOrder: 0,
  isActive: true,
  showOnBlog: true,
  showOnHelp: true,
};

export default function AdminFaqManager() {
  const [faqs, setFaqs] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('');

  const inp = 'w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm focus:outline-none focus:border-pink-500 text-white placeholder:text-gray-500';

  const load = () =>
    fetch('/api/admin/faq')
      .then((r) => r.json())
      .then((d) => setFaqs(Array.isArray(d) ? d : []))
      .catch(() => {});

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditId(null);
    setForm(EMPTY);
    setShowForm(true);
  };

  const openEdit = (f) => {
    setEditId(f.id);
    setForm({
      category: f.category || 'General',
      question: f.question || '',
      answer: f.answer || '',
      icon: f.icon || 'HelpCircle',
      sortOrder: f.sortOrder || 0,
      isActive: f.isActive !== false,
      showOnBlog: f.showOnBlog !== false,
      showOnHelp: f.showOnHelp !== false,
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.question.trim() || !form.answer.trim()) {
      toast.error('Question and answer are required');
      return;
    }
    const res = await fetch('/api/admin/faq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, id: editId || undefined }),
    });
    if (res.ok) {
      toast.success(editId ? 'FAQ updated' : 'FAQ created');
      setShowForm(false);
      setEditId(null);
      setForm(EMPTY);
      load();
    } else {
      const data = await res.json();
      toast.error(data.error || 'Save failed');
    }
  };

  const del = async (id) => {
    if (!confirm('Delete this FAQ permanently?')) return;
    await fetch('/api/admin/faq', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    toast.success('Deleted');
    load();
  };

  const toggleField = async (faq, field) => {
    const res = await fetch('/api/admin/faq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...faq, [field]: !faq[field], id: faq.id }),
    });
    if (res.ok) {
      toast.success('Updated');
      load();
    }
  };

  const filtered = filter
    ? faqs.filter((f) => f.category === filter)
    : faqs;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">FAQ Management</h2>
          <p className="text-gray-400 text-sm mt-1">Manage FAQs shown on Blog and Help Center pages</p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="flex items-center gap-2 px-5 py-2.5 vd-gradient-gold text-white rounded-xl text-sm font-semibold hover:opacity-90"
        >
          <Plus className="w-4 h-4" /> New FAQ
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilter('')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${!filter ? 'vd-gradient-gold text-white' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}
        >
          All ({faqs.length})
        </button>
        {FAQ_CATEGORIES.map((c) => {
          const count = faqs.filter((f) => f.category === c).length;
          return (
            <button
              key={c}
              type="button"
              onClick={() => setFilter(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${filter === c ? 'vd-gradient-gold text-white' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}
            >
              {c} ({count})
            </button>
          );
        })}
      </div>

      {showForm && (
        <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700 space-y-4">
          <h3 className="font-bold text-lg text-white">{editId ? 'Edit FAQ' : 'New FAQ'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Category</label>
              <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} className={inp}>
                {FAQ_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Icon</label>
              <select value={form.icon} onChange={(e) => setForm((p) => ({ ...p, icon: e.target.value }))} className={inp}>
                {FAQ_ICONS.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-gray-400 mb-1 block">Question *</label>
              <input value={form.question} onChange={(e) => setForm((p) => ({ ...p, question: e.target.value }))} className={inp} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-gray-400 mb-1 block">Answer *</label>
              <textarea value={form.answer} onChange={(e) => setForm((p) => ({ ...p, answer: e.target.value }))} rows={4} className={inp + ' resize-none'} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Sort Order</label>
              <input type="number" value={form.sortOrder} onChange={(e) => setForm((p) => ({ ...p, sortOrder: parseInt(e.target.value) || 0 }))} className={inp} />
            </div>
            <div className="flex flex-col gap-2 justify-end">
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} className="rounded" />
                Active
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input type="checkbox" checked={form.showOnBlog} onChange={(e) => setForm((p) => ({ ...p, showOnBlog: e.target.checked }))} className="rounded" />
                Show on Blog page
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input type="checkbox" checked={form.showOnHelp} onChange={(e) => setForm((p) => ({ ...p, showOnHelp: e.target.checked }))} className="rounded" />
                Show on Help page
              </label>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={save} className="px-6 py-2.5 vd-gradient-gold text-white rounded-xl text-sm font-semibold hover:opacity-90">
              {editId ? 'Update FAQ' : 'Create FAQ'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditId(null); }} className="px-4 py-2.5 border border-gray-600 rounded-xl text-sm text-gray-300 hover:bg-gray-700">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-gray-800/50 rounded-2xl border border-gray-700">
            No FAQs yet. Click &quot;New FAQ&quot; to add one.
          </div>
        )}
        {filtered.map((f) => (
          <div key={f.id} className={`bg-gray-800 rounded-2xl p-4 border ${f.isActive ? 'border-gray-700' : 'border-gray-700/50 opacity-60'}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">{f.category}</span>
                  {!f.isActive && <span className="text-xs px-2 py-0.5 rounded-full bg-red-900/40 text-red-400">Inactive</span>}
                  {f.showOnBlog && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900/40 text-blue-400">Blog</span>}
                  {f.showOnHelp && <span className="text-xs px-2 py-0.5 rounded-full bg-green-900/40 text-green-400">Help</span>}
                </div>
                <p className="font-semibold text-white text-sm">{f.question}</p>
                <p className="text-sm text-gray-400 mt-1 line-clamp-2">{f.answer}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button type="button" onClick={() => toggleField(f, 'isActive')} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700" title={f.isActive ? 'Deactivate' : 'Activate'}>
                  {f.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button type="button" onClick={() => openEdit(f)} className="p-2 text-blue-400 hover:bg-gray-700 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                <button type="button" onClick={() => del(f.id)} className="p-2 text-red-400 hover:bg-gray-700 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
