'use client';
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || '';

export function resolveImageUrl(url) {
  if (!url) return '';
  if (url.startsWith('blob:') || url.startsWith('data:') || url.startsWith('http')) return url;
  return `${APP_URL}${url}`;
}

/**
 * Full-screen image preview. `images` = string URLs or { url, label? }[]
 */
export default function ImageLightbox({ images = [], startIndex = 0, onClose, title }) {
  const normalized = images.map((item) =>
    typeof item === 'string' ? { url: item, label: null } : { url: item.url, label: item.label ?? null }
  ).filter((i) => i.url);

  const [idx, setIdx] = useState(() => Math.min(Math.max(0, startIndex), Math.max(0, normalized.length - 1)));

  const go = useCallback((delta) => {
    setIdx((i) => (i + delta + normalized.length) % normalized.length);
  }, [normalized.length]);

  useEffect(() => {
    setIdx(Math.min(Math.max(0, startIndex), Math.max(0, normalized.length - 1)));
  }, [startIndex, normalized.length]);

  useEffect(() => {
    if (!normalized.length) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [normalized.length, onClose, go]);

  if (!normalized.length) return null;

  const current = normalized[idx];

  return (
    <AnimatePresence>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Image preview"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex flex-col bg-black/95"
        onClick={onClose}
      >
        {/* Top bar */}
        <div
          className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 shrink-0 border-b border-white/10"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="min-w-0">
            {title && <p className="text-white/90 text-sm font-semibold truncate">{title}</p>}
            {normalized.length > 1 && (
              <p className="text-white/50 text-xs mt-0.5">
                {idx + 1} of {normalized.length}
                {current.label ? ` · ${current.label}` : ''}
              </p>
            )}
            {normalized.length === 1 && current.label && (
              <p className="text-white/50 text-xs mt-0.5">{current.label}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors shrink-0"
            aria-label="Close preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main image area */}
        <div className="relative flex-1 flex items-center justify-center min-h-0 px-4 sm:px-16 py-4" onClick={(e) => e.stopPropagation()}>
          {normalized.length > 1 && (
            <button
              type="button"
              onClick={() => go(-1)}
              className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors z-10"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          <motion.img
            key={`${idx}-${current.url}`}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            src={resolveImageUrl(current.url)}
            alt={current.label || 'Preview'}
            className="max-h-[calc(100vh-11rem)] max-w-[min(96vw,1100px)] w-auto h-auto object-contain rounded-lg shadow-2xl select-none"
            draggable={false}
          />

          {normalized.length > 1 && (
            <button
              type="button"
              onClick={() => go(1)}
              className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors z-10"
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Thumbnails */}
        {normalized.length > 1 && (
          <div
            className="shrink-0 px-4 sm:px-6 py-4 border-t border-white/10 overflow-x-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex gap-2 justify-center min-w-min mx-auto">
              {normalized.map((item, i) => (
                <button
                  key={`${item.url}-${i}`}
                  type="button"
                  onClick={() => setIdx(i)}
                  className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                    i === idx ? 'border-pink-400 ring-2 ring-pink-400/40 scale-105' : 'border-white/20 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={resolveImageUrl(item.url)} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

/** Clickable photo tile with zoom hint */
export function PhotoPreviewButton({ url, onClick, badge, className = '', imgClassName = 'object-cover' }) {
  if (!url) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative overflow-hidden rounded-xl border border-gray-200 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-400 ${className}`}
    >
      <img src={resolveImageUrl(url)} alt="" className={`w-full h-full ${imgClassName} transition-transform duration-300 group-hover:scale-105`} />
      <span className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
        <span className="opacity-0 group-hover:opacity-100 transition-opacity w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
          <ZoomIn className="w-4 h-4 text-gray-800" />
        </span>
      </span>
      {badge && (
        <span className="absolute top-1.5 left-1.5 text-[10px] font-semibold bg-pink-500 text-white px-2 py-0.5 rounded-full z-[1]">
          {badge}
        </span>
      )}
    </button>
  );
}
