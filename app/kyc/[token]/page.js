'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { io } from 'socket.io-client';
import { Video, VideoOff, Mic, MicOff, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { replaceStreamVideoTrack, startCameraWithAudio } from '@/lib/kycCamera';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export default function UserKycPage() {
  const { token } = useParams();
  const [phase, setPhase] = useState('loading'); // loading | waiting | call | ended | error
  const [sessionId, setSessionId] = useState(null);
  const [userName, setUserName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [audioMuted, setAudioMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [usingBack, setUsingBack] = useState(false);
  const [docMode, setDocMode] = useState(false);
  const [adminConnected, setAdminConnected] = useState(false);
  const [cameraSwitching, setCameraSwitching] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const pcRef = useRef(null);
  const socketRef = useRef(null);
  const pendingCandidates = useRef([]);

  // Validate token
  useEffect(() => {
    fetch(`/api/kyc/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setErrorMsg(data.error); setPhase('error'); return; }
        setSessionId(data.sessionId);
        setUserName(data.userName);
        setPhase('waiting');
      })
      .catch(() => { setErrorMsg('Failed to load session'); setPhase('error'); });
  }, [token]);

  const switchCamera = useCallback(async (preferBack) => {
    setCameraSwitching(true);
    try {
      let stream = localStreamRef.current;

      if (!stream) {
        stream = await startCameraWithAudio(preferBack);
        localStreamRef.current = stream;
      } else {
        await replaceStreamVideoTrack(stream, preferBack);
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        await localVideoRef.current.play().catch(() => {});
      }

      if (pcRef.current) {
        const newVideoTrack = stream.getVideoTracks()[0];
        const sender = pcRef.current.getSenders().find(s => s.track?.kind === 'video');
        if (sender && newVideoTrack) await sender.replaceTrack(newVideoTrack);
      }

      setUsingBack(preferBack);
      setDocMode(preferBack);
      if (videoOff) {
        const track = stream.getVideoTracks()[0];
        if (track) track.enabled = false;
      }
      return stream;
    } finally {
      setCameraSwitching(false);
    }
  }, [videoOff]);

  // Join call
  const joinCall = useCallback(async () => {
    if (!sessionId) return;
    setPhase('call');

    // Mark session active
    await fetch(`/api/kyc/${token}`, { method: 'POST' });

    const stream = await switchCamera(false);

    // Connect socket
    const socket = io({ path: '/api/socket', transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('kyc:join', { sessionId, role: 'user' });
    });

    socket.on('kyc:peer-joined', ({ role }) => {
      if (role === 'admin') setAdminConnected(true);
    });

    socket.on('kyc:offer', async ({ offer }) => {
      const pc = createPeerConnection(socket, sessionId);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      // Flush pending candidates
      for (const c of pendingCandidates.current) {
        await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
      }
      pendingCandidates.current = [];
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('kyc:answer', { sessionId, answer });
    });

    socket.on('kyc:ice-candidate', async ({ candidate }) => {
      if (pcRef.current?.remoteDescription) {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
      } else {
        pendingCandidates.current.push(candidate);
      }
    });

    socket.on('kyc:switch-camera', async ({ mode } = {}) => {
      const preferBack = mode !== 'front';
      try {
        await switchCamera(preferBack);
      } catch (err) {
        console.error('Camera switch failed:', err);
      }
    });

    socket.on('kyc:ended', () => {
      setPhase('ended');
      cleanup();
    });
  }, [sessionId, token, switchCamera]);

  function createPeerConnection(socket, sessionId) {
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

  useEffect(() => () => cleanup(), []);

  if (phase === 'loading') return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
    </div>
  );

  if (phase === 'error') return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-white mb-2">Link Invalid</h1>
        <p className="text-gray-400">{errorMsg}</p>
      </div>
    </div>
  );

  if (phase === 'ended') return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-white mb-2">KYC Call Ended</h1>
        <p className="text-gray-400">Your verification call has been completed. You will be notified once reviewed.</p>
      </div>
    </div>
  );

  if (phase === 'waiting') return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Video className="w-10 h-10 text-yellow-500" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Video KYC Verification</h1>
        <p className="text-gray-400 mb-2">Hello, <span className="text-yellow-400 font-semibold">{userName}</span></p>
        <p className="text-gray-500 text-sm mb-8">
          Please keep your ID document ready. The call will be recorded for verification purposes.
          Make sure you are in a well-lit area.
        </p>
        <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700 mb-6 text-left space-y-2">
          {['📹 Allow camera & microphone access', '🪪 Keep your ID document nearby', '💡 Ensure good lighting', '🔇 Find a quiet place'].map(s => (
            <p key={s} className="text-sm text-gray-300">{s}</p>
          ))}
        </div>
        <button onClick={joinCall}
          className="w-full py-4 bg-gradient-to-r from-yellow-600 to-yellow-500 text-gray-900 font-bold rounded-2xl text-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
          <Video className="w-5 h-5" /> Join Video Call
        </button>
      </div>
    </div>
  );

  // Call phase — full viewport, no page scroll
  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full overflow-hidden bg-gray-950 flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 bg-gray-900 border-b border-gray-800 px-3 py-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-white font-semibold text-sm">Video KYC</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {adminConnected
            ? <span className="text-[10px] sm:text-xs text-green-400 bg-green-900/20 px-2 py-1 rounded-full">Admin Connected</span>
            : <span className="text-[10px] sm:text-xs text-yellow-400 bg-yellow-900/20 px-2 py-1 rounded-full">Waiting…</span>
          }
        </div>
      </div>

      {/* Video area — fills remaining space above controls */}
      <div className="flex-1 min-h-0 relative bg-black overflow-hidden">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-contain bg-black"
        />

        {/* Local PiP — compact so it doesn't cover controls */}
        <div className={`absolute bottom-2 right-2 sm:bottom-3 sm:right-3 rounded-xl overflow-hidden border-2 shadow-xl z-10 transition-all ${
          docMode ? 'w-28 h-20 sm:w-36 sm:h-28 border-yellow-500' : 'w-20 h-14 sm:w-24 sm:h-16 border-gray-600'
        }`}>
          {docMode && (
            <div className="absolute inset-0 z-10 pointer-events-none">
              <div className="absolute inset-1.5 border-2 border-yellow-400 rounded-md opacity-80" />
              <div className="absolute top-0.5 left-1/2 -translate-x-1/2 text-yellow-400 text-[9px] font-bold bg-black/60 px-1.5 py-0.5 rounded whitespace-nowrap">
                Place ID Here
              </div>
            </div>
          )}
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={!docMode ? { transform: 'scaleX(-1)' } : {}}
          />
        </div>

        {/* Status banners — compact top */}
        {docMode && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 max-w-[90%] bg-yellow-500 text-gray-900 font-bold px-3 py-1.5 rounded-full text-[10px] sm:text-xs text-center z-10">
            📄 Document Scan — Show your ID
          </div>
        )}
        {!docMode && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-green-600/90 text-white font-semibold px-3 py-1 rounded-full text-[10px] sm:text-xs z-10">
            🎥 Face Camera Active
          </div>
        )}
        {cameraSwitching && (
          <div className="absolute top-2 left-2 bg-black/70 text-white text-[10px] px-2 py-1 rounded-full flex items-center gap-1.5 z-10">
            <Loader2 className="w-3 h-3 animate-spin" /> Switching…
          </div>
        )}
      </div>

      {/* Controls — fixed bottom bar */}
      <div className="flex-shrink-0 bg-gray-900 border-t border-gray-800 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-center gap-3 sm:gap-4">
          <button onClick={toggleAudio}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${audioMuted ? 'bg-red-600 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'}`}>
            {audioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          <button onClick={toggleVideo}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${videoOff ? 'bg-red-600 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'}`}>
            {videoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>
          <div className="text-center min-w-0 flex-1 max-w-[160px]">
            <p className="text-[10px] sm:text-xs text-gray-400 truncate">
              {cameraSwitching
                ? 'Switching camera…'
                : docMode ? '📄 Back — document' : '🎥 Front — face'}
            </p>
            <p className="text-[9px] text-gray-600 hidden sm:block">Admin controls camera</p>
          </div>
        </div>
      </div>
    </div>
  );
}
