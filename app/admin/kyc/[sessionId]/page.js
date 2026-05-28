'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { io } from 'socket.io-client';
import {
  Video, VideoOff, Mic, MicOff, Camera, PhoneOff,
  RotateCcw, Download, CheckCircle, Loader2, Users, SwitchCamera
} from 'lucide-react';
import toast from 'react-hot-toast';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export default function AdminKycCallPage() {
  const { sessionId } = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();

  const [phase, setPhase] = useState('loading'); // loading | waiting | call | ended
  const [kycInfo, setKycInfo] = useState(null);
  const [userConnected, setUserConnected] = useState(false);
  const [audioMuted, setAudioMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [capturedImages, setCapturedImages] = useState([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [userCameraMode, setUserCameraMode] = useState('front'); // front | back

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const pcRef = useRef(null);
  const socketRef = useRef(null);
  const pendingCandidates = useRef([]);
  const remoteCanvasRef = useRef(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') router.push('/dashboard');
  }, [status, session, router]);

  // Load session info
  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch(`/api/admin/kyc?sessionId=${sessionId}`)
      .then(r => r.json())
      .then(data => {
        if (!data) { toast.error('Session not found'); router.push('/admin'); return; }
        setKycInfo(data);
        if (data.capturedImages) {
          try { setCapturedImages(JSON.parse(data.capturedImages)); } catch {}
        }
        if (data.notes) setNotes(data.notes);
        setPhase('waiting');
      });
  }, [sessionId, status]);

  const startCamera = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
    });
    localStreamRef.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    return stream;
  }, []);

  const joinCall = useCallback(async () => {
    setPhase('call');
    const stream = await startCamera();

    const socket = io({ path: '/api/socket', transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('kyc:join', { sessionId, role: 'admin' });
    });

    socket.on('kyc:peer-joined', async ({ role }) => {
      if (role === 'user') {
        setUserConnected(true);
        // Admin initiates offer
        const pc = createPeerConnection(socket);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('kyc:offer', { sessionId, offer });
      }
    });

    socket.on('kyc:answer', async ({ answer }) => {
      if (pcRef.current) {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        for (const c of pendingCandidates.current) {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
        }
        pendingCandidates.current = [];
      }
    });

    socket.on('kyc:ice-candidate', async ({ candidate }) => {
      if (pcRef.current?.remoteDescription) {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
      } else {
        pendingCandidates.current.push(candidate);
      }
    });
  }, [sessionId, startCamera]);

  function createPeerConnection(socket) {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    localStreamRef.current?.getTracks().forEach(track => {
      pc.addTrack(track, localStreamRef.current);
    });

    pc.ontrack = (e) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) socket.emit('kyc:ice-candidate', { sessionId, candidate: e.candidate });
    };

    return pc;
  }

  const requestUserCamera = (mode) => {
    if (!socketRef.current) return;
    socketRef.current.emit('kyc:switch-camera', { sessionId, mode });
    setUserCameraMode(mode);
    toast.success(
      mode === 'back'
        ? 'User switched to back camera — document scan mode'
        : 'User switched to front camera — face verification mode'
    );
  };

  // Capture screenshot from remote video
  const captureImage = () => {
    const video = remoteVideoRef.current;
    if (!video || !video.videoWidth) { toast.error('No video stream to capture'); return; }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

    const timestamp = new Date().toLocaleTimeString();
    setCapturedImages(prev => [...prev, { dataUrl, timestamp }]);
    toast.success('Image captured');
  };

  const removeCapture = (idx) => {
    setCapturedImages(prev => prev.filter((_, i) => i !== idx));
  };

  const endCall = async () => {
    socketRef.current?.emit('kyc:end', { sessionId });
    cleanup();
    setPhase('ended');
    await saveSession('COMPLETED');
  };

  const saveSession = async (status) => {
    setSaving(true);
    try {
      await fetch('/api/admin/kyc', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          status: status || undefined,
          capturedImages: capturedImages.map(i => ({ dataUrl: i.dataUrl, timestamp: i.timestamp })),
          notes,
        }),
      });
      toast.success('Session saved');
    } finally {
      setSaving(false);
    }
  };

  function cleanup() {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    pcRef.current?.close();
    socketRef.current?.disconnect();
  }

  const toggleAudio = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) { track.enabled = !track.enabled; setAudioMuted(m => !m); }
  };

  const toggleVideo = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) { track.enabled = !track.enabled; setVideoOff(v => !v); }
  };

  const downloadImage = (dataUrl, idx) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `kyc-capture-${idx + 1}.jpg`;
    a.click();
  };

  useEffect(() => () => cleanup(), []);

  if (phase === 'loading' || status === 'loading') return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
    </div>
  );

  if (phase === 'ended') return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">KYC Call Completed</h1>
          <p className="text-gray-400">Session with {kycInfo?.userName}</p>
        </div>

        {/* Notes */}
        <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700 mb-4">
          <label className="text-sm font-semibold text-gray-300 block mb-2">Verification Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
            placeholder="Add notes about this verification…"
            className="w-full bg-gray-700 border border-gray-600 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500 resize-none" />
        </div>

        {/* Captured images */}
        {capturedImages.length > 0 && (
          <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700 mb-4">
            <p className="text-sm font-semibold text-gray-300 mb-3">Captured Images ({capturedImages.length})</p>
            <div className="grid grid-cols-2 gap-3">
              {capturedImages.map((img, i) => (
                <div key={i} className="relative rounded-xl overflow-hidden border border-gray-600">
                  <img src={img.dataUrl} alt={`Capture ${i + 1}`} className="w-full h-32 object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 flex items-center justify-between">
                    <span className="text-xs text-gray-300">{img.timestamp}</span>
                    <button onClick={() => downloadImage(img.dataUrl, i)} className="text-yellow-400 hover:text-yellow-300">
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={() => saveSession()} disabled={saving}
            className="flex-1 py-3 bg-yellow-600 hover:bg-yellow-500 text-gray-900 font-bold rounded-xl transition-colors disabled:opacity-50">
            {saving ? 'Saving…' : 'Save Session'}
          </button>
          <button onClick={() => router.push('/admin')}
            className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors">
            Back to Admin
          </button>
        </div>
      </div>
    </div>
  );

  if (phase === 'waiting') return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Video className="w-10 h-10 text-yellow-500" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Video KYC — Admin</h1>
        <p className="text-gray-400 mb-1">User: <span className="text-yellow-400 font-semibold">{kycInfo?.userName}</span></p>
        <p className="text-gray-500 text-sm mb-8">{kycInfo?.userEmail}</p>
        <button onClick={joinCall}
          className="w-full py-4 bg-gradient-to-r from-yellow-600 to-yellow-500 text-gray-900 font-bold rounded-2xl text-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
          <Video className="w-5 h-5" /> Start KYC Call
        </button>
      </div>
    </div>
  );

  // Call phase — locked to viewport; controls always visible without scroll
  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full overflow-hidden bg-gray-950 flex flex-col lg:flex-row">
      {/* Video column */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        {/* Header */}
        <div className="flex-shrink-0 bg-gray-900 border-b border-gray-800 px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${userConnected ? 'bg-green-400 animate-pulse' : 'bg-yellow-400 animate-pulse'}`} />
            <span className="text-white font-semibold text-sm truncate">
              KYC: {kycInfo?.userName}
            </span>
          </div>
          {!userConnected ? (
            <span className="text-[10px] sm:text-xs text-yellow-400 bg-yellow-900/20 px-2 py-1 rounded-full flex-shrink-0">
              Waiting…
            </span>
          ) : (
            <span className="text-[10px] sm:text-xs text-green-400 bg-green-900/20 px-2 py-1 rounded-full flex items-center gap-1 flex-shrink-0">
              <Users className="w-3 h-3" /> Connected
            </span>
          )}
        </div>

        {/* Remote video — bounded height */}
        <div className="flex-1 min-h-0 relative bg-black overflow-hidden">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-contain bg-black"
          />
          {!userConnected && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-yellow-500 animate-spin mx-auto mb-2" />
                <p className="text-gray-400 text-xs sm:text-sm">Waiting for user…</p>
              </div>
            </div>
          )}

          {/* Local PiP */}
          <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 w-20 h-14 sm:w-28 sm:h-20 rounded-lg overflow-hidden border-2 border-gray-600 shadow-xl z-10">
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
          </div>

          {/* Camera mode badge on video */}
          <div className={`absolute top-2 left-2 text-[10px] sm:text-xs font-semibold px-2 py-1 rounded-full z-10 ${
            userCameraMode === 'back' ? 'bg-blue-600/90 text-white' : 'bg-green-600/90 text-white'
          }`}>
            User: {userCameraMode === 'back' ? '📄 Back / ID' : '🎥 Front'}
          </div>
        </div>

        {/* Controls — always pinned at bottom of video column */}
        <div className="flex-shrink-0 bg-gray-900 border-t border-gray-800 px-2 sm:px-4 py-2 sm:py-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] space-y-2">
          {/* Camera switch — primary row, full width on mobile */}
          <div className="flex gap-2">
            <button
              onClick={() => requestUserCamera('front')}
              className={`flex-1 h-10 sm:h-11 rounded-xl flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold transition-colors ${
                userCameraMode === 'front'
                  ? 'bg-green-600 text-white ring-2 ring-green-400/60'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Video className="w-4 h-4 flex-shrink-0" /> Front Camera
            </button>
            <button
              onClick={() => requestUserCamera('back')}
              className={`flex-1 h-10 sm:h-11 rounded-xl flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold transition-colors ${
                userCameraMode === 'back'
                  ? 'bg-blue-600 text-white ring-2 ring-blue-400/60'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <SwitchCamera className="w-4 h-4 flex-shrink-0" /> Back / ID Scan
            </button>
          </div>

          {/* Action buttons row */}
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            <button onClick={toggleAudio}
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-colors ${audioMuted ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'} text-white`}>
              {audioMuted ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
            <button onClick={toggleVideo}
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-colors ${videoOff ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'} text-white`}>
              {videoOff ? <VideoOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Video className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
            <button onClick={captureImage} title="Capture screenshot"
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-yellow-600 hover:bg-yellow-500 text-gray-900 flex items-center justify-center transition-colors">
              <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button onClick={endCall}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-colors">
              <PhoneOff className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Side panel — desktop only; scrollable notes/captures */}
      <div className="hidden lg:flex lg:w-72 xl:w-80 flex-shrink-0 flex-col bg-gray-900 border-l border-gray-800 p-4 gap-4 overflow-y-auto min-h-0">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Verification Notes</p>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4}
            placeholder="Type notes during the call…"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500 resize-none" />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Captured Images ({capturedImages.length})</p>
            <button onClick={captureImage}
              className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1">
              <Camera className="w-3 h-3" /> Capture
            </button>
          </div>
          {capturedImages.length === 0 ? (
            <p className="text-xs text-gray-600 text-center py-4">No captures yet. Click 📷 to capture.</p>
          ) : (
            <div className="space-y-2">
              {capturedImages.map((img, i) => (
                <div key={i} className="relative rounded-xl overflow-hidden border border-gray-700">
                  <img src={img.dataUrl} alt="" className="w-full h-28 object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-2 py-1 flex items-center justify-between">
                    <span className="text-xs text-gray-300">{img.timestamp}</span>
                    <div className="flex gap-2">
                      <button onClick={() => downloadImage(img.dataUrl, i)} className="text-yellow-400 hover:text-yellow-300">
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => removeCapture(i)} className="text-red-400 hover:text-red-300 text-xs">✕</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-auto">
          <button onClick={() => saveSession()} disabled={saving}
            className="w-full py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl text-sm transition-colors disabled:opacity-50">
            {saving ? 'Saving…' : '💾 Save Progress'}
          </button>
        </div>
      </div>
    </div>
  );
}
