'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, Upload, Trash2, Plus, Loader2, FileText, CheckCircle, Clock, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const DOC_TYPES = ['Aadhaar Card', 'PAN Card', 'Voter ID Card', 'Passport', 'Driving License'];
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || '';

// Resolve image src — blob URLs pass through, local uploads get absolute URL
function imgSrc(url) {
  if (!url) return '';
  // blob: or data: — use directly (preview)
  if (url.startsWith('blob:') || url.startsWith('data:')) return url;
  // Already absolute
  if (url.startsWith('http')) return url;
  // Local upload — prepend APP_URL for live, or use relative for localhost
  return `${APP_URL}${url}`;
}

// ── Profile Photo Upload ──────────────────────────────────────────────────────
export function PhotoUploadSection() {
  const [photos, setPhotos] = useState([]);
  const [mainUploading, setMainUploading] = useState(false);

  useEffect(() => {
    fetch('/api/profile').then(r => r.json()).then(data => {
      setPhotos(data.photos || []);
    });
  }, []);

  const compressImage = (file, maxW = 1200, quality = 0.85) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = e => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width: w, height: h } = img;
          if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          canvas.toBlob(blob => resolve(blob), 'image/jpeg', quality);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });

  const uploadOne = async (file, isMain = false, previewUrl = null) => {
    if (!file.type.startsWith('image/')) { toast.error('Only images allowed — no videos'); return null; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Max 10MB per image'); return null; }
    const compressed = await compressImage(file);
    const fd = new FormData();
    fd.append('photo', compressed, 'photo.jpg');
    fd.append('isMain', String(isMain));
    const res = await fetch('/api/upload/photo', { method: 'POST', body: fd });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      toast.error(d.error || 'Upload failed');
      return null;
    }
    return await res.json();
  };

  // Upload main profile photo — show blob preview immediately
  const uploadMain = async (file) => {
    const blobUrl = URL.createObjectURL(file);
    // Show preview immediately
    setPhotos(prev => {
      const others = prev.filter(p => !p.isMain);
      return [{ id: 'main_preview', url: blobUrl, isMain: true, _preview: true }, ...others];
    });
    setMainUploading(true);
    try {
      const photo = await uploadOne(file, true);
      if (photo) {
        setPhotos(prev => [{ ...photo, isMain: true }, ...prev.filter(p => !p.isMain && !p._preview)]);
        toast.success('Profile photo updated!');
      } else {
        // Revert preview on failure
        setPhotos(prev => prev.filter(p => !p._preview));
      }
    } finally {
      setMainUploading(false);
      URL.revokeObjectURL(blobUrl);
    }
  };

  // Upload multiple additional photos — show blob previews immediately
  const uploadMultiple = async (files) => {
    const fileArr = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (fileArr.length === 0) { toast.error('Only image files allowed — no videos'); return; }

    const otherPhotos = photos.filter(p => !p.isMain && !p._loading);
    const slotsLeft = 6 - otherPhotos.length;
    if (slotsLeft <= 0) { toast.error('Maximum 6 additional photos reached'); return; }

    const toUpload = fileArr.slice(0, slotsLeft);
    if (fileArr.length > slotsLeft) toast(`Only ${slotsLeft} slot(s) left`);

    // Add blob preview placeholders immediately
    const previews = toUpload.map((file, i) => ({
      id: `temp_${Date.now()}_${i}`,
      url: URL.createObjectURL(file),
      isMain: false,
      _loading: true,
    }));
    setPhotos(prev => [...prev, ...previews]);

    // Upload all in parallel
    const results = await Promise.all(toUpload.map(f => uploadOne(f, false)));

    // Replace previews with real data
    setPhotos(prev => {
      const withoutPreviews = prev.filter(p => !p._loading);
      const uploaded = results.filter(Boolean);
      return [...withoutPreviews, ...uploaded];
    });

    // Revoke blob URLs
    previews.forEach(p => URL.revokeObjectURL(p.url));

    const success = results.filter(Boolean).length;
    if (success > 0) toast.success(`${success} photo${success > 1 ? 's' : ''} uploaded!`);
    else toast.error('Upload failed. Try again.');
  };

  const deletePhoto = async (photoId) => {
    // Optimistic remove
    setPhotos(prev => prev.filter(p => p.id !== photoId));
    const res = await fetch('/api/upload/photo', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photoId }),
    });
    if (!res.ok) {
      toast.error('Delete failed');
      // Reload photos on failure
      fetch('/api/profile').then(r => r.json()).then(data => setPhotos(data.photos || []));
    } else {
      toast.success('Photo removed');
    }
  };

  const mainPhoto = photos.find(p => p.isMain);
  const otherPhotos = photos.filter(p => !p.isMain);
  const slotsLeft = 6 - otherPhotos.filter(p => !p._loading).length;

  return (
    <div className="space-y-6">
      {/* Main profile photo */}
      <div>
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Profile Photo</p>
        <div className="flex items-center gap-5">
          <div className="relative w-28 h-28 rounded-3xl overflow-hidden bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/20 dark:to-purple-900/20 flex-shrink-0">
            {mainPhoto?.url ? (
              <img src={imgSrc(mainPhoto.url)} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Camera className="w-10 h-10 text-gray-300" />
              </div>
            )}
            {mainUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-medium mb-1">Main Profile Photo</p>
            <p className="text-xs text-gray-400 mb-3">Appears on your profile card. Images only, max 10MB.</p>
            <label className="cursor-pointer gradient-bg text-white text-xs px-4 py-2 rounded-xl hover:opacity-90 transition-opacity flex items-center gap-1.5 w-fit">
              <Upload className="w-3.5 h-3.5" />
              {mainUploading ? 'Uploading…' : 'Upload Photo'}
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden"
                disabled={mainUploading}
                onChange={e => e.target.files?.[0] && uploadMain(e.target.files[0])} />
            </label>
          </div>
        </div>
      </div>

      {/* Additional photos */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Additional Photos ({otherPhotos.filter(p => !p._loading).length}/6)
          </p>
          {slotsLeft > 0 && (
            <label className="cursor-pointer text-xs text-pink-500 hover:text-pink-600 font-medium flex items-center gap-1 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add up to {slotsLeft} more
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple className="hidden"
                onChange={e => e.target.files?.length && uploadMultiple(e.target.files)} />
            </label>
          )}
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {otherPhotos.map(photo => (
            <motion.div key={photo.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-700 group">
              {/* Always show image — blob URL for loading, real URL after upload */}
              <img
                src={imgSrc(photo.url)}
                alt=""
                className={`w-full h-full object-cover transition-all ${photo._loading ? 'blur-sm scale-105' : ''}`}
              />
              {photo._loading && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                </div>
              )}
              {!photo._loading && (
                <button onClick={() => deletePhoto(photo.id)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </motion.div>
          ))}

          {/* Add more slot */}
          {slotsLeft > 0 && (
            <label className="aspect-square rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:border-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/10 transition-all">
              <Plus className="w-6 h-6 text-gray-400" />
              <span className="text-xs text-gray-400 mt-1">Add</span>
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple className="hidden"
                onChange={e => e.target.files?.length && uploadMultiple(e.target.files)} />
            </label>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-2">Select multiple images at once. Images only — no videos.</p>
      </div>
    </div>
  );
}

// ── Document Upload ───────────────────────────────────────────────────────────
export function DocumentUploadSection() {
  const [docs, setDocs] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState('Aadhaar Card');

  useEffect(() => {
    fetch('/api/upload/document').then(r => r.json()).then(d => setDocs(Array.isArray(d) ? d : []));
  }, []);

  const upload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('document', file);
      fd.append('type', selectedType);
      const res = await fetch('/api/upload/document', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Upload failed'); return; }
      setDocs(prev => [data, ...prev.filter(d => d.type !== selectedType)]);
      toast.success(`${selectedType} uploaded! Pending admin review.`);
    } finally { setUploading(false); }
  };

  const statusIcon = (s) => {
    if (s === 'APPROVED') return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (s === 'REJECTED') return <XCircle className="w-4 h-4 text-red-500" />;
    return <Clock className="w-4 h-4 text-yellow-500" />;
  };

  const statusColor = (s) => {
    if (s === 'APPROVED') return 'bg-green-50 dark:bg-green-900/20 text-green-600 border-green-200 dark:border-green-800';
    if (s === 'REJECTED') return 'bg-red-50 dark:bg-red-900/20 text-red-600 border-red-200 dark:border-red-800';
    return 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 border-yellow-200 dark:border-yellow-800';
  };

  return (
    <div className="space-y-5">
      <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-200 dark:border-blue-800">
        <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-1">📋 ID Verification Required</p>
        <p className="text-xs text-blue-600 dark:text-blue-500">Upload one government-issued ID to get a verified badge. Admin will review within 24-48 hours.</p>
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Select Document Type</p>
        <div className="flex flex-wrap gap-2">
          {DOC_TYPES.map(t => (
            <button key={t} onClick={() => setSelectedType(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border-2 transition-all ${selectedType === t ? 'gradient-bg text-white border-transparent' : 'border-gray-200 dark:border-gray-600 hover:border-pink-300'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <label className="block cursor-pointer">
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-8 text-center hover:border-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/10 transition-all">
          {uploading
            ? <Loader2 className="w-8 h-8 text-pink-400 animate-spin mx-auto mb-2" />
            : <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />}
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {uploading ? 'Uploading…' : `Upload ${selectedType}`}
          </p>
          <p className="text-xs text-gray-400 mt-1">JPG, PNG, PDF — Max 5MB</p>
        </div>
        <input type="file" accept="image/*,.pdf" className="hidden"
          onChange={e => e.target.files?.[0] && upload(e.target.files[0])} disabled={uploading} />
      </label>

      {docs.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Uploaded Documents</p>
          {docs.map(doc => (
            <div key={doc.id} className={`flex items-center gap-3 p-3 rounded-xl border ${statusColor(doc.status)}`}>
              {statusIcon(doc.status)}
              <div className="flex-1">
                <p className="text-sm font-medium">{doc.type}</p>
                {doc.adminNote && <p className="text-xs mt-0.5 opacity-70">{doc.adminNote}</p>}
              </div>
              <span className="text-xs font-semibold capitalize">{doc.status?.toLowerCase()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
