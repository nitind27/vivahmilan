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

  // Request user to switch to back camera
  const requestBackCamera = () => {
    socketRef.current?.emit('kyc:switch-camera', { sessionId });
    toast.success('Requested user to switch to back camera');
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

  // Call phase
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col lg:flex-row">
      {/* Video area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${userConnected ? 'bg-green-400 animate-pulse' : 'bg-yellow-400 animate-pulse'}`} />
            <span className="text-white font-semibold text-sm">
              KYC: {kycInfo?.userName}
            </span>
          </div>
          {!userConnected && (
            <span className="text-xs text-yellow-400 bg-yellow-900/20 px-2 py-1 rounded-full">
              Waiting for user to join…
            </span>
          )}
          {userConnected && (
            <span className="text-xs text-green-400 bg-green-900/20 px-2 py-1 rounded-full flex items-center gap-1">
              <Users className="w-3 h-3" /> User Connected
            </span>
          )}
        </div>

        {/* Remote video (user) */}
        <div className="flex-1 relative bg-black">
          <video ref={remoteVideoRef} autoPlay playsInline
            className="w-full h-full object-cover"
          />
          {!userConnected && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-10 h-10 text-yellow-500 animate-spin mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Waiting for user to join…</p>
              </div>
            </div>
          )}

          {/* Local PiP */}
          <div className="absolute bottom-4 right-4 w-32 h-24 rounded-xl overflow-hidden border-2 border-gray-600 shadow-xl">
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
          </div>
        </div>

        {/* Controls */}
        <div className="bg-gray-900 border-t border-gray-800 px-4 py-4 flex items-center justify-center gap-3 flex-wrap">
          <button onClick={toggleAudio}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${audioMuted ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'} text-white`}>
            {audioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          <button onClick={toggleVideo}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${videoOff ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'} text-white`}>
            {videoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>
          <button onClick={requestBackCamera} title="Ask user to switch to back camera"
            className="w-12 h-12 rounded-full bg-blue-700 hover:bg-blue-600 text-white flex items-center justify-center transition-colors">
            <SwitchCamera className="w-5 h-5" />
          </button>
          <button onClick={captureImage} title="Capture screenshot"
            className="w-12 h-12 rounded-full bg-yellow-600 hover:bg-yellow-500 text-gray-900 flex items-center justify-center transition-colors">
            <Camera className="w-5 h-5" />
          </button>
          <button onClick={endCall}
            className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-colors">
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Side panel */}
      <div className="w-full lg:w-80 bg-gray-900 border-t lg:border-t-0 lg:border-l border-gray-800 flex flex-col p-4 gap-4 overflow-y-auto" style={{ maxHeight: '100vh' }}>
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
