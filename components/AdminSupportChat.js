'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, Send, Bot, User, Headphones, PhoneOff, RefreshCw, Clock, CheckCircle } from 'lucide-react';

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
  const [sessions, setSessions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/chatbot/support');
      const data = await res.json();
      if (Array.isArray(data)) setSessions(data);
    } catch {}
  }, []);

  const fetchMessages = useCallback(async (sid) => {
    if (!sid) return;
    try {
      const res = await fetch(`/api/chatbot/support?sessionId=${sid}`);
      const data = await res.json();
      if (data.messages) setMessages(data.messages);
      if (data.session) {
        setSessions(prev => prev.map(s => s.id === sid ? { ...s, ...data.session } : s));
        setSelected(prev => prev?.id === sid ? { ...prev, ...data.session } : prev);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 5000);
    return () => clearInterval(interval);
  }, [fetchSessions]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    clearInterval(pollRef.current);
    if (selected?.id) {
      fetchMessages(selected.id);
      pollRef.current = setInterval(() => fetchMessages(selected.id), 3000);
    }
    return () => clearInterval(pollRef.current);
  }, [selected?.id, fetchMessages]);

  const selectSession = (s) => {
    setSelected(s);
    setMessages([]);
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
    } catch {}
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
  };

  const liveSessions = sessions.filter(s => s.status === 'live');
  const botSessions = sessions.filter(s => s.status === 'bot');

  return (
    <div className="flex h-[600px] bg-gray-900 rounded-2xl border border-gray-700 overflow-hidden">
      {/* Sidebar */}
      <div className="w-72 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h3 className="text-white font-semibold text-sm">Support Chats</h3>
          <button onClick={fetchSessions} className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors">
            <RefreshCw className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {liveSessions.length > 0 && (
            <div>
              <p className="px-4 py-2 text-xs text-green-400 font-semibold uppercase tracking-wider">
                🟢 Live ({liveSessions.length})
              </p>
              {liveSessions.map(s => (
                <SessionItem key={s.id} s={s} selected={selected} onSelect={selectSession} />
              ))}
            </div>
          )}
          {botSessions.length > 0 && (
            <div>
              <p className="px-4 py-2 text-xs text-gray-500 font-semibold uppercase tracking-wider">
                🤖 Bot ({botSessions.length})
              </p>
              {botSessions.map(s => (
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
        <div className="flex-1 flex flex-col">
          {/* Chat header */}
          <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
            <div>
              <p className="text-white font-semibold text-sm">
                {selected.userName || 'Guest'} {selected.userEmail ? `(${selected.userEmail})` : ''}
              </p>
              <p className="text-xs text-gray-400">
                {selected.status === 'live' ? '🟢 Live session' :
                 selected.status === 'ended' ? '⚫ Ended' : '🤖 Bot session'}
                {' · '}Lang: {selected.language?.toUpperCase() || 'EN'}
              </p>
            </div>
            {selected.status === 'live' && (
              <button onClick={endChat}
                className="flex items-center gap-1.5 text-xs bg-red-500/20 hover:bg-red-500/40 text-red-400 px-3 py-1.5 rounded-xl transition-colors">
                <PhoneOff className="w-3.5 h-3.5" /> End Chat
              </button>
            )}
            {selected.status === 'ended' && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <CheckCircle className="w-3.5 h-3.5" /> Ended
              </span>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4">
            {messages.map((msg, i) => <Bubble key={msg.id || i} msg={msg} />)}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          {selected.status !== 'ended' && (
            <div className="p-3 border-t border-gray-700 flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Reply to user..."
                className="flex-1 bg-gray-800 text-white text-sm px-3 py-2 rounded-xl border border-gray-600 focus:outline-none focus:border-vd-primary placeholder-gray-500"
                disabled={sending}
              />
              <button onClick={sendMessage} disabled={sending || !input.trim()}
                className="w-9 h-9 vd-gradient-gold rounded-xl flex items-center justify-center disabled:opacity-40">
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-700" />
            <p className="text-sm">Select a chat to view</p>
          </div>
        </div>
      )}
    </div>
  );
}

function SessionItem({ s, selected, onSelect }) {
  return (
    <button
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
          <p className="text-gray-500 text-xs truncate">{s.lastMessage?.content || 'No messages'}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`w-2 h-2 rounded-full ${s.status === 'live' ? 'bg-green-400' : 'bg-gray-600'}`} />
          <span className="text-gray-600 text-xs">
            <Clock className="w-3 h-3 inline" />
          </span>
        </div>
      </div>
    </button>
  );
}
