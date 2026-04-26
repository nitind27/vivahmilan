'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Camera, RotateCcw, RotateCw, ZoomIn, ZoomOut, FlipHorizontal, Check, ChevronLeft, ChevronRight, Sun, Contrast, Droplets } from 'lucide-react';

const FILTERS = [
  { id: 'none',       label: 'Original',  css: 'none' },
  { id: 'warm',       label: 'Warm',      css: 'sepia(0.3) saturate(1.4) brightness(1.05)' },
  { id: 'cool',       label: 'Cool',      css: 'hue-rotate(20deg) saturate(1.2) brightness(1.02)' },
  { id: 'vivid',      label: 'Vivid',     css: 'saturate(1.8) contrast(1.1)' },
  { id: 'fade',       label: 'Fade',      css: 'brightness(1.1) saturate(0.7) contrast(0.9)' },
  { id: 'bw',         label: 'B&W',       css: 'grayscale(1)' },
  { id: 'dramatic',   label: 'Dramatic',  css: 'contrast(1.4) brightness(0.9) saturate(1.2)' },
  { id: 'vintage',    label: 'Vintage',   css: 'sepia(0.5) contrast(1.1) brightness(0.95) saturate(0.8)' },
  { id: 'soft',       label: 'Soft',      css: 'brightness(1.08) contrast(0.9) saturate(0.9) blur(0.3px)' },
  { id: 'golden',     label: 'Golden',    css: 'sepia(0.4) saturate(1.6) brightness(1.1) hue-rotate(-10deg)' },
];

function applyFilterToCanvas(canvas, img, filter, rotation, flipH, brightness, contrast, saturation) {
  const ctx = canvas.getContext('2d');
  const rad = (rotation * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  canvas.width  = Math.round(w * cos + h * sin);
  canvas.height = Math.round(w * sin + h * cos);

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(rad);
  if (flipH) ctx.scale(-1, 1);

  // Build filter string
  const f = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
  ctx.filter = f;
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.restore();

  // Apply CSS filter via offscreen canvas trick for complex filters
  const filterObj = FILTERS.find(fi => fi.id === filter);
  if (filterObj && filterObj.css !== 'none') {
    // Re-draw with CSS filter using a second pass
    const tmp = document.createElement('canvas');
    tmp.width = canvas.width; tmp.height = canvas.height;
    const tc = tmp.getContext('2d');
    tc.filter = filterObj.css;
    tc.drawImage(canvas, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(tmp, 0, 0);
  }
}

export default function ImageEditorModal({ onSend, onClose }) {
  const [phase, setPhase] = useState('pick'); // pick | camera | edit
  const [rawImage, setRawImage] = useState(null); // data URL
  const [filter, setFilter] = useState('none');
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [activeAdj, setActiveAdj] = useState(null); // 'brightness'|'contrast'|'saturation'
  const [cameraFacing, setCameraFacing] = useState('user');
  const [cameraStream, setCameraStream] = useState(null);
  const [sending, setSending] = useState(false);

  const fileRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const previewRef = useRef(null);
  const imgRef = useRef(null);

  // Start camera
  const startCamera = useCallback(async (facing = 'user') => {
    if (cameraStream) cameraStream.getTracks().forEach(t => t.stop());
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      setCameraStream(stream);
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch { alert('Camera access denied'); setPhase('pick'); }
  }, [cameraStream]);

  useEffect(() => {
    if (phase === 'camera') startCamera(cameraFacing);
    return () => { if (phase !== 'camera' && cameraStream) cameraStream.getTracks().forEach(t => t.stop()); };
  }, [phase]);

  const stopCamera = () => { cameraStream?.getTracks().forEach(t => t.stop()); setCameraStream(null); };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const c = document.createElement('canvas');
    c.width = video.videoWidth; c.height = video.videoHeight;
    const ctx = c.getContext('2d');
    if (cameraFacing === 'user') { ctx.translate(c.width, 0); ctx.scale(-1, 1); }
    ctx.drawImage(video, 0, 0);
    stopCamera();
    setRawImage(c.toDataURL('image/jpeg', 0.92));
    setPhase('edit');
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { setRawImage(ev.target.result); setPhase('edit'); };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Render preview whenever params change
  useEffect(() => {
    if (phase !== 'edit' || !rawImage || !previewRef.current) return;
    const img = new window.Image();
    img.onload = () => {
      imgRef.current = img;
      applyFilterToCanvas(previewRef.current, img, filter, rotation, flipH, brightness, contrast, saturation);
    };
    img.src = rawImage;
  }, [phase, rawImage, filter, rotation, flipH, brightness, contrast, saturation]);

  const handleSend = async () => {
    if (!previewRef.current || sending) return;
    setSending(true);
    previewRef.current.toBlob(blob => {
      if (blob) onSend(new File([blob], 'photo.jpg', { type: 'image/jpeg' }));
    }, 'image/jpeg', 0.88);
  };

  const rotate = (deg) => setRotation(r => (r + deg + 360) % 360);
  const resetAdj = () => { setBrightness(100); setContrast(100); setSaturation(100); };

  const adjConfig = {
    brightness: { icon: Sun,      label: 'Brightness', value: brightness, set: setBrightness, min: 50,  max: 200 },
    contrast:   { icon: Contrast, label: 'Contrast',   value: contrast,   set: setContrast,   min: 50,  max: 200 },
    saturation: { icon: Droplets, label: 'Saturation', value: saturation, set: setSaturation, min: 0,   max: 300 },
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col" onClick={e => e.stopPropagation()}>
      {/* ── PICK PHASE ── */}
      {phase === 'pick' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 text-white/60 hover:text-white">
            <X className="w-6 h-6" />
          </button>
          <div className="text-center mb-4">
            <p className="text-white text-xl font-bold mb-1">Send Image</p>
            <p className="text-white/50 text-sm">Take a photo or choose from gallery</p>
          </div>
          <button onClick={() => setPhase('camera')}
            className="w-full max-w-xs flex items-center gap-4 px-6 py-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-colors">
            <div className="w-12 h-12 bg-vd-primary rounded-xl flex items-center justify-center flex-shrink-0">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <p className="text-white font-semibold">Camera</p>
              <p className="text-white/50 text-xs">Take a new photo</p>
            </div>
          </button>
          <button onClick={() => fileRef.current?.click()}
            className="w-full max-w-xs flex items-center gap-4 px-6 py-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-colors">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <div className="text-left">
              <p className="text-white font-semibold">Gallery</p>
              <p className="text-white/50 text-xs">Choose from your photos</p>
            </div>
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
        </div>
      )}

      {/* ── CAMERA PHASE ── */}
      {phase === 'camera' && (
        <>
          <div className="flex items-center justify-between px-4 py-3 bg-black/50 absolute top-0 left-0 right-0 z-10">
            <button onClick={() => { stopCamera(); setPhase('pick'); }} className="p-2 text-white"><ChevronLeft className="w-6 h-6" /></button>
            <p className="text-white font-semibold">Camera</p>
            <button onClick={async () => {
              const newFacing = cameraFacing === 'user' ? 'environment' : 'user';
              setCameraFacing(newFacing);
              await startCamera(newFacing);
            }} className="p-2 text-white">
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
          <video ref={videoRef} autoPlay playsInline muted
            className="flex-1 w-full object-cover"
            style={{ transform: cameraFacing === 'user' ? 'scaleX(-1)' : 'none' }}
          />
          <div className="flex items-center justify-center py-8 bg-black">
            <button onClick={capturePhoto}
              className="w-18 h-18 rounded-full border-4 border-white flex items-center justify-center"
              style={{ width: 72, height: 72 }}>
              <div className="w-14 h-14 bg-white rounded-full" />
            </button>
          </div>
        </>
      )}

      {/* ── EDIT PHASE ── */}
      {phase === 'edit' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-3 bg-black flex-shrink-0">
            <button onClick={() => { setPhase('pick'); setRawImage(null); setFilter('none'); setRotation(0); setFlipH(false); resetAdj(); }}
              className="p-2 text-white/70 hover:text-white"><ChevronLeft className="w-6 h-6" /></button>
            <p className="text-white font-semibold">Edit Photo</p>
            <button onClick={handleSend} disabled={sending}
              className="flex items-center gap-1.5 px-4 py-2 bg-vd-primary rounded-xl text-white text-sm font-semibold disabled:opacity-50">
              {sending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
              Send
            </button>
          </div>

          {/* Preview canvas */}
          <div className="flex-1 flex items-center justify-center bg-gray-950 overflow-hidden px-4 py-2">
            <canvas ref={previewRef} className="max-w-full max-h-full object-contain rounded-xl" style={{ maxHeight: 'calc(100vh - 320px)' }} />
          </div>

          {/* Adjustment slider */}
          {activeAdj && (() => {
            const cfg = adjConfig[activeAdj];
            return (
              <div className="px-6 py-3 bg-black/80 flex-shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-white text-xs font-semibold">{cfg.label}</p>
                  <p className="text-white/50 text-xs">{cfg.value}%</p>
                </div>
                <input type="range" min={cfg.min} max={cfg.max} value={cfg.value}
                  onChange={e => cfg.set(parseInt(e.target.value))}
                  className="w-full accent-vd-primary" />
              </div>
            );
          })()}

          {/* Tools row */}
          <div className="flex items-center justify-around px-4 py-3 bg-black flex-shrink-0 border-t border-white/10">
            <button onClick={() => rotate(-90)} className="flex flex-col items-center gap-1 text-white/70 hover:text-white">
              <RotateCcw className="w-5 h-5" /><span className="text-xs">Rotate L</span>
            </button>
            <button onClick={() => rotate(90)} className="flex flex-col items-center gap-1 text-white/70 hover:text-white">
              <RotateCw className="w-5 h-5" /><span className="text-xs">Rotate R</span>
            </button>
            <button onClick={() => setFlipH(f => !f)} className={`flex flex-col items-center gap-1 ${flipH ? 'text-vd-primary' : 'text-white/70 hover:text-white'}`}>
              <FlipHorizontal className="w-5 h-5" /><span className="text-xs">Flip</span>
            </button>
            {Object.entries(adjConfig).map(([key, cfg]) => (
              <button key={key} onClick={() => setActiveAdj(a => a === key ? null : key)}
                className={`flex flex-col items-center gap-1 ${activeAdj === key ? 'text-vd-primary' : 'text-white/70 hover:text-white'}`}>
                <cfg.icon className="w-5 h-5" /><span className="text-xs">{cfg.label}</span>
              </button>
            ))}
            <button onClick={resetAdj} className="flex flex-col items-center gap-1 text-white/70 hover:text-white">
              <X className="w-5 h-5" /><span className="text-xs">Reset</span>
            </button>
          </div>

          {/* Filters row */}
          <div className="flex-shrink-0 bg-black pb-4">
            <div className="flex gap-3 overflow-x-auto px-4 py-2 scrollbar-hide">
              {FILTERS.map(f => (
                <button key={f.id} onClick={() => setFilter(f.id)}
                  className={`flex flex-col items-center gap-1.5 flex-shrink-0 ${filter === f.id ? 'opacity-100' : 'opacity-60 hover:opacity-80'}`}>
                  <div className="w-16 h-16 rounded-xl overflow-hidden border-2 transition-all"
                    style={{ borderColor: filter === f.id ? 'var(--vd-primary, #C8A45C)' : 'transparent' }}>
                    {rawImage && (
                      <img src={rawImage} alt={f.label} className="w-full h-full object-cover"
                        style={{ filter: f.css, transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1})` }} />
                    )}
                  </div>
                  <span className={`text-xs ${filter === f.id ? 'text-vd-primary font-semibold' : 'text-white/60'}`}>{f.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
