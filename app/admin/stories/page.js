'use client';
import { useEffect, useState } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StoriesPage() {
  const [stories, setStories] = useState([]);
  const [editStory, setEditStory] = useState(null);
  const [newStory, setNewStory] = useState({ coupleName: '', location: '', story: '', imageUrl: '', sortOrder: 0 });

  const load = () => fetch('/api/admin/stories').then(r => r.json()).then(d => setStories(Array.isArray(d) ? d : [])).catch(() => {});
  useEffect(() => { load(); }, []);

  const save = async (data) => {
    const res = await fetch('/api/admin/stories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (res.ok) { toast.success(data.id ? 'Updated' : 'Added'); setEditStory(null); setNewStory({ coupleName: '', location: '', story: '', imageUrl: '', sortOrder: 0 }); load(); }
    else toast.error('Failed');
  };

  const del = async (id) => {
    if (!confirm('Delete this story?')) return;
    await fetch('/api/admin/stories', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    toast.success('Deleted'); load();
  };

  const inp = "w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm focus:outline-none focus:border-pink-500";

  return (
    <div className="space-y-6">
      <p className="text-gray-400 text-sm">Manage success stories shown on the homepage.</p>
      <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
        <h3 className="font-bold text-lg mb-4">Add New Story</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="text-xs text-gray-400 mb-1 block">Couple Name</label><input value={newStory.coupleName} onChange={e => setNewStory(p => ({ ...p, coupleName: e.target.value }))} placeholder="e.g. Priya & Arjun" className={inp} /></div>
          <div><label className="text-xs text-gray-400 mb-1 block">Location</label><input value={newStory.location} onChange={e => setNewStory(p => ({ ...p, location: e.target.value }))} placeholder="e.g. Mumbai, India" className={inp} /></div>
          <div className="sm:col-span-2"><label className="text-xs text-gray-400 mb-1 block">Story</label><textarea value={newStory.story} onChange={e => setNewStory(p => ({ ...p, story: e.target.value }))} rows={3} placeholder="Their love story…" className={inp + ' resize-none'} /></div>
          <div><label className="text-xs text-gray-400 mb-1 block">Image URL (optional)</label><input value={newStory.imageUrl} onChange={e => setNewStory(p => ({ ...p, imageUrl: e.target.value }))} placeholder="https://…" className={inp} /></div>
          <div><label className="text-xs text-gray-400 mb-1 block">Sort Order</label><input type="number" value={newStory.sortOrder} onChange={e => setNewStory(p => ({ ...p, sortOrder: parseInt(e.target.value) || 0 }))} className={inp} /></div>
        </div>
        <button onClick={() => save(newStory)} className="mt-4 px-6 py-2.5 vd-gradient-gold text-white rounded-xl font-semibold text-sm hover:opacity-90">Add Story</button>
      </div>

      <div className="space-y-3">
        {stories.length === 0 && <div className="text-center py-10 text-gray-500">No stories yet.</div>}
        {stories.map(s => (
          <div key={s.id} className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
            {editStory?.id === s.id ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input value={editStory.coupleName} onChange={e => setEditStory(p => ({ ...p, coupleName: e.target.value }))} placeholder="Couple Name" className={inp} />
                  <input value={editStory.location} onChange={e => setEditStory(p => ({ ...p, location: e.target.value }))} placeholder="Location" className={inp} />
                  <textarea value={editStory.story} onChange={e => setEditStory(p => ({ ...p, story: e.target.value }))} rows={2} placeholder="Story" className={'sm:col-span-2 ' + inp + ' resize-none'} />
                  <input value={editStory.imageUrl || ''} onChange={e => setEditStory(p => ({ ...p, imageUrl: e.target.value }))} placeholder="Image URL" className={inp} />
                  <input type="number" value={editStory.sortOrder} onChange={e => setEditStory(p => ({ ...p, sortOrder: parseInt(e.target.value) || 0 }))} placeholder="Sort Order" className={inp} />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => save(editStory)} className="px-4 py-2 vd-gradient-gold text-white rounded-xl text-sm font-semibold hover:opacity-90">Save</button>
                  <button onClick={() => setEditStory(null)} className="px-4 py-2 border border-gray-600 rounded-xl text-sm hover:bg-gray-700">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full vd-gradient-gold flex items-center justify-center text-white font-bold flex-shrink-0">{s.coupleName?.[0] || '♥'}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white">{s.coupleName}</p>
                    <p className="text-xs text-gray-400">{s.location}</p>
                    <p className="text-sm text-gray-300 mt-1 line-clamp-2">"{s.story}"</p>
                  </div>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button onClick={() => setEditStory({ ...s })} className="p-1.5 bg-blue-900/30 text-blue-400 hover:bg-blue-900/50 rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => del(s.id)} className="p-1.5 bg-red-900/30 text-red-400 hover:bg-red-900/50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
