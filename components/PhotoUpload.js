'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, Trash2, Plus, Loader2, FileText, CheckCircle, Clock, XCircle, X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import toast from 'react-hot-toast';

const DOC_TYPES = ['Aadhaar Card', 'PAN Card', 'Voter ID Card', 'Passport', 'Driving License'];
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || '';

function imgSrc(url) {
  if (!url) return '';
  if (url.startsWith('blob:') || url.startsWith('data:') || url.startsWith('http')) return url;
  return `${APP_URL}${url}`;
}

// ── Lightbox ──────────────────────────────────────────────────────────────────
function Lightbox({ images, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setIdx(i => (i + 1) % images.length);
      if (e.key === 'ArrowLeft') setIdx(i => (i - 1 + images.length) % images.length);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [images.length, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[999] bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      <button onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10">
        <X className="w-5 h-5" />
      </button>

      {images.length > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm px-3 py-1 rounded-full z-10">
          {idx + 1} / {images.length}
        </div>
      )}

      {images.length > 1 && (
        <button onClick={e => { e.stopPropagation(); setIdx(i => (i - 1 + images.length) % images.length); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10">
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      <motion.img
        key={idx}
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        src={imgSrc(images[idx])}
        alt=""
        className="max-h-[85vh] max-w-[85vw] object-contain rounded-xl shadow-2xl"
        onClick={e => e.stopPropagation()}
      />

      {images.length > 1 && (
        <button onClick={e => { e.stopPropagation(); setIdx(i => (i + 1) % images.length); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10">
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {images.map((url, i) => (
            <button key={i} onClick={e => { e.stopPropagation(); setIdx(i); }}
              className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${i === idx ? 'border-white scale-110' : 'border-white/30 opacity-60 hover:opacity-100'}`}>
              <img src={imgSrc(url)} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ── Profile Photo Upload ──────────────────────────────────────────────────────
export function PhotoUploadSection() {
  const [photos, setPhotos] = useState([]);
  const [mainUploading, setMainUploading] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    fetch('/api/profile').then(r => r.json()).then(data => setPhotos(data.photos || []));
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

  const uploadOne = async (file, isMain = false) => {
    if (!file.type.startsWith('image/')) { toast.error('Only images allowed — no videos'); return null; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Max 10MB per image'); return null; }
    const compressed = await compressImage(file);
    const fd = new FormData();
    fd.append('photo', compressed, 'photo.jpg');
    fd.append('isMain', String(isMain));
    const res = await fetch('/api/upload/photo', { method: 'POST', body: fd });
    if (!res.ok) { const d = await res.json().catch(() => ({})); toast.error(d.error || 'Upload failed'); return null; }
    return await res.json();
  };

  const uploadMain = async (file) => {
    const blobUrl = URL.createObjectURL(file);
    setPhotos(prev => [{ id: 'main_preview', url: blobUrl, isMain: true, _preview: true }, ...prev.filter(p => !p.isMain)]);
    setMainUploading(true);
    try {
      const photo = await uploadOne(file, true);
      if (photo) {
        setPhotos(prev => [{ ...photo, isMain: true }, ...prev.filter(p => !p.isMain && !p._preview)]);
        toast.success('Profile photo updated!');
      } else {
        setPhotos(prev => prev.filter(p => !p._preview));
      }
    } finally { setMainUploading(false); URL.revokeObjectURL(blobUrl); }
  };

  const uploadMultiple = async (files) => {
    const fileArr = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (fileArr.length === 0) { toast.error('Only image files allowed — no videos'); return; }
    const otherPhotos = photos.filter(p => !p.isMain && !p._loading);
    const slotsLeft = 6 - otherPhotos.length;
    if (slotsLeft <= 0) { toast.error('Maximum 6 additional photos reached'); return; }
    const toUpload = fileArr.slice(0, slotsLeft);
    if (fileArr.length > slotsLeft) toast(`Only ${slotsLeft} slot(s) left`);

    const previews = toUpload.map((f, i) => ({
      id: `temp_${Date.now()}_${i}`,
      url: URL.createObjectURL(f),
      isMain: false, _loading: true,
    }));
    setPhotos(prev => [...prev, ...previews]);

    const results = await Promise.all(toUpload.map(f => uploadOne(f, false)));
    setPhotos(prev => [...prev.filter(p => !p._loading), ...results.filter(Boolean)]);
    previews.forEach(p => URL.revokeObjectURL(p.url));

    const success = results.filter(Boolean).length;
    if (success > 0) toast.success(`${success} photo${success > 1 ? 's' : ''} uploaded!`);
    else toast.error('Upload failed. Try again.');
  };

  const deletePhoto = async (e, photoId) => {
    e.stopPropagation();
    setPhotos(prev => prev.filter(p => p.id !== photoId));
    const res = await fetch('/api/upload/photo', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photoId }),
    });
    if (!res.ok) {
      toast.error('Delete failed');
      fetch('/api/profile').then(r => r.json()).then(data => setPhotos(data.photos || []));
    } else toast.success('Photo removed');
  };

  const mainPhoto = photos.find(p => p.isMain);
  const otherPhotos = photos.filter(p => !p.isMain);
  const slotsLeft = 6 - otherPhotos.filter(p => !p._loading).length;
  const allUrls = [mainPhoto, ...otherPhotos].filter(p => p?.url && !p._loading && !p._preview).map(p => p.url);

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {lightbox && <Lightbox images={lightbox.images} startIndex={lightbox.index} onClose={() => setLightbox(null)} />}
      </AnimatePresence>

      {/* Main profile photo */}
      <div>
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Profile Photo</p>
        <div className="flex items-center gap-5">
          <div
            className="relative w-28 h-28 rounded-3xl overflow-hidden bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/20 dark:to-purple-900/20 flex-shrink-0 cursor-pointer group"
            onClick={() => mainPhoto?.url && !mainPhoto._preview && allUrls.length > 0 && setLightbox({ images: allUrls, index: 0 })}
          >
            {mainPhoto?.url ? (
              <>
                <img src={imgSrc(mainPhoto.url)} alt="Profile" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                {!mainPhoto._preview && (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                    <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                )}
              </>
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
          {otherPhotos.map((photo) => {
            const urlIndex = allUrls.indexOf(photo.url);
            return (
              <motion.div key={photo.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-700 group cursor-pointer"
                onClick={() => !photo._loading && urlIndex >= 0 && setLightbox({ images: allUrls, index: urlIndex })}>
                <img
                  src={imgSrc(photo.url)}
                  alt=""
                  className={`w-full h-full object-cover transition-all ${photo._loading ? 'blur-sm scale-105' : 'group-hover:scale-105'}`}
                />
                {photo._loading ? (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  </div>
                ) : (
                  <>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                      <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <button onClick={e => deletePhoto(e, photo.id)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </>
                )}
              </motion.div>
            );
          })}

          {slotsLeft > 0 && (
            <label className="aspect-square rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:border-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/10 transition-all">
              <Plus className="w-6 h-6 text-gray-400" />
              <span className="text-xs text-gray-400 mt-1">Add</span>
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple className="hidden"
                onChange={e => e.target.files?.length && uploadMultiple(e.target.files)} />
            </label>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-2">Click any photo to view fullscreen. Select multiple to upload at once.</p>
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
          {uploading ? <Loader2 className="w-8 h-8 text-pink-400 animate-spin mx-auto mb-2" /> : <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />}
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{uploading ? 'Uploading…' : `Upload ${selectedType}`}</p>
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