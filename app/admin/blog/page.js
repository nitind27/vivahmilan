'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Edit2, Trash2, Plus, ExternalLink, Star, Eye, EyeOff, HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { BLOG_CATEGORIES, slugify } from '@/lib/blogShared';
import AdminFaqManager from '@/components/admin/AdminFaqManager';

const EMPTY = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  coverImageUrl: '',
  category: 'Matrimony Tips',
  tags: '',
  authorName: 'Vivah Dwar Team',
  metaTitle: '',
  metaDescription: '',
  isPublished: false,
  isFeatured: false,
  sortOrder: 0,
};

export default function AdminBlogPage() {
  const [pageTab, setPageTab] = useState('posts');
  const [posts, setPosts] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);

  const inp = 'w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm focus:outline-none focus:border-pink-500 text-white placeholder:text-gray-500';

  const load = () =>
    fetch('/api/admin/blog')
      .then((r) => r.json())
      .then((d) => setPosts(Array.isArray(d) ? d : []))
      .catch(() => {});

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditId(null);
    setForm(EMPTY);
    setSlugTouched(false);
    setShowForm(true);
  };

  const openEdit = (p) => {
    setEditId(p.id);
    setForm({
      title: p.title || '',
      slug: p.slug || '',
      excerpt: p.excerpt || '',
      content: p.content || '',
      coverImageUrl: p.coverImageUrl || '',
      category: p.category || 'General',
      tags: p.tags || '',
      authorName: p.authorName || 'Vivah Dwar Team',
      metaTitle: p.metaTitle || '',
      metaDescription: p.metaDescription || '',
      isPublished: !!p.isPublished,
      isFeatured: !!p.isFeatured,
      sortOrder: p.sortOrder || 0,
    });
    setSlugTouched(true);
    setShowForm(true);
  };

  const set = (k, v) => {
    setForm((prev) => {
      const next = { ...prev, [k]: v };
      if (k === 'title' && !slugTouched) next.slug = slugify(v);
      return next;
    });
  };

  const save = async () => {
    if (!form.title.trim() || !form.excerpt.trim() || !form.content.trim()) {
      toast.error('Title, excerpt and content are required');
      return;
    }
    const res = await fetch('/api/admin/blog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, id: editId || undefined }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || 'Save failed');
      return;
    }
    toast.success(editId ? 'Post updated' : 'Post created');
    setShowForm(false);
    setEditId(null);
    setForm(EMPTY);
    load();
  };

  const del = async (id) => {
    if (!confirm('Delete this blog post permanently?')) return;
    await fetch('/api/admin/blog', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    toast.success('Deleted');
    load();
  };

  const togglePublish = async (p) => {
    const res = await fetch('/api/admin/blog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...p, isPublished: !p.isPublished, id: p.id }),
    });
    if (res.ok) {
      toast.success(p.isPublished ? 'Unpublished' : 'Published');
      load();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setPageTab('posts')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 ${pageTab === 'posts' ? 'vd-gradient-gold text-white' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}
        >
          <Star className="w-4 h-4" /> Blog Posts
        </button>
        <button
          type="button"
          onClick={() => setPageTab('faq')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 ${pageTab === 'faq' ? 'vd-gradient-gold text-white' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}
        >
          <HelpCircle className="w-4 h-4" /> FAQs
        </button>
      </div>

      {pageTab === 'faq' ? (
        <AdminFaqManager />
      ) : (
      <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Blog Posts</h2>
          <p className="text-gray-400 text-sm mt-1">Create articles shown on the public blog at /blog</p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="flex items-center gap-2 px-5 py-2.5 vd-gradient-gold text-white rounded-xl text-sm font-semibold hover:opacity-90"
        >
          <Plus className="w-4 h-4" /> New Post
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700 space-y-4">
          <h3 className="font-bold text-lg text-white">{editId ? 'Edit Post' : 'New Post'}</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs text-gray-400 mb-1 block">Title *</label>
              <input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. 10 Tips for a Great Matrimonial Profile" className={inp} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">URL Slug *</label>
              <input
                value={form.slug}
                onChange={(e) => { setSlugTouched(true); set('slug', e.target.value); }}
                placeholder="10-tips-great-profile"
                className={inp}
              />
              <p className="text-xs text-gray-500 mt-1">/blog/{form.slug || 'your-slug'}</p>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Category</label>
              <select value={form.category} onChange={(e) => set('category', e.target.value)} className={inp}>
                {BLOG_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-gray-400 mb-1 block">Short excerpt * (shown on blog cards)</label>
              <textarea value={form.excerpt} onChange={(e) => set('excerpt', e.target.value)} rows={2} maxLength={500} placeholder="Brief summary for listing page…" className={inp + ' resize-none'} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-gray-400 mb-1 block">Content * (use blank lines between paragraphs)</label>
              <textarea value={form.content} onChange={(e) => set('content', e.target.value)} rows={12} placeholder="Write your full article here…&#10;&#10;Separate paragraphs with a blank line." className={inp + ' resize-y min-h-[200px]'} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Cover image URL</label>
              <input value={form.coverImageUrl} onChange={(e) => set('coverImageUrl', e.target.value)} placeholder="https://… or /uploads/…" className={inp} />
              {form.coverImageUrl && (
                <div className="mt-2 aspect-video rounded-xl overflow-hidden border border-gray-600 bg-gray-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.coverImageUrl} alt="Cover preview" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                </div>
              )}
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Author name</label>
              <input value={form.authorName} onChange={(e) => set('authorName', e.target.value)} className={inp} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Tags (comma separated)</label>
              <input value={form.tags} onChange={(e) => set('tags', e.target.value)} placeholder="matrimony, profile, tips" className={inp} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Sort order</label>
              <input type="number" value={form.sortOrder} onChange={(e) => set('sortOrder', parseInt(e.target.value) || 0)} className={inp} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">SEO meta title</label>
              <input value={form.metaTitle} onChange={(e) => set('metaTitle', e.target.value)} placeholder="Optional — defaults to title" className={inp} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-gray-400 mb-1 block">SEO meta description</label>
              <textarea value={form.metaDescription} onChange={(e) => set('metaDescription', e.target.value)} rows={2} maxLength={500} className={inp + ' resize-none'} />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input type="checkbox" checked={form.isPublished} onChange={(e) => set('isPublished', e.target.checked)} className="rounded" />
              Publish on website
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)} className="rounded" />
              Featured post (top of blog)
            </label>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <button type="button" onClick={save} className="px-6 py-2.5 vd-gradient-gold text-white rounded-xl text-sm font-semibold hover:opacity-90">
              {editId ? 'Update Post' : 'Create Post'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditId(null); }} className="px-4 py-2.5 border border-gray-600 rounded-xl text-sm text-gray-300 hover:bg-gray-700">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {posts.length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-gray-800/50 rounded-2xl border border-gray-700">
            No blog posts yet. Click &quot;New Post&quot; to create one.
          </div>
        )}
        {posts.map((p) => (
          <div key={p.id} className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h4 className="font-semibold text-white truncate">{p.title}</h4>
                  {p.isFeatured && (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-900/40 text-amber-400">
                      <Star className="w-3 h-3" /> Featured
                    </span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${p.isPublished ? 'bg-green-900/40 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                    {p.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-1">{p.category} · /blog/{p.slug}</p>
                <p className="text-sm text-gray-400 line-clamp-2">{p.excerpt}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {p.isPublished && (
                  <Link href={`/blog/${p.slug}`} target="_blank" className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700" title="View on site">
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                )}
                <button type="button" onClick={() => togglePublish(p)} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700" title={p.isPublished ? 'Unpublish' : 'Publish'}>
                  {p.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button type="button" onClick={() => openEdit(p)} className="p-2 text-blue-400 hover:bg-gray-700 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                <button type="button" onClick={() => del(p.id)} className="p-2 text-red-400 hover:bg-gray-700 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
      </>
      )}
    </div>
  );
}
