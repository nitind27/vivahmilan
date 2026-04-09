'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, Trash2, Star, Plus, Loader2, FileText, CheckCircle, Clock, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const DOC_TYPES = ['Aadhaar Card', 'PAN Card', 'Voter ID Card', 'Passport', 'Driving License'];

// ── Profile Photo Upload ──────────────────────────────────────────────────────
export function PhotoUploadSection({ userId }) {
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    fetch('/api/profile').then(r => r.json()).then(data => {
      const all = data.image ? [{ id: 'main', url: data.image, isMain: true }, ...(data.photos || [])] : (data.photos || []);
      setPhotos(all);
    });
  }, []);

  const compressImage = (file, maxW = 800, quality = 0.82) =>
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

  const upload = async (file, isMain = false) => {
    if (!file.type.startsWith('image/')) { toast.error('Only images allowed'); return; }
    setUploading(true);
    try {
      const compressed = await compressImage(file);
      const fd = new FormData();
      fd.append('photo', compressed, 'photo.jpg');
      fd.append('isMain', String(isMain));
      const res = await fetch('/api/upload/photo', { method: 'POST', body: fd });
      if (!res.ok) { const d = await res.json(); toast.error(d.error); return; }
      const photo = await res.json();
      if (isMain) {
        setPhotos(prev => [{ ...photo, isMain: true }, ...prev.filter(p => !p.isMain)]);
      } else {
        setPhotos(prev => [...prev, photo]);
      }
      toast.success(isMain ? 'Profile photo updated!' : 'Photo added!');
    } finally { setUploading(false); }
  };

  const deletePhoto = async (photoId) => {
    if (photoId === 'main') { toast.error("Can't delete main photo directly"); return; }
    await fetch('/api/upload/photo', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ photoId }) });
    setPhotos(prev => prev.filter(p => p.id !== photoId));
    toast.success('Photo removed');
  };

  const mainPhoto = photos.find(p => p.isMain);
  const otherPhotos = photos.filter(p => !p.isMain);

  return (
    <div className="space-y-6">
      {/* Main profile photo */}
      <div>
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Profile Photo</p>
        <div className="flex items-center gap-5">
          <div className="relative w-28 h-28 rounded-3xl overflow-hidden bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/20 dark:to-purple-900/20 flex-shrink-0">
            {mainPhoto?.url ? (
              <img src={mainPhoto.url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Camera className="w-10 h-10 text-gray-300" />
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-medium mb-1">Main Profile Photo</p>
            <p className="text-xs text-gray-400 mb-3">This photo appears on your profile card. Max 8MB.</p>
            <label className="cursor-pointer gradient-bg text-white text-xs px-4 py-2 rounded-xl hover:opacity-90 transition-opacity flex items-center gap-1.5 w-fit">
              <Upload className="w-3.5 h-3.5" /> Upload Photo
              <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && upload(e.target.files[0], true)} />
            </label>
          </div>
        </div>
      </div>

      {/* Additional photos */}
      <div>
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Additional Photos (up to 6)</p>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {otherPhotos.map(photo => (
            <motion.div key={photo.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-700 group">
              <img src={photo.url} alt="" className="w-full h-full object-cover" />
              <button onClick={() => deletePhoto(photo.id)}
                className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 className="w-3 h-3" />
              </button>
            </motion.div>
          ))}
          {otherPhotos.length < 6 && (
            <label className="aspect-square rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:border-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/10 transition-all">
              {uploading ? <Loader2 className="w-6 h-6 text-pink-400 animate-spin" /> : <Plus className="w-6 h-6 text-gray-400" />}
              <span className="text-xs text-gray-400 mt-1">Add</span>
              <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && upload(e.target.files[0], false)} />
            </label>
          )}
        </div>
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
    fetch('/api/upload/document').then(r => r.json()).then(setDocs);
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
      if (!res.ok) { toast.error(data.error); return; }
      setDocs(prev => [data, ...prev.filter(d => d.type !== selectedType)]);
      toast.success(`${selectedType} uploaded! Pending admin review.`);
    } finally { setUploading(false); }
  };

  const statusIcon = (status) => {
    if (status === 'APPROVED') return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (status === 'REJECTED') return <XCircle className="w-4 h-4 text-red-500" />;
    return <Clock className="w-4 h-4 text-yellow-500" />;
  };

  const statusColor = (status) => {
    if (status === 'APPROVED') return 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800';
    if (status === 'REJECTED') return 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800';
    return 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
  };

  return (
    <div className="space-y-5">
      <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-200 dark:border-blue-800">
        <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-1">📋 ID Verification Required</p>
        <p className="text-xs text-blue-600 dark:text-blue-500">Upload one government-issued ID to get a verified badge on your profile. Admin will review within 24-48 hours.</p>
      </div>

      {/* Select document type */}
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

      {/* Upload area */}
      <label className="block cursor-pointer">
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-8 text-center hover:border-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/10 transition-all">
          {uploading ? (
            <Loader2 className="w-8 h-8 text-pink-400 animate-spin mx-auto mb-2" />
          ) : (
            <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          )}
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {uploading ? 'Uploading…' : `Upload ${selectedType}`}
          </p>
          <p className="text-xs text-gray-400 mt-1">JPG, PNG, PDF — Max 5MB</p>
        </div>
        <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => e.target.files?.[0] && upload(e.target.files[0])} disabled={uploading} />
      </label>

      {/* Uploaded documents */}
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
              <span className="text-xs font-semibold capitalize">{doc.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
