'use client';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Video, Upload, Trash2, Loader2 } from 'lucide-react';

export default function IntroVideoSection({ initialUrl }) {
  const [url, setUrl] = useState(initialUrl || null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setUrl(initialUrl || null);
  }, [initialUrl]);

  const upload = async (file) => {
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      toast.error('Max video size is 50MB');
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('video', file);
      const res = await fetch('/api/upload/intro-video', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setUrl(data.url);
      toast.success('Intro video uploaded');
    } catch (e) {
      toast.error(e.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = async () => {
    if (!confirm('Remove intro video?')) return;
    setUploading(true);
    try {
      const res = await fetch('/api/upload/intro-video', { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      setUrl(null);
      toast.success('Video removed');
    } catch {
      toast.error('Could not remove video');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="border-t border-vd-border pt-6">
      <h3 className="font-semibold text-sm mb-2 flex items-center gap-2 text-vd-text-heading">
        <Video className="w-4 h-4 text-vd-primary" /> Intro Video (optional)
      </h3>
      <p className="text-xs text-vd-text-light mb-3">Short 30–60 sec introduction. MP4/WebM, max 50MB.</p>

      {url ? (
        <div className="space-y-3">
          <video src={url} controls className="w-full max-w-md rounded-xl border border-vd-border bg-black" />
          <button type="button" onClick={remove} disabled={uploading}
            className="flex items-center gap-2 text-xs text-red-500 hover:text-red-600 disabled:opacity-50">
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            Remove video
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-vd-border rounded-2xl p-8 cursor-pointer hover:border-vd-primary/50 transition-colors">
          <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
          {uploading ? (
            <Loader2 className="w-8 h-8 text-vd-primary animate-spin" />
          ) : (
            <>
              <Upload className="w-8 h-8 text-vd-text-light" />
              <span className="text-sm text-vd-text-sub">Click to upload intro video</span>
            </>
          )}
        </label>
      )}
    </div>
  );
}
