'use client';
import { useEffect, useState, useRef, useCallback, Suspense, lazy } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import SmartImage from '@/components/SmartImage';import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import {
  Send, MessageCircle, Star, BadgeCheck, ArrowLeft,
  Check, CheckCheck, Smile, Paperclip, Image as ImageIcon,
  FileText, MapPin, X, Download
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import toast from 'react-hot-toast';
import { connectSocket } from '@/lib/socket';

const EmojiPicker = lazy(() => import('emoji-picker-react'));

function formatMsgTime(date) {
  const d = new Date(date);
  if (isToday(d)) return format(d, 'h:mm a');
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMM d');
}

// ── Message Bubble ────────────────────────────────────────────────────────────
function MessageBubble({ msg, isMe }) {
  const [zoom, setZoom] = useState(false);

  if (msg.type === 'IMAGE') {
    return (
      <>
        <div className={`max-w-xs ${isMe ? 'ml-auto' : 'mr-auto'}`}>
          <div
            className={`rounded-2xl overflow-hidden relative border-2 ${isMe ? 'border-pink-300' : 'border-gray-200 dark:border-gray-600'}`}
            style={{ minWidth: 180, minHeight: 120 }}
          >
            {/* Image — blurred for receiver until they click */}
            <img
              src={msg.fileUrl}
              alt={msg.fileName || 'image'}
              className={`w-full object-cover transition-all duration-500 ${
                msg._uploading ? 'blur-md scale-105' :
                !isMe && !zoom ? 'blur-sm' : ''
              }`}
              style={{ maxHeight: 220, cursor: msg._uploading ? 'default' : 'pointer' }}
              onClick={() => !msg._uploading && setZoom(true)}
            />

            {/* Sender: uploading overlay */}
            {msg._uploading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 rounded-2xl">
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mb-1" />
                <span className="text-white text-xs font-medium">Sending…</span>
              </div>
            )}

            {/* Receiver: blur overlay with "Tap to view" */}
            {!isMe && !msg._uploading && !zoom && (
              <div
                className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer"
                onClick={() => setZoom(true)}
              >
                <div className="bg-black/40 rounded-full p-3 mb-1">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <span className="text-white text-xs font-medium bg-black/40 px-2 py-0.5 rounded-full">Tap to view</span>
              </div>
            )}
          </div>
          <MsgMeta isMe={isMe} msg={msg} />
        </div>

        {/* Full screen zoom modal — clear image */}
        <AnimatePresence>
          {zoom && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-4"
              onClick={() => setZoom(false)}>
              <button className="absolute top-4 right-4 text-white bg-white/10 rounded-full p-2 hover:bg-white/20 z-10">
                <X className="w-5 h-5" />
              </button>
              {/* Download button */}
              <a
                href={msg.fileUrl}
                download={msg.fileName || 'image.jpg'}
                onClick={e => e.stopPropagation()}
                className="absolute top-4 left-4 text-white bg-white/10 rounded-full p-2 hover:bg-white/20 z-10"
              >
                <Download className="w-5 h-5" />
              </a>
              <img
                src={msg.fileUrl}
                alt=""
                className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl"
                onClick={e => e.stopPropagation()}
              />
              <p className="text-white/60 text-xs mt-3">{msg.fileName}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  if (msg.type === 'DOCUMENT') {
    return (
      <div className={`max-w-xs ${isMe ? 'ml-auto' : 'mr-auto'}`}>
        <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border relative overflow-hidden ${isMe ? 'gradient-bg text-white border-transparent' : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600'}`}>
          {msg._uploading && (
            <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isMe ? 'bg-white/20' : 'bg-pink-50 dark:bg-pink-900/20'}`}>
            <FileText className={`w-5 h-5 ${isMe ? 'text-white' : 'text-pink-500'}`} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{msg.fileName}</p>
            {msg.fileSize && <p className={`text-xs ${isMe ? 'text-white/70' : 'text-gray-400'}`}>{(msg.fileSize / 1024).toFixed(1)} KB</p>}
          </div>
          {!msg._uploading && msg.fileUrl && (
            <a href={msg.fileUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>
              <Download className={`w-4 h-4 flex-shrink-0 ${isMe ? 'text-white/80' : 'text-gray-400'}`} />
            </a>
          )}
        </div>
        <MsgMeta isMe={isMe} msg={msg} />
      </div>
    );
  }

  if (msg.type === 'LOCATION') {
    const mapsUrl = `https://www.google.com/maps?q=${msg.latitude},${msg.longitude}`;
    const staticMapUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${msg.latitude},${msg.longitude}&zoom=15&size=300x160&markers=${msg.latitude},${msg.longitude},red`;

    // Check if live location is still active
    const isLive = msg.locationType === 'live';
    const isExpired = msg.locationExpiry && new Date() > new Date(msg.locationExpiry);
    const isActive = isLive && !isExpired;

    // Time remaining for live location
    let timeLeft = '';
    if (isLive && !isExpired && msg.locationExpiry) {
      const diff = new Date(msg.locationExpiry) - new Date();
      const hrs = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      timeLeft = hrs > 0 ? `${hrs}h ${mins}m left` : `${mins}m left`;
    }

    return (
      <div className={`max-w-xs ${isMe ? 'ml-auto' : 'mr-auto'}`}>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noreferrer"
          className={`block rounded-2xl overflow-hidden border-2 ${isMe ? 'border-pink-300' : 'border-gray-200 dark:border-gray-600'}`}
          style={{ width: 240 }}
        >
          {/* Map thumbnail */}
          <div className="relative w-full" style={{ height: 140 }}>
            <img
              src={staticMapUrl}
              alt="location map"
              className="w-full h-full object-cover"
              onError={e => {
                e.target.style.display = 'none';
                e.target.parentNode.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
              }}
            />
            {/* Pin */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-white rounded-full p-1.5 shadow-lg">
                <MapPin className="w-5 h-5 text-red-500 fill-red-100" />
              </div>
            </div>
            {/* Live badge */}
            {isLive && (
              <div className={`absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${isActive ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'}`}>
                {isActive && <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
                {isActive ? 'LIVE' : 'ENDED'}
              </div>
            )}
          </div>

          {/* Bottom bar */}
          <div className={`px-3 py-2 ${isMe ? 'gradient-bg' : 'bg-white dark:bg-gray-700'}`}>
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className={`text-xs font-semibold ${isMe ? 'text-white' : 'text-gray-800 dark:text-gray-100'}`}>
                  {isLive ? '📡 Live Location' : '📍 Location'}
                </p>
                <p className={`text-xs ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
                  {isActive ? timeLeft : isExpired ? 'Expired' : `${msg.latitude?.toFixed(4)}, ${msg.longitude?.toFixed(4)}`}
                </p>
              </div>
              <div className={`text-xs font-medium ml-2 flex-shrink-0 px-2 py-1 rounded-lg ${isMe ? 'bg-white/20 text-white' : 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400'}`}>
                Open ↗
              </div>
            </div>
          </div>
        </a>
        <MsgMeta isMe={isMe} msg={msg} />
      </div>
    );
  }

  // TEXT — check if profile card auto-message
  const isProfileCard = msg.content?.startsWith('🌟 *Premium Profile Details*') ||
                        msg.content?.startsWith('✨ *Profile Details*');

  if (isProfileCard) {
    const isPremiumCard = msg.content.startsWith('🌟');
    return (
      <div className={`w-72 ${isMe ? 'ml-auto' : 'mr-auto'}`}>
        <div className={`rounded-2xl overflow-hidden border-2 shadow-md ${isPremiumCard ? 'border-yellow-400 dark:border-yellow-600' : 'border-pink-200 dark:border-pink-800'}`}>
          <div className={`px-4 py-2.5 ${isPremiumCard ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : 'gradient-bg'}`}>
            <p className="text-white text-xs font-bold">{isPremiumCard ? '⭐ Premium Profile Details' : '✨ Profile Details'}</p>
          </div>
          <div className="bg-white dark:bg-gray-700 px-4 py-3 space-y-0.5">
            {msg.content.split('\n')
              .filter(l => !l.startsWith('🌟') && !l.startsWith('✨') && !l.startsWith('━'))
              .map((line, i) => {
                if (!line.trim()) return <div key={i} className="h-1.5" />;
                const isBold = line.startsWith('👤');
                const isContact = line.startsWith('📞') || line.startsWith('📧');
                const isLocked = line.includes('Upgrade to Premium');
                return (
                  <p key={i} className={`text-xs leading-relaxed ${
                    isBold ? 'font-bold text-gray-900 dark:text-white text-sm' :
                    isContact ? 'text-green-600 dark:text-green-400 font-semibold' :
                    isLocked ? 'text-orange-500 dark:text-orange-400 italic' :
                    'text-gray-600 dark:text-gray-300'
                  }`}>{line.replace(/\*/g, '')}</p>
                );
              })}
          </div>
        </div>
        <MsgMeta isMe={isMe} msg={msg} />
      </div>
    );
  }

  // Regular text
  return (
    <div className={`max-w-xs lg:max-w-sm xl:max-w-md ${isMe ? 'ml-auto' : 'mr-auto'}`}>
      <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
        isMe ? 'gradient-bg text-white rounded-br-sm' : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-sm shadow-sm'
      }`}>
        {msg.content}
      </div>
      <MsgMeta isMe={isMe} msg={msg} />
    </div>
  );
}

function MsgMeta({ isMe, msg }) {
  return (
    <div className={`flex items-center gap-1 mt-0.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
      <span className="text-xs text-gray-400">{format(new Date(msg.createdAt), 'h:mm a')}</span>
      {isMe && (
        msg.isRead
          ? <CheckCheck className="w-3.5 h-3.5 text-blue-500" title="Seen" />
          : <CheckCheck className="w-3.5 h-3.5 text-gray-400" title="Delivered" />
      )}
    </div>
  );
}

// ── Main Chat Inner ───────────────────────────────────────────────────────────
function ChatInner() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetUserId = searchParams.get('userId');

  const [rooms, setRooms]             = useState([]);
  const [activeRoom, setActiveRoom]   = useState(null);
  const [messages, setMessages]       = useState([]);
  const [input, setInput]             = useState('');
  const [loading, setLoading]         = useState(true);
  const [sending, setSending]         = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [otherTyping, setOtherTyping] = useState(false);
  const [showEmoji, setShowEmoji]     = useState(false);
  const [showAttach, setShowAttach]   = useState(false);
  const [showLocPicker, setShowLocPicker] = useState(false);
  const [unreadPerRoom, setUnreadPerRoom] = useState({});

  const messagesEndRef  = useRef(null);
  const typingTimeout   = useRef(null);
  const isTyping        = useRef(false);
  const socketRef       = useRef(null);
  const fileInputRef    = useRef(null);
  const docInputRef     = useRef(null);
  const inputRef        = useRef(null);
  const activeRoomRef   = useRef(null); // always current activeRoom

  // Keep activeRoomRef in sync
  useEffect(() => { activeRoomRef.current = activeRoom; }, [activeRoom]);

  // Browser notification helper
  const showBrowserNotification = useCallback((title, body) => {
    if (typeof window === 'undefined') return;
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' });
    }
  }, []);

  // Request notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated') {
      const hasAccess = session?.user?.isPremium || session?.user?.freeTrialActive;
      if (!hasAccess) {
        toast.error('Chat requires Premium. Upgrade to access.');
        router.push('/premium');
      }
    }
  }, [status, session, router]);

  // Socket setup
  useEffect(() => {
    if (status !== 'authenticated') return;
    const hasAccess = session?.user?.isPremium || session?.user?.freeTrialActive;
    if (!hasAccess) return;
    const s = connectSocket(session.user.id);
    socketRef.current = s;
    s.on('users:online', setOnlineUsers);
    s.on('message:receive', (msg) => {
      // If this room is currently open — don't increment unread, mark read immediately
      const currentRoom = activeRoomRef.current;
      if (currentRoom?.id === msg.chatRoomId) {
        setMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, { ...msg, isRead: true }]);
        // Tell sender their message was read
        socketRef.current?.emit('message:read', { roomId: msg.chatRoomId, readerId: session.user.id });
      } else {
        setMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg]);
        setUnreadPerRoom(prev => ({ ...prev, [msg.chatRoomId]: (prev[msg.chatRoomId] || 0) + 1 }));
        // Browser notification
        showBrowserNotification(msg._senderName || 'New message', msg.content || '📷 Photo');
      }
      setRooms(prev => {
        const updated = prev.map(r => r.id === msg.chatRoomId ? { ...r, messages: [msg] } : r);
        return updated.sort((a, b) => {
          const aTime = a.messages?.[0]?.createdAt ? new Date(a.messages[0].createdAt) : new Date(a.createdAt);
          const bTime = b.messages?.[0]?.createdAt ? new Date(b.messages[0].createdAt) : new Date(b.createdAt);
          return bTime - aTime;
        });
      });
    });
    // When receiver reads our messages — update ticks to blue
    s.on('message:read', ({ roomId, readerId }) => {
      setMessages(prev => prev.map(m =>
        m.chatRoomId === roomId && m.senderId === session.user.id ? { ...m, isRead: true } : m
      ));
    });
    s.on('typing:start', () => setOtherTyping(true));
    s.on('typing:stop',  () => setOtherTyping(false));
    return () => { s.off('users:online'); s.off('message:receive'); s.off('message:read'); s.off('typing:start'); s.off('typing:stop'); };
  }, [status, session]);

  // Load rooms
  useEffect(() => {
    if (status !== 'authenticated') return;
    const hasAccess = session?.user?.isPremium || session?.user?.freeTrialActive;
    if (!hasAccess) return;
    const loadRooms = () => {
      Promise.all([
        fetch('/api/chat').then(r => r.json()),
        fetch('/api/chat/unread').then(r => r.json()),
      ]).then(([data, unreadData]) => {
        // Sort by latest message
        const sorted = (data || []).sort((a, b) => {
          const aTime = a.messages?.[0]?.createdAt ? new Date(a.messages[0].createdAt) : new Date(a.createdAt);
          const bTime = b.messages?.[0]?.createdAt ? new Date(b.messages[0].createdAt) : new Date(b.createdAt);
          return bTime - aTime;
        });
        setRooms(sorted);
        setUnreadPerRoom(unreadData.perRoom || {});
        setLoading(false);
        if (targetUserId) {
          const room = sorted.find(r => r.userAId === targetUserId || r.userBId === targetUserId);
          if (room) openRoom(room);
        }
      });
    };
    loadRooms();
  }, [status, session, targetUserId]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, otherTyping]);

  const openRoom = useCallback((room) => {
    if (activeRoom) socketRef.current?.emit('room:leave', activeRoom.id);
    setActiveRoom(room);
    setMessages([]);
    setOtherTyping(false);
    setShowEmoji(false);
    setShowAttach(false);
    socketRef.current?.emit('room:join', room.id);
    fetch(`/api/chat/${room.id}`).then(r => r.json()).then(msgs => {
      setMessages(msgs);
      // Tell sender their messages are read
      socketRef.current?.emit('message:read', { roomId: room.id, readerId: session?.user?.id });
    });
    // Clear unread for this room
    setUnreadPerRoom(prev => ({ ...prev, [room.id]: 0 }));
  }, [activeRoom, session]);

  const getOtherUser = (room) => room?.userAId === session?.user?.id ? room?.userB : room?.userA;
  const isOnline = (uid) => onlineUsers.includes(uid);

  const handleTyping = (val) => {
    setInput(val);
    if (!activeRoom || !socketRef.current) return;
    if (!isTyping.current) {
      isTyping.current = true;
      socketRef.current.emit('typing:start', { roomId: activeRoom.id, userId: session.user.id });
    }
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      isTyping.current = false;
      socketRef.current?.emit('typing:stop', { roomId: activeRoom.id, userId: session.user.id });
    }, 1500);
  };

  const stopTyping = () => {
    clearTimeout(typingTimeout.current);
    if (isTyping.current) {
      isTyping.current = false;
      socketRef.current?.emit('typing:stop', { roomId: activeRoom.id, userId: session.user.id });
    }
  };

  const sendTextMessage = async (e) => {
    e?.preventDefault();
    if (!input.trim() || !activeRoom || sending) return;
    const content = input.trim();
    setInput('');
    stopTyping();
    setSending(true);
    try {
      const res = await fetch(`/api/chat/${activeRoom.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, type: 'TEXT' }),
      });
      if (!res.ok) { const d = await res.json(); toast.error(d.error); setInput(content); return; }
      const msg = await res.json();
      setMessages(prev => [...prev, msg]);
      socketRef.current?.emit('message:send', { roomId: activeRoom.id, message: msg });
      setRooms(prev => { const u = prev.map(r => r.id === activeRoom.id ? { ...r, messages: [msg] } : r); return u.sort((a,b) => new Date(b.messages?.[0]?.createdAt||b.createdAt) - new Date(a.messages?.[0]?.createdAt||a.createdAt)); });
    } finally { setSending(false); }
  };

  const sendFile = async (file, type) => {
    if (!file || !activeRoom) return;
    setShowAttach(false);

    // ── STEP 1: Show immediately with local blob URL ──────────────────────
    const blobUrl = URL.createObjectURL(file);
    const tempId = `temp_${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      _tempId: tempId,
      _uploading: true,
      chatRoomId: activeRoom.id,
      senderId: session.user.id,
      receiverId: '',
      content: file.name,
      type,
      fileUrl: blobUrl,
      fileName: file.name,
      fileSize: file.size,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      const formData = new FormData();
      formData.append('type', type);
      formData.append('fileName', file.name);
      formData.append('fileSize', String(file.size));

      if (type === 'IMAGE') {
        // ── Compress image client-side using Canvas ──────────────────────
        const compressed = await compressImage(file, 1200, 0.82);
        formData.append('base64', compressed.dataUrl);
        formData.append('mimeType', 'image/jpeg');
      } else {
        // Document — send as-is
        const maxSize = 15 * 1024 * 1024;
        if (file.size > maxSize) {
          toast.error('Max document size: 15MB');
          setMessages(prev => prev.filter(m => m._tempId !== tempId));
          URL.revokeObjectURL(blobUrl);
          return;
        }
        formData.append('file', file);
      }

      const res = await fetch(`/api/chat/${activeRoom.id}`, { method: 'POST', body: formData });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error || 'Upload failed');
        setMessages(prev => prev.filter(m => m._tempId !== tempId));
        URL.revokeObjectURL(blobUrl);
        return;
      }

      const realMsg = await res.json();
      // ── STEP 3: Replace optimistic with real message ──────────────────
      setMessages(prev => prev.map(m => m._tempId === tempId ? { ...realMsg } : m));
      URL.revokeObjectURL(blobUrl);
      socketRef.current?.emit('message:send', { roomId: activeRoom.id, message: realMsg });
      setRooms(prev => { const u = prev.map(r => r.id === activeRoom.id ? { ...r, messages: [realMsg] } : r); return u.sort((a,b) => new Date(b.messages?.[0]?.createdAt||b.createdAt) - new Date(a.messages?.[0]?.createdAt||a.createdAt)); });
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Upload failed. Try a smaller image.');
      setMessages(prev => prev.filter(m => m._tempId !== tempId));
      URL.revokeObjectURL(blobUrl);
    }
  };

  // ── Canvas image compression ──────────────────────────────────────────────
  const compressImage = (file, maxWidth = 1200, quality = 0.82) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve({ dataUrl, width, height });
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const sendLocation = () => {
    setShowAttach(false);
    setShowLocPicker(true);
  };

  const doSendLocation = async (locationType, durationHours) => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return; }
    setShowLocPicker(false);
    toast.loading('Getting your location…', { id: 'loc' });
    navigator.geolocation.getCurrentPosition(async (pos) => {
      toast.dismiss('loc');
      const { latitude, longitude } = pos.coords;
      const locationExpiry = locationType === 'live'
        ? new Date(Date.now() + durationHours * 3600000).toISOString()
        : null;
      const res = await fetch(`/api/chat/${activeRoom.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'LOCATION', latitude, longitude, locationType, locationExpiry }),
      });
      if (!res.ok) { toast.error('Failed to send location'); return; }
      const msg = await res.json();
      setMessages(prev => [...prev, msg]);
      socketRef.current?.emit('message:send', { roomId: activeRoom.id, message: msg });
      setRooms(prev => { const u = prev.map(r => r.id === activeRoom.id ? { ...r, messages: [msg] } : r); return u.sort((a,b) => new Date(b.messages?.[0]?.createdAt||b.createdAt) - new Date(a.messages?.[0]?.createdAt||a.createdAt)); });
      if (locationType === 'live') {
        const watchId = navigator.geolocation.watchPosition(async (p) => {
          if (locationExpiry && new Date() > new Date(locationExpiry)) {
            navigator.geolocation.clearWatch(watchId); return;
          }
          await fetch(`/api/chat/location/${msg.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
          });
          socketRef.current?.emit('location:update', { roomId: activeRoom.id, msgId: msg.id, latitude: p.coords.latitude, longitude: p.coords.longitude });
        }, null, { maximumAge: 30000, timeout: 10000 });
        setTimeout(() => navigator.geolocation.clearWatch(watchId), durationHours * 3600000);
        toast.success(`Live location active for ${durationHours}h`);
      }
    }, () => { toast.dismiss('loc'); toast.error('Location access denied'); });
  };

  const onEmojiClick = (emojiData) => {
    setInput(prev => prev + emojiData.emoji);
    inputRef.current?.focus();
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 pt-24"><div className="h-[600px] skeleton rounded-3xl" /></div>
    </div>
  );

  return (
    <div className="h-screen overflow-hidden bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Navbar />
      {/* Chat container — fills remaining height after navbar (64px) */}
      <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pb-4 flex flex-col overflow-hidden" style={{ paddingTop: '80px' }}>
        <div className="flex-1 flex gap-0 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">

          {/* ── Sidebar ── */}
          <div className={`${activeRoom ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-col border-r border-gray-100 dark:border-gray-700 overflow-hidden`}>
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
              <h2 className="font-bold text-lg">Messages</h2>
              <p className="text-xs text-gray-400 mt-0.5">{rooms.length} conversations</p>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0">
              {rooms.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageCircle className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm font-medium">No conversations yet</p>
                  <Link href="/interests" className="text-pink-500 text-xs mt-2 inline-block hover:underline">View Interests →</Link>
                </div>
              ) : rooms.map(room => {
                const other = getOtherUser(room);
                const lastMsg = room.messages?.[0];
                const online = isOnline(other?.id);
                return (
                  <button key={room.id} onClick={() => openRoom(room)}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left border-b border-gray-50 dark:border-gray-700/50 ${activeRoom?.id === room.id ? 'bg-pink-50 dark:bg-pink-900/10 border-l-2 border-l-pink-500' : ''}`}>
                    <div className="relative flex-shrink-0">
                      <div className="w-11 h-11 rounded-full overflow-hidden gradient-bg flex items-center justify-center text-white font-bold">
                        {other?.image
                          ? <SmartImage src={other.image} alt="" width={44} height={44} className="object-cover w-full h-full" />
                          : <span>{other?.name?.[0]}</span>
                        }
                      </div>
                      {online && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white dark:border-gray-800 rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm truncate ${unreadPerRoom[room.id] > 0 ? 'font-bold text-gray-900 dark:text-white' : 'font-semibold'}`}>{other?.name}</p>
                        {lastMsg && (
                          <span className="text-xs text-gray-400 flex-shrink-0 ml-1">
                            {formatMsgTime(lastMsg.createdAt)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className={`text-xs truncate ${unreadPerRoom[room.id] > 0 ? 'text-gray-700 dark:text-gray-200 font-medium' : 'text-gray-500'}`}>
                          {lastMsg?.type === 'IMAGE' ? '📷 Photo' : lastMsg?.type === 'DOCUMENT' ? '📄 Document' : lastMsg?.type === 'LOCATION' ? '📍 Location' : lastMsg?.content || 'Start chatting'}
                        </p>
                        {unreadPerRoom[room.id] > 0 && (
                          <span className="flex-shrink-0 ml-2 min-w-5 h-5 gradient-bg text-white text-xs rounded-full flex items-center justify-center px-1.5 font-bold">
                            {unreadPerRoom[room.id] > 99 ? '99+' : unreadPerRoom[room.id]}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Chat Area ── */}
          <div className={`${activeRoom ? 'flex' : 'hidden md:flex'} flex-1 flex-col min-w-0 min-h-0 overflow-hidden relative`}>
            {activeRoom ? (() => {
              const other = getOtherUser(activeRoom);
              const online = isOnline(other?.id);
              return (
                <>
                  {/* Header */}
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 z-10 flex-shrink-0">
                    <button onClick={() => setActiveRoom(null)} className="md:hidden p-1 text-gray-500"><ArrowLeft className="w-5 h-5" /></button>
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full overflow-hidden gradient-bg flex items-center justify-center text-white font-bold">
                        {other?.image ? <SmartImage src={other.image} alt="" width={40} height={40} className="object-cover w-full h-full" /> : <span>{other?.name?.[0]}</span>}
                      </div>
                      {online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-white dark:border-gray-800 rounded-full" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold">{other?.name}</p>
                        {other?.verificationBadge && <BadgeCheck className="w-4 h-4 text-blue-500" />}
                        {other?.isPremium && <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />}
                      </div>
                      <p className={`text-xs ${online ? 'text-green-500' : 'text-gray-400'}`}>
                        {otherTyping ? <span className="text-pink-500 animate-pulse">typing…</span> : online ? 'Online' : 'Offline'}
                      </p>
                    </div>
                    <Link href={`/profile/${other?.id}`} className="text-xs text-pink-500 border border-pink-200 dark:border-pink-800 px-3 py-1.5 rounded-xl hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors">
                      Profile
                    </Link>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-3 bg-gray-50 dark:bg-gray-900/50"
                    onClick={() => { setShowEmoji(false); setShowAttach(false); }}>
                    {messages.length === 0 && <div className="text-center py-10 text-gray-400 text-sm">Say hello! 👋</div>}
                    {messages.map((msg, idx) => {
                      const isMe = msg.senderId === session?.user?.id;
                      const showDate = idx === 0 || new Date(msg.createdAt) - new Date(messages[idx - 1]?.createdAt) > 5 * 60 * 1000;
                      return (
                        <div key={msg.id}>
                          {showDate && (
                            <div className="text-center my-3">
                              <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                                {format(new Date(msg.createdAt), 'MMM d, h:mm a')}
                              </span>
                            </div>
                          )}
                          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                            className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <MessageBubble msg={msg} isMe={isMe} />
                          </motion.div>
                        </div>
                      );
                    })}
                    <AnimatePresence>
                      {otherTyping && (
                        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex justify-start">
                          <div className="bg-white dark:bg-gray-700 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex gap-1 items-center">
                            {[0,1,2].map(i => (
                              <motion.div key={i} className="w-2 h-2 bg-gray-400 rounded-full"
                                animate={{ y: [0,-4,0] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }} />
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Location Picker Modal */}
                  <AnimatePresence>
                    {showLocPicker && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4"
                        onClick={() => setShowLocPicker(false)}>
                        <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
                          className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl"
                          onClick={e => e.stopPropagation()}>
                          {/* Header */}
                          <div className="gradient-bg px-5 py-4">
                            <h3 className="text-white font-bold text-lg">Share Location</h3>
                            <p className="text-white/70 text-xs mt-0.5">Choose what to share</p>
                          </div>

                          <div className="p-4 space-y-3">
                            {/* Current Location */}
                            <button onClick={() => doSendLocation('current', 0)}
                              className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-100 dark:border-gray-700 hover:border-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/10 transition-all group">
                              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-red-200 transition-colors">
                                <MapPin className="w-6 h-6 text-red-500" />
                              </div>
                              <div className="text-left">
                                <p className="font-semibold text-sm">Current Location</p>
                                <p className="text-xs text-gray-400 mt-0.5">Share your location once</p>
                              </div>
                            </button>

                            {/* Live Location */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 px-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Live Location</p>
                                <span className="text-xs bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full">Real-time</span>
                              </div>
                              <p className="text-xs text-gray-400 px-1">Your location updates automatically. Choose duration:</p>

                              {[
                                { hours: 1, label: '1 Hour', sub: 'Short trip or meetup', color: 'border-blue-200 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10', icon: '⏱️' },
                                { hours: 8, label: '8 Hours', sub: 'Half day sharing', color: 'border-purple-200 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/10', icon: '🕗' },
                                { hours: 24, label: '24 Hours', sub: 'Full day sharing', color: 'border-orange-200 hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/10', icon: '📅' },
                              ].map(opt => (
                                <button key={opt.hours} onClick={() => doSendLocation('live', opt.hours)}
                                  className={`w-full flex items-center gap-4 p-3.5 rounded-2xl border-2 transition-all group ${opt.color} dark:border-gray-700`}>
                                  <div className="w-10 h-10 bg-gray-50 dark:bg-gray-700 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                                    {opt.icon}
                                  </div>
                                  <div className="text-left flex-1">
                                    <p className="font-semibold text-sm">{opt.label}</p>
                                    <p className="text-xs text-gray-400">{opt.sub}</p>
                                  </div>
                                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse flex-shrink-0" />
                                </button>
                              ))}
                            </div>

                            <button onClick={() => setShowLocPicker(false)}
                              className="w-full py-2.5 text-sm text-gray-400 hover:text-gray-600 transition-colors">
                              Cancel
                            </button>
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Emoji Picker */}
                  <AnimatePresence>
                    {showEmoji && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-20 left-4 z-20 shadow-2xl rounded-2xl overflow-hidden">
                        <Suspense fallback={<div className="w-80 h-60 skeleton rounded-2xl" />}>
                          <EmojiPicker onEmojiClick={onEmojiClick} theme="auto" height={380} width={320} searchDisabled={false} />
                        </Suspense>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Attach menu */}
                  <AnimatePresence>
                    {showAttach && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-20 left-16 z-20 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-2 flex gap-2">
                        {[
                          { icon: ImageIcon, label: 'Photo', color: 'text-pink-500 bg-pink-50 dark:bg-pink-900/20', action: () => fileInputRef.current?.click() },
                          { icon: FileText, label: 'Document', color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20', action: () => docInputRef.current?.click() },
                          { icon: MapPin, label: 'Location', color: 'text-red-500 bg-red-50 dark:bg-red-900/20', action: sendLocation },
                        ].map(item => (
                          <button key={item.label} onClick={item.action}
                            className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>
                              <item.icon className="w-5 h-5" />
                            </div>
                            <span className="text-xs text-gray-500">{item.label}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Hidden file inputs */}
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                    onChange={e => { if (e.target.files?.[0]) sendFile(e.target.files[0], 'IMAGE'); e.target.value = ''; }} />
                  <input ref={docInputRef} type="file" accept=".pdf,.doc,.docx,.txt,.xls,.xlsx" className="hidden"
                    onChange={e => { if (e.target.files?.[0]) sendFile(e.target.files[0], 'DOCUMENT'); e.target.value = ''; }} />

                  {/* Input bar */}
                  <div className="flex items-end gap-2 p-3 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
                    <button onClick={() => { setShowAttach(p => !p); setShowEmoji(false); }}
                      className={`p-2.5 rounded-xl transition-colors flex-shrink-0 ${showAttach ? 'gradient-bg text-white' : 'text-gray-400 hover:text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/20'}`}>
                      <Paperclip className="w-5 h-5" />
                    </button>
                    <button onClick={() => { setShowEmoji(p => !p); setShowAttach(false); }}
                      className={`p-2.5 rounded-xl transition-colors flex-shrink-0 ${showEmoji ? 'gradient-bg text-white' : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'}`}>
                      <Smile className="w-5 h-5" />
                    </button>
                    <div className="flex-1 relative">
                      <textarea ref={inputRef} value={input} onChange={e => handleTyping(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendTextMessage(); } }}
                        rows={1} maxLength={1000}
                        className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-2xl bg-gray-50 dark:bg-gray-700 text-sm input-focus resize-none max-h-32 overflow-y-auto"
                        placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
                        style={{ minHeight: '44px' }}
                        onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px'; }}
                      />
                    </div>
                    <button onClick={sendTextMessage} disabled={sending || !input.trim()}
                      className="gradient-bg text-white p-2.5 rounded-xl hover:opacity-90 disabled:opacity-40 transition-all flex-shrink-0">
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </>
              );
            })() : (
              <div className="flex-1 flex items-center justify-center text-center p-8">
                <div>
                  <div className="w-20 h-20 gradient-bg rounded-full flex items-center justify-center mx-auto mb-4 opacity-20">
                    <MessageCircle className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-500">Select a conversation</h3>
                  <p className="text-gray-400 text-sm mt-1">Choose from your chats on the left</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 pt-24"><div className="h-[600px] skeleton rounded-3xl" /></div>
      </div>
    }>
      <ChatInner />
    </Suspense>
  );
}

