'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import toast from 'react-hot-toast';
import { Heart, Send, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { SiteLoaderInline } from '@/components/SiteLoader';

const STATUS_UI = {
  PENDING: { icon: Clock, label: 'Under Review', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  APPROVED: { icon: CheckCircle2, label: 'Published', color: 'text-green-600 bg-green-50 border-green-200' },
  REJECTED: { icon: XCircle, label: 'Not Published', color: 'text-red-600 bg-red-50 border-red-200' },
};

export default function ShareStoryPage() {
  const { status } = useSession();
  const router = useRouter();
  const [existing, setExisting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState('');
  const [form, setForm] = useState({
    coupleName: '',
    location: '',
    story: '',
    imageUrl: '',
    weddingDate: '',
    metOnPlatform: true,
  });

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login?callbackUrl=/share-story');
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/success-stories')
      .then(r => r.json())
      .then(d => setExisting(d.submission))
      .finally(() => setLoading(false));
  }, [status]);

  const uploadPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append('photo', file);
      const res = await fetch('/api/upload/story-photo', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Upload failed'); return; }
      setForm(p => ({ ...p, imageUrl: data.url }));
      setPhotoPreview(data.url);
      toast.success('Photo uploaded');
    } finally { setUploadingPhoto(false); }
  };

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/success-stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed'); return; }
      toast.success('Story submitted! We will review it soon.');
      setExisting({ ...form, status: 'PENDING', createdAt: new Date().toISOString() });
    } finally { setSubmitting(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-vd-bg">
        <Navbar />
        <SiteLoaderInline message="Loading…" className="pt-32" />
      </div>
    );
  }

  const inp = 'w-full px-4 py-3 border border-vd-border rounded-2xl bg-vd-bg-section text-sm focus:outline-none focus:border-vd-primary';

  return (
    <div className="min-h-screen bg-vd-bg">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 pt-24 pb-12">
        <div className="text-center mb-8">
          <div className="w-14 h-14 vd-gradient-gold rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Heart className="w-7 h-7 text-white fill-white" />
          </div>
          <h1 className="text-2xl font-bold text-vd-text-heading">Share Your Success Story</h1>
          <p className="text-sm text-vd-text-light mt-2">Found your life partner through us? Inspire others with your journey.</p>
        </div>

        {existing && (
          <div className={`rounded-2xl border p-4 mb-6 flex items-start gap-3 ${STATUS_UI[existing.status]?.color || STATUS_UI.PENDING.color}`}>
            {(() => {
              const S = STATUS_UI[existing.status] || STATUS_UI.PENDING;
              return <S.icon className="w-5 h-5 shrink-0 mt-0.5" />;
            })()}
            <div>
              <p className="font-semibold text-sm">{STATUS_UI[existing.status]?.label || 'Submitted'}</p>
              <p className="text-xs mt-1 opacity-80">
                {existing.status === 'PENDING' && 'Our team is reviewing your story. It may appear on the homepage once approved.'}
                {existing.status === 'APPROVED' && 'Congratulations! Your story is live on the homepage.'}
                {existing.status === 'REJECTED' && (existing.adminNote || 'Please contact support if you would like to resubmit.')}
              </p>
              {existing.status === 'APPROVED' && (
                <Link href="/stories" className="text-xs underline mt-2 inline-block">View all stories</Link>
              )}
            </div>
          </div>
        )}

        {existing?.status === 'PENDING' ? null : existing?.status === 'APPROVED' ? null : (
          <form onSubmit={submit} className="bg-vd-bg-section rounded-3xl border border-vd-border p-6 space-y-4 shadow-sm">
            <div>
              <label className="text-xs font-semibold text-vd-text-light uppercase mb-1.5 block">Couple Names *</label>
              <input required value={form.coupleName} onChange={e => setForm(p => ({ ...p, coupleName: e.target.value }))}
                placeholder="e.g. Priya & Arjun" className={inp} maxLength={120} />
            </div>
            <div>
              <label className="text-xs font-semibold text-vd-text-light uppercase mb-1.5 block">Location</label>
              <input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                placeholder="e.g. Mumbai, India" className={inp} />
            </div>
            <div>
              <label className="text-xs font-semibold text-vd-text-light uppercase mb-1.5 block">Your Story *</label>
              <textarea required value={form.story} onChange={e => setForm(p => ({ ...p, story: e.target.value }))}
                rows={6} placeholder="How did you meet? What made you choose each other?" className={inp + ' resize-none'} maxLength={2000} />
              <p className="text-xs text-vd-text-light mt-1 text-right">{form.story.length}/2000</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-vd-text-light uppercase mb-1.5 block">Wedding Date</label>
                <input type="date" value={form.weddingDate} onChange={e => setForm(p => ({ ...p, weddingDate: e.target.value }))} className={inp} />
              </div>
              <div>
                <label className="text-xs font-semibold text-vd-text-light uppercase mb-1.5 block">Couple Photo</label>
                <div className="flex items-center gap-3">
                  {photoPreview && (
                    <img src={photoPreview} alt="" className="w-16 h-16 rounded-xl object-cover border border-vd-border" />
                  )}
                  <label className="flex-1 cursor-pointer">
                    <input type="file" accept="image/*" onChange={uploadPhoto} className="hidden" />
                    <span className="inline-block px-4 py-2.5 border border-dashed border-vd-border rounded-xl text-sm text-vd-text-sub hover:border-vd-primary">
                      {uploadingPhoto ? 'Uploading…' : photoPreview ? 'Change photo' : 'Upload photo'}
                    </span>
                  </label>
                </div>
                <input value={form.imageUrl} onChange={e => setForm(p => ({ ...p, imageUrl: e.target.value }))}
                  placeholder="Or paste image URL" className={inp + ' mt-2'} />
              </div>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.metOnPlatform} onChange={e => setForm(p => ({ ...p, metOnPlatform: e.target.checked }))}
                className="w-4 h-4 accent-vd-primary rounded" />
              <span className="text-sm text-vd-text-heading">We found each other on this platform</span>
            </label>
            <button type="submit" disabled={submitting}
              className="w-full vd-gradient-gold text-white py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60">
              <Send className="w-4 h-4" /> {submitting ? 'Submitting…' : 'Submit Story'}
            </button>
          </form>
        )}

        <p className="text-center text-xs text-vd-text-light mt-6">
          Stories are reviewed by our team before appearing on the homepage. <Link href="/stories" className="text-vd-primary underline">Browse stories</Link>
        </p>
      </div>
    </div>
  );
}
