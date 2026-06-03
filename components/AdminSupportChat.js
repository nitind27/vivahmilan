'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { MessageCircle, Send, Bot, User, Headphones, PhoneOff, RefreshCw, Clock, CheckCircle, Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import { connectSocket } from '@/lib/socket';

function renderMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-vd-primary underline" target="_self">$1</a>')
    .replace(/\n/g, '<br/>');
}

function Bubble({ msg }) {
  const isUser = msg.sender === 'user';
  const isAdmin = msg.sender === 'admin';
  return (
    <div className={`flex gap-2 mb-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
        isUser ? 'bg-vd-primary' : isAdmin ? 'bg-vd-accent' : 'bg-gray-600'
      }`}>
        {isUser ? <User className="w-3.5 h-3.5 text-white" /> :
         isAdmin ? <Headphones className="w-3.5 h-3.5 text-white" /> :
         <Bot className="w-3.5 h-3.5 text-white" />}
      </div>
      <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
        isUser ? 'bg-gray-700 text-gray-100 rounded-tr-sm' :
        isAdmin ? 'bg-vd-accent text-white rounded-tl-sm' :
        'bg-gray-800 text-gray-300 rounded-tl-sm'
      }`}>
        {isAdmin && <p className="text-xs text-vd-primary-light mb-1 font-semibold">You (Admin)</p>}
        {!isUser && !isAdmin && <p className="text-xs text-gray-500 mb-1">Bot</p>}
        <span dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
        <p className="text-xs mt-1 text-gray-500">
          {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

export default function AdminSupportChat() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [sessions, setSessions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);
  const selectedIdRef = useRef(null);

  useEffect(() => {
    selectedIdRef.current = selected?.id || null;
  }, [selected?.id]);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/chatbot/support', { cache: 'no-store' });
      const data = await res.json();
      if (!Array.isArray(data)) return;
      setSessions(data);

      const sessionParam = searchParams.get('session');
      if (sessionParam && !selectedIdRef.current) {
        const match = data.find((s) => s.id === sessionParam);
        if (match) {
          setSelected(match);
          selectedIdRef.current = match.id;
        }
      } else if (selectedIdRef.current) {
        const current = data.find((s) => s.id === selectedIdRef.current);
        if (current) setSelected((prev) => (prev ? { ...prev, ...current } : current));
      }
    } catch {}
  }, [searchParams]);

  const fetchMessages = useCallback(async (sid) => {
    if (!sid) return;
    try {
      const res = await fetch(`/api/chatbot/support?sessionId=${sid}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.messages) setMessages(data.messages);
      if (data.session) {
        setSessions((prev) => prev.map((s) => (s.id === sid ? { ...s, ...data.session } : s)));
        setSelected((prev) => (prev?.id === sid ? { ...prev, ...data.session } : prev));
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 4000);
    return () => clearInterval(interval);
  }, [fetchSessions]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    clearInterval(pollRef.current);
    if (selected?.id) {
      fetchMessages(selected.id);
      pollRef.current = setInterval(() => fetchMessages(selected.id), 2500);
    }
    return () => clearInterval(pollRef.current);
  }, [selected?.id, fetchMessages]);

  useEffect(() => {
    if (!session?.user?.id || session.user.role !== 'ADMIN') return;

    const socket = connectSocket(session.user.id);

    const onSupportUpdate = (payload) => {
      if (!payload?.sessionId) return;
      fetchSessions();

      const isActive = selectedIdRef.current === payload.sessionId;
      if (isActive) {
        fetchMessages(payload.sessionId);
      } else {
        toast(payload.title || 'New support activity', {
          icon: '💬',
          duration: 5000,
        });
      }

      window.dispatchEvent(new Event('admin-stats-refresh'));
    };

    const onAdminNotif = ({ notification }) => {
      const link = notification?.link || '';
      if (!link.includes('/admin/support')) return;
      fetchSessions();
      if (!notification?.link?.includes(`session=${selectedIdRef.current}`)) {
        toast(notification.title || 'Support notification', {
          icon: '🔔',
          duration: 5000,
        });
      }
    };

    socket.on('admin:support:update', onSupportUpdate);
    socket.on('admin:notification', onAdminNotif);

    return () => {
      socket.off('admin:support:update', onSupportUpdate);
      socket.off('admin:notification', onAdminNotif);
    };
  }, [session, fetchSessions, fetchMessages]);

  const selectSession = (s) => {
    setSelected(s);
    selectedIdRef.current = s.id;
    setMessages([]);
    router.replace(`/admin/support?session=${s.id}`, { scroll: false });
  };

  const sendMessage = async () => {
    const msg = input.trim();
    if (!msg || !selected || sending) return;
    setInput('');
    setSending(true);
    try {
      await fetch('/api/chatbot/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: selected.id, message: msg }),
      });
      await fetchMessages(selected.id);
      await fetchSessions();
    } catch {
      toast.error('Failed to send message');
    }
    setSending(false);
  };

  const endChat = async () => {
    if (!selected) return;
    await fetch('/api/chatbot/support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: selected.id, action: 'end' }),
    });
    await fetchMessages(selected.id);
    await fetchSessions();
    toast.success('Chat ended');
  };

  const liveSessions = sessions.filter((s) => s.status === 'live');
  const botSessions = sessions.filter((s) => s.status === 'bot');
  const awaitingReply = sessions.filter((s) => s.needsReply).length;

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-3">
      {awaitingReply > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-green-500/30 bg-green-500/10 text-green-300 text-sm shrink-0">
          <Bell className="w-4 h-4 shrink-0" />
          <span>
            <strong>{awaitingReply}</strong> chat{awaitingReply > 1 ? 's' : ''} waiting for your reply — updates appear live.
          </span>
        </div>
      )}

      <div className="flex flex-1 min-h-[min(720px,calc(100vh-11rem))] bg-gray-900 rounded-2xl border border-gray-700 overflow-hidden">
        {/* Sidebar */}
        <div className="w-72 border-r border-gray-700 flex flex-col min-h-0 shrink-0">
          <div className="p-4 border-b border-gray-700 flex items-center justify-between shrink-0">
            <h3 className="text-white font-semibold text-sm">Support Chats</h3>
            <button type="button" onClick={fetchSessions} className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors" title="Refresh">
              <RefreshCw className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            {liveSessions.length > 0 && (
              <div>
                <p className="px-4 py-2 text-xs text-green-400 font-semibold uppercase tracking-wider sticky top-0 bg-gray-900 z-[1]">
                  🟢 Live ({liveSessions.length})
                </p>
                {liveSessions.map((s) => (
                  <SessionItem key={s.id} s={s} selected={selected} onSelect={selectSession} />
                ))}
              </div>
            )}
            {botSessions.length > 0 && (
              <div>
                <p className="px-4 py-2 text-xs text-gray-500 font-semibold uppercase tracking-wider sticky top-0 bg-gray-900 z-[1]">
                  🤖 Bot ({botSessions.length})
                </p>
                {botSessions.map((s) => (
                  <SessionItem key={s.id} s={s} selected={selected} onSelect={selectSession} />
                ))}
              </div>
            )}
            {sessions.length === 0 && (
              <div className="p-6 text-center text-gray-500 text-sm">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-700" />
                No active chats
              </div>
            )}
          </div>
        </div>

        {/* Chat area */}
        {selected ? (
          <div className="flex-1 flex flex-col min-h-0 min-w-0">
            <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between shrink-0 bg-gray-900">
              <div className="min-w-0">
                <p className="text-white font-semibold text-sm truncate">
                  {selected.userName || 'Guest'}
                  {selected.userEmail ? ` · ${selected.userEmail}` : ''}
                </p>
                <p className="text-xs text-gray-400">
                  {selected.status === 'live' ? '🟢 Live session' :
                   selected.status === 'ended' ? '⚫ Ended' : '🤖 Bot session'}
                  {' · '}Lang: {selected.language?.toUpperCase() || 'EN'}
                </p>
              </div>
              {selected.status === 'live' && (
                <button type="button" onClick={endChat}
                  className="flex items-center gap-1.5 text-xs bg-red-500/20 hover:bg-red-500/40 text-red-400 px-3 py-1.5 rounded-xl transition-colors shrink-0 ml-2">
                  <PhoneOff className="w-3.5 h-3.5" /> End Chat
                </button>
              )}
              {selected.status === 'ended' && (
                <span className="flex items-center gap-1 text-xs text-gray-500 shrink-0">
                  <CheckCircle className="w-3.5 h-3.5" /> Ended
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 min-h-0">
              {messages.map((msg, i) => <Bubble key={msg.id || i} msg={msg} />)}
              <div ref={bottomRef} />
            </div>

            {selected.status !== 'ended' && (
              <div className="shrink-0 p-3 border-t border-gray-700 bg-gray-900 flex gap-2 items-center relative z-20">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Type your reply to the user…"
                  className="flex-1 min-w-0 bg-gray-800 text-white text-sm px-3 py-2.5 rounded-xl border border-gray-600 focus:outline-none focus:border-vd-primary placeholder-gray-500"
                  disabled={sending}
                />
                <button
                  type="button"
                  onClick={sendMessage}
                  disabled={sending || !input.trim()}
                  className="shrink-0 w-10 h-10 vd-gradient-gold rounded-xl flex items-center justify-center disabled:opacity-40 hover:opacity-90 transition-opacity"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 min-h-0">
            <div className="text-center px-6">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-700" />
              <p className="text-sm font-medium text-gray-400">Select a chat from the list</p>
              <p className="text-xs text-gray-600 mt-1">Live sessions and new messages update automatically</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SessionItem({ s, selected, onSelect }) {
  const time = s.lastMessage?.createdAt
    ? new Date(s.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <button
      type="button"
      onClick={() => onSelect(s)}
      className={`w-full px-4 py-3 text-left hover:bg-gray-800 transition-colors border-b border-gray-800 ${
        selected?.id === s.id ? 'bg-gray-800 border-l-2 border-l-vd-primary' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full vd-gradient-gold flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-bold">{(s.userName || 'G')[0].toUpperCase()}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-xs font-medium truncate">{s.userName || 'Guest'}</p>
          <p className={`text-xs truncate ${s.needsReply ? 'text-amber-300 font-medium' : 'text-gray-500'}`}>
            {s.lastMessage?.content || 'No messages'}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {s.needsReply ? (
            <span className="text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">New</span>
          ) : (
            <span className={`w-2 h-2 rounded-full ${s.status === 'live' ? 'bg-green-400' : 'bg-gray-600'}`} />
          )}
          {time && (
            <span className="text-gray-600 text-[10px] flex items-center gap-0.5">
              <Clock className="w-3 h-3" /> {time}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
