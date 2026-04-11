'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Send, Bot, User, Headphones, ChevronDown, Loader2, PhoneOff } from 'lucide-react';
import { useSession } from 'next-auth/react';

// ── Markdown-lite renderer ────────────────────────────────────────────────────
function renderMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-pink-400 underline hover:text-pink-300" target="_self">$1</a>')
    .replace(/\n/g, '<br/>');
}

// ── Message bubble ────────────────────────────────────────────────────────────
function Bubble({ msg }) {
  const isUser = msg.sender === 'user';
  const isAdmin = msg.sender === 'admin';

  return (
    <div className={`flex gap-2 mb-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
        isUser ? 'bg-pink-500' : isAdmin ? 'bg-purple-600' : 'bg-gray-600'
      }`}>
        {isUser ? <User className="w-3.5 h-3.5 text-white" /> :
         isAdmin ? <Headphones className="w-3.5 h-3.5 text-white" /> :
         <Bot className="w-3.5 h-3.5 text-white" />}
      </div>
      <div className={`max-w-[78%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
        isUser
          ? 'bg-pink-500 text-white rounded-tr-sm'
          : isAdmin
          ? 'bg-purple-700 text-white rounded-tl-sm'
          : 'bg-gray-700 text-gray-100 rounded-tl-sm'
      }`}>
        {isAdmin && <p className="text-xs text-purple-300 mb-1 font-semibold">Support Agent</p>}
        <span dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
        <p className={`text-xs mt-1 ${isUser ? 'text-pink-200' : 'text-gray-400'}`}>
          {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

// ── Quick reply buttons ───────────────────────────────────────────────────────
const QUICK_REPLIES = [
  { label: '📝 Register', text: 'register' },
  { label: '🔐 Login', text: 'login' },
  { label: '⭐ Premium', text: 'premium' },
  { label: '💑 Matches', text: 'matches' },
  { label: '💬 Chat', text: 'chat' },
  { label: '🛡️ Verify', text: 'verification' },
  { label: '💳 Payment', text: 'payment' },
  { label: '🧑‍💼 Agent', text: 'agent' },
];

// ── Main ChatBot component ────────────────────────────────────────────────────
export default function ChatBot() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [status, setStatus] = useState('bot'); // bot | live | ended
  const [initialized, setInitialized] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  // Init DB tables once
  useEffect(() => {
    fetch('/api/chatbot/init', { method: 'POST' }).catch(() => {});
  }, []);

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Poll for new messages when live agent session
  const pollMessages = useCallback(async () => {
    if (!sessionId || status !== 'live') return;
    try {
      const res = await fetch(`/api/chatbot/message?sessionId=${sessionId}`);
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
        if (data.session?.status === 'ended') {
          setStatus('ended');
          clearInterval(pollRef.current);
        }
      }
    } catch {}
  }, [sessionId, status]);

  useEffect(() => {
    if (status === 'live' && sessionId) {
      pollRef.current = setInterval(pollMessages, 3000);
    }
    return () => clearInterval(pollRef.current);
  }, [status, sessionId, pollMessages]);

  // Open chat — send greeting
  const handleOpen = async () => {
    setOpen(true);
    setUnread(0);
    if (initialized) return;
    setInitialized(true);
    setLoading(true);
    try {
      const res = await fetch('/api/chatbot/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'hi', userId: session?.user?.id }),
      });
      const data = await res.json();
      setSessionId(data.sessionId);
      setStatus(data.status);
      if (data.botReply) {
        setMessages([{ id: 'g1', sender: 'bot', content: data.botReply, createdAt: new Date() }]);
      }
    } catch {}
    setLoading(false);
  };

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');

    const userMsg = { id: Date.now(), sender: 'user', content: msg, createdAt: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch('/api/chatbot/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: msg, userId: session?.user?.id }),
      });
      const data = await res.json();

      if (data.sessionId) setSessionId(data.sessionId);
      if (data.status) setStatus(data.status);

      if (data.botReply) {
        setMessages(prev => [...prev, {
          id: Date.now() + 1, sender: 'bot', content: data.botReply, createdAt: new Date()
        }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now() + 1, sender: 'bot',
        content: '⚠️ Something went wrong. Please try again.',
        createdAt: new Date()
      }]);
    }
    setLoading(false);
  };

  const endChat = async () => {
    if (!sessionId) return;
    await fetch('/api/chatbot/support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, action: 'end' }),
    });
    setStatus('ended');
    setMessages(prev => [...prev, {
      id: Date.now(), sender: 'bot',
      content: '✅ Chat has been ended. Thank you for contacting us!',
      createdAt: new Date()
    }]);
  };

  const resetChat = () => {
    setMessages([]);
    setSessionId(null);
    setStatus('bot');
    setInitialized(false);
    setInput('');
    handleOpen();
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => open ? setOpen(false) : handleOpen()}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 gradient-bg rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform"
        aria-label="Open chat support"
      >
        {open ? <X className="w-6 h-6 text-white" /> : <MessageCircle className="w-6 h-6 text-white" />}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-24px)] bg-gray-900 rounded-3xl shadow-2xl border border-gray-700 flex flex-col overflow-hidden"
          style={{ height: '520px' }}>

          {/* Header */}
          <div className="gradient-bg px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
              {status === 'live' ? <Headphones className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">
                {status === 'live' ? 'Support Agent' : 'Milan Assistant'}
              </p>
              <p className="text-white/70 text-xs">
                {status === 'live' ? '🟢 Agent connected' : status === 'ended' ? '⚫ Chat ended' : '🤖 AI Support'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {status === 'live' && (
                <button onClick={endChat} title="End chat"
                  className="p-1.5 bg-white/20 hover:bg-red-500 rounded-full transition-colors">
                  <PhoneOff className="w-4 h-4 text-white" />
                </button>
              )}
              {status === 'ended' && (
                <button onClick={resetChat} title="New chat"
                  className="text-xs bg-white/20 hover:bg-white/30 text-white px-2 py-1 rounded-full transition-colors">
                  New Chat
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1.5 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
                <ChevronDown className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-thin scrollbar-thumb-gray-700">
            {messages.length === 0 && loading && (
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading...
              </div>
            )}
            {messages.map((msg, i) => <Bubble key={msg.id || i} msg={msg} />)}
            {loading && messages.length > 0 && (
              <div className="flex gap-2 mb-3">
                <div className="w-7 h-7 rounded-full bg-gray-600 flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="bg-gray-700 px-3 py-2 rounded-2xl rounded-tl-sm">
                  <div className="flex gap-1 items-center h-5">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick replies — only in bot mode */}
          {status === 'bot' && messages.length > 0 && (
            <div className="px-3 pb-2 flex gap-1.5 flex-wrap">
              {QUICK_REPLIES.map(qr => (
                <button key={qr.text} onClick={() => sendMessage(qr.text)}
                  className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 px-2.5 py-1 rounded-full transition-colors whitespace-nowrap">
                  {qr.label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          {status !== 'ended' && (
            <div className="p-3 border-t border-gray-700 flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder={status === 'live' ? 'Message agent...' : 'Ask anything...'}
                className="flex-1 bg-gray-800 text-white text-sm px-3 py-2 rounded-xl border border-gray-600 focus:outline-none focus:border-pink-500 placeholder-gray-500"
                disabled={loading}
              />
              <button onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                className="w-9 h-9 gradient-bg rounded-xl flex items-center justify-center disabled:opacity-40 hover:opacity-90 transition-opacity flex-shrink-0">
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          )}

          {status === 'ended' && (
            <div className="p-3 border-t border-gray-700 text-center">
              <button onClick={resetChat}
                className="text-sm gradient-bg text-white px-4 py-2 rounded-xl hover:opacity-90 transition-opacity">
                Start New Chat
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
