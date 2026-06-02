'use client';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  MessageCircle, X, Send, Bot, User, Headphones, ChevronDown, Loader2, PhoneOff,
  Search, Sparkles, HelpCircle, ChevronUp,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { acceptsFunctional, hasConsentChoice } from '@/lib/cookieConsent';
import {
  getQuickCategories, getPopularQuestions, getGreetingText, getDefaultFollowUps,
  getNumberedMenu, getContextualTips, searchSuggestions,
} from '@/lib/supportAgent';

const STORAGE_KEY = 'vd-support-session';

export function normalizePricing(text) {
  return text.replace(/\$(\d+)/g, '₹$1');
}

function renderMarkdown(text) {
  if (!text) return '';
  return normalizePricing(text)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-vd-primary underline hover:text-vd-primary-dark font-medium" target="_self">$1</a>')
    .replace(/\n/g, '<br/>');
}

function saveSessionId(id) {
  if (id && typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, id);
}

function ActionButtons({ actions, onNavigate }) {
  if (!actions?.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-1.5 ml-9">
      {actions.map((a) => (
        <Link key={a.href} href={a.href} onClick={onNavigate}
          className="text-xs bg-vd-accent-soft hover:bg-vd-accent/30 text-vd-primary-dark border border-vd-border px-2.5 py-1 rounded-full transition-colors font-medium">
          → {a.label}
        </Link>
      ))}
    </div>
  );
}

function FollowUpChips({ items, onSelect }) {
  if (!items?.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-1.5 ml-9">
      {items.map((f) => (
        <button key={f.text} type="button" onClick={() => onSelect(f.text)}
          className="text-xs bg-vd-bg-section hover:bg-vd-accent-soft text-vd-text-sub border border-vd-border px-2.5 py-1 rounded-full transition-colors">
          {f.label}
        </button>
      ))}
    </div>
  );
}

function Bubble({ msg, onNavigate, onSelect }) {
  const isUser = msg.sender === 'user';
  const isAdmin = msg.sender === 'admin';
  const isBot = !isUser && !isAdmin;

  return (
    <div className="mb-2">
      <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
          isUser ? 'bg-vd-primary' : isAdmin ? 'bg-vd-accent' : 'bg-vd-accent-soft'
        }`}>
          {isUser ? <User className="w-3.5 h-3.5 text-white" /> :
           isAdmin ? <Headphones className="w-3.5 h-3.5 text-white" /> :
           <Bot className="w-3.5 h-3.5 text-vd-primary" />}
        </div>
        <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
          isUser ? 'bg-vd-primary text-white rounded-tr-sm'
          : isAdmin ? 'bg-vd-accent text-white rounded-tl-sm'
          : 'bg-vd-bg-section text-vd-text-heading border border-vd-border rounded-tl-sm shadow-sm'
        }`}>
          {isAdmin && <p className="text-xs text-white/80 mb-1 font-semibold">Live Agent</p>}
          {isBot && (
            <p className="text-xs text-vd-text-light mb-1 font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-vd-primary" /> Support Agent
            </p>
          )}
          <span dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
          <p className={`text-xs mt-1 ${isUser ? 'text-white/70' : 'text-vd-text-light'}`}>
            {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
      {isBot && msg.actions?.length > 0 && <ActionButtons actions={msg.actions} onNavigate={onNavigate} />}
      {isBot && msg.followUps?.length > 0 && <FollowUpChips items={msg.followUps} onSelect={onSelect} />}
    </div>
  );
}

function HelpMenuPanel({ lang, categories, popular, numbered, onSelect, onClose }) {
  return (
    <div className="mx-1 mb-2 p-3 bg-vd-bg-section border border-vd-border rounded-2xl shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-vd-text-heading uppercase tracking-wide flex items-center gap-1">
          <HelpCircle className="w-3.5 h-3.5 text-vd-primary" /> Help Menu
        </p>
        <button type="button" onClick={onClose} className="text-vd-text-light hover:text-vd-text-heading">
          <ChevronUp className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {numbered.map((item) => (
          <button key={item.n} type="button" onClick={() => onSelect(item.text)}
            className="text-xs bg-vd-bg-alt hover:bg-vd-accent-soft border border-vd-border text-vd-text-sub px-1.5 py-2 rounded-xl transition-colors text-center leading-tight">
            <span className="text-vd-primary font-bold">{item.n}</span>
            <span className="block mt-0.5">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {categories.map((c) => (
          <button key={c.text} type="button" onClick={() => onSelect(c.text)}
            className="text-xs bg-vd-bg-alt hover:bg-vd-accent-soft border border-vd-border text-vd-text-sub px-2 py-2 rounded-xl transition-colors text-center leading-tight">
            <span className="block text-base mb-0.5">{c.icon}</span>
            {c.label}
          </button>
        ))}
      </div>

      <div className="space-y-1 max-h-32 overflow-y-auto">
        {popular.map((p) => (
          <button key={p.text} type="button" onClick={() => onSelect(p.text)}
            className="w-full text-left text-xs bg-vd-bg-alt hover:bg-vd-accent-soft text-vd-text-sub px-3 py-2 rounded-lg transition-colors flex items-center gap-2 border border-vd-border">
            <Search className="w-3 h-3 text-vd-primary flex-shrink-0" />
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ChatBot() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [status, setStatus] = useState('bot');
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [welcomeBack, setWelcomeBack] = useState(false);
  const [chatAllowed, setChatAllowed] = useState(false);
  const [suggestLiveAgent, setSuggestLiveAgent] = useState(false);
  const [helpOpen, setHelpOpen] = useState(true);
  const [lang, setLang] = useState('en');
  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  const categories = useMemo(() => getQuickCategories(lang), [lang]);
  const popular = useMemo(() => getPopularQuestions(lang), [lang]);
  const numbered = useMemo(() => getNumberedMenu(lang), [lang]);
  const pageContext = useMemo(() => getContextualTips(pathname, lang), [pathname, lang]);
  const typeahead = useMemo(() => searchSuggestions(input, lang, 5), [input, lang]);

  useEffect(() => {
    const sync = () => setChatAllowed(hasConsentChoice() && acceptsFunctional());
    sync();
    window.addEventListener('vd-cookie-consent', sync);
    return () => window.removeEventListener('vd-cookie-consent', sync);
  }, []);

  useEffect(() => { fetch('/api/chatbot/init', { method: 'POST' }).catch(() => {}); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, helpOpen, suggestLiveAgent]);

  const pollMessages = useCallback(async () => {
    if (!sessionId) return;
    try {
      const res = await fetch(`/api/chatbot/message?sessionId=${sessionId}`);
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages.map((m) => ({ ...m, followUps: m.sender === 'bot' ? getDefaultFollowUps(lang) : undefined })));
        if (data.session?.status) setStatus(data.session.status);
        if (data.session?.status === 'ended') clearInterval(pollRef.current);
      }
    } catch {}
  }, [sessionId, lang]);

  useEffect(() => {
    if (status === 'live' && sessionId && open) {
      pollRef.current = setInterval(pollMessages, 3000);
    }
    return () => clearInterval(pollRef.current);
  }, [status, sessionId, open, pollMessages]);

  useEffect(() => {
    if (session?.user?.id && sessionId) {
      fetch('/api/chatbot/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'attach', sessionId, userId: session.user.id }),
      }).catch(() => {});
    }
  }, [session?.user?.id, sessionId]);

  const buildGreetingMsg = () => ({
    id: 'local-greeting',
    sender: 'bot',
    content: getGreetingText(lang, { userName: session?.user?.name, isPremium: session?.user?.isPremium }),
    followUps: getDefaultFollowUps(lang),
    createdAt: new Date(),
  });

  const loadSavedSession = async () => {
    setLoading(true);
    try {
      const guestId = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : '';
      const res = await fetch(`/api/chatbot/session?sessionId=${encodeURIComponent(guestId || '')}`);
      const data = await res.json();

      if (data.session && data.messages?.length > 0) {
        setSessionId(data.session.id);
        setStatus(data.session.status);
        setMessages(data.messages);
        saveSessionId(data.session.id);
        setWelcomeBack(true);
        setHelpOpen(false);
      } else {
        setMessages([buildGreetingMsg()]);
        setSessionId(null);
        setStatus('bot');
        setHelpOpen(true);
      }
    } catch {
      setMessages([buildGreetingMsg()]);
    }
    setSessionLoaded(true);
    setLoading(false);
  };

  const handleOpen = async () => {
    setOpen(true);
    if (!sessionLoaded) await loadSavedSession();
  };

  const applySession = (data) => {
    if (data.sessionId) { setSessionId(data.sessionId); saveSessionId(data.sessionId); }
    if (data.status) setStatus(data.status);
    if (data.messages) setMessages(data.messages);
  };

  const escalateToAgent = async () => {
    setLoading(true);
    setSuggestLiveAgent(false);
    try {
      const res = await fetch('/api/chatbot/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'escalate', sessionId, userId: session?.user?.id }),
      });
      const data = await res.json();
      applySession(data);
      if (data.messages) setMessages(data.messages);
    } catch {}
    setLoading(false);
    setHelpOpen(false);
  };

  const applyBotResponse = (data) => {
    if (data.sessionId) { setSessionId(data.sessionId); saveSessionId(data.sessionId); }
    if (data.status) setStatus(data.status);
    if (data.suggestLiveAgent) setSuggestLiveAgent(true);
    if (data.botReply) {
      setMessages((prev) => [...prev, {
        id: Date.now() + 1,
        sender: 'bot',
        content: data.botReply,
        followUps: data.followUps || [],
        actions: data.actions || [],
        createdAt: new Date(),
      }]);
    }
    setHelpOpen(false);
  };

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    if (msg === '__escalate__') { setInput(''); await escalateToAgent(); return; }

    setInput('');
    setSuggestLiveAgent(false);
    setWelcomeBack(false);

    setMessages((prev) => [...prev, { id: Date.now(), sender: 'user', content: msg, createdAt: new Date() }]);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 350));

    try {
      const res = await fetch('/api/chatbot/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: msg, userId: session?.user?.id }),
      });
      const data = await res.json();
      if (data.needsNewChat) {
        setStatus('ended');
        setMessages((prev) => [...prev, {
          id: Date.now() + 1, sender: 'bot',
          content: 'This chat ended. Tap **Start New Chat** to continue.',
          createdAt: new Date(),
        }]);
      } else {
        applyBotResponse(data);
      }
    } catch {
      setMessages((prev) => [...prev, {
        id: Date.now() + 1, sender: 'bot',
        content: '⚠️ Something went wrong. Please try again or connect live agent.',
        followUps: [{ label: '🧑‍💼 Live Agent', text: '__escalate__' }],
        createdAt: new Date(),
      }]);
    }
    setLoading(false);
  };

  const resetChat = async () => {
    setLoading(true);
    setSuggestLiveAgent(false);
    setWelcomeBack(false);
    try {
      const res = await fetch('/api/chatbot/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'new', sessionId, userId: session?.user?.id }),
      });
      const data = await res.json();
      applySession(data);
      if (data.messages) {
        setMessages(data.messages.map((m, i) => i === data.messages.length - 1 && m.sender === 'bot'
          ? { ...m, followUps: getDefaultFollowUps(lang) } : m));
      }
      setHelpOpen(true);
    } catch {
      setMessages([buildGreetingMsg()]);
      setSessionId(null);
      setStatus('bot');
    }
    setLoading(false);
  };

  const endChat = async () => {
    if (!sessionId) return;
    await fetch('/api/chatbot/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'end', sessionId }),
    }).catch(() => {});
    setStatus('ended');
    setSuggestLiveAgent(false);
    setMessages((prev) => [...prev, {
      id: Date.now(), sender: 'bot',
      content: '✅ Chat ended. Thank you for contacting Vivah Dwar!',
      createdAt: new Date(),
    }]);
  };

  const isHidden = pathname === '/chat' || pathname?.startsWith('/chat');
  if (isHidden || !chatAllowed) return null;

  return (
    <>
      <button type="button" onClick={() => (open ? setOpen(false) : handleOpen())}
        className="fixed bottom-6 right-4 sm:right-6 z-40 w-14 h-14 vd-gradient-gold rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform"
        aria-label="Open support agent">
        {open ? <X className="w-6 h-6 text-white" /> : <MessageCircle className="w-6 h-6 text-white" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-2 sm:right-6 z-40 w-[calc(100vw-16px)] sm:w-[400px] max-w-[400px] bg-vd-bg-card rounded-3xl shadow-2xl border border-vd-border flex flex-col overflow-hidden"
          style={{ height: '580px', maxHeight: 'calc(100vh - 110px)' }}>

          {/* Header */}
          <div className="bg-vd-bg-section border-b border-vd-border px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 bg-vd-accent-soft rounded-full flex items-center justify-center flex-shrink-0">
              {status === 'live' ? <Headphones className="w-5 h-5 text-vd-primary" /> : <Bot className="w-5 h-5 text-vd-primary" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-vd-text-heading font-semibold text-sm truncate">
                {status === 'live' ? 'Live Support Agent' : 'Vivah Dwar Support Agent'}
              </p>
              <p className="text-vd-text-sub text-xs truncate">
                {status === 'live' ? '🟢 Agent connected' : status === 'ended' ? '⚫ Chat ended' : '🤖 Smart help · Ask anything'}
              </p>
            </div>
            {status === 'bot' && (
              <button type="button" onClick={resetChat} className="text-[10px] bg-vd-bg-alt hover:bg-vd-accent-soft text-vd-text-sub px-2 py-1 rounded-full border border-vd-border">
                New
              </button>
            )}
            {status === 'live' && (
              <button type="button" onClick={endChat} className="p-1.5 bg-vd-bg-alt hover:bg-red-50 rounded-full border border-vd-border">
                <PhoneOff className="w-4 h-4 text-red-500" />
              </button>
            )}
            <button type="button" onClick={() => setOpen(false)} className="p-1.5 bg-vd-bg-alt hover:bg-vd-accent-soft rounded-full border border-vd-border">
              <ChevronDown className="w-4 h-4 text-vd-text-sub" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 bg-vd-bg">
            {loading && messages.length === 0 && (
              <div className="flex items-center gap-2 text-vd-text-sub text-sm p-2">
                <Loader2 className="w-4 h-4 animate-spin text-vd-primary" /> Loading your chat...
              </div>
            )}

            {welcomeBack && status === 'bot' && (
              <div className="mb-2 px-3 py-2 bg-vd-accent-soft/50 border border-vd-border rounded-xl text-xs text-vd-text-sub">
                👋 Welcome back{session?.user?.name ? `, ${session.user.name.split(' ')[0]}` : ''}! Your previous chat is restored. Continue or ask something new.
              </div>
            )}

            {pageContext && status === 'bot' && (
              <div className="mb-2 px-3 py-2 bg-vd-bg-section border border-vd-border rounded-xl text-xs text-vd-text-sub shadow-sm">
                <span dangerouslySetInnerHTML={{ __html: renderMarkdown(pageContext.tip) }} />
                {pageContext.quick?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {pageContext.quick.map((q) => (
                      <button key={q.text} type="button" onClick={() => sendMessage(q.text)}
                        className="text-[10px] bg-vd-accent-soft text-vd-primary-dark px-2 py-0.5 rounded-full border border-vd-border hover:bg-vd-accent/30">
                        {q.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {messages.map((msg, i) => (
              <Bubble key={msg.id || i} msg={msg} onNavigate={() => setOpen(false)} onSelect={sendMessage} />
            ))}

            {suggestLiveAgent && status === 'bot' && !loading && (
              <div className="mt-2 ml-9 mr-2">
                <button type="button" onClick={escalateToAgent}
                  className="w-full text-sm font-semibold vd-gradient-gold text-white px-4 py-2.5 rounded-xl hover:opacity-90 flex items-center justify-center gap-2">
                  <Headphones className="w-4 h-4" /> Connect Live Agent
                </button>
              </div>
            )}

            {loading && messages.length > 0 && (
              <div className="flex gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-vd-accent-soft flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 text-vd-primary" />
                </div>
                <div className="bg-vd-bg-section border border-vd-border px-3 py-2 rounded-2xl rounded-tl-sm">
                  <div className="flex gap-1 items-center h-5">
                    {[0, 150, 300].map((d) => (
                      <span key={d} className="w-2 h-2 bg-vd-primary/50 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {status === 'bot' && helpOpen && !loading && (
              <HelpMenuPanel lang={lang} categories={categories} popular={popular} numbered={numbered}
                onSelect={sendMessage} onClose={() => setHelpOpen(false)} />
            )}

            <div ref={bottomRef} />
          </div>

          {status === 'bot' && !loading && (
            <div className="px-2 py-1.5 flex gap-1 flex-wrap max-h-[72px] overflow-y-auto bg-vd-bg-section border-t border-vd-border">
              <button type="button" onClick={() => setHelpOpen(!helpOpen)}
                className="text-xs bg-vd-accent-soft text-vd-primary-dark border border-vd-primary/30 px-2.5 py-1 rounded-full font-medium whitespace-nowrap">
                {helpOpen ? '▲ Hide Menu' : '📋 Help Menu'}
              </button>
              {categories.slice(0, 5).map((c) => (
                <button key={c.text} type="button" onClick={() => sendMessage(c.text)}
                  className="text-xs bg-vd-bg-alt hover:bg-vd-accent-soft text-vd-text-sub border border-vd-border px-2 py-1 rounded-full whitespace-nowrap">
                  {c.icon} {c.label}
                </button>
              ))}
              <button type="button" onClick={escalateToAgent}
                className="text-xs bg-vd-accent-soft text-vd-primary-dark border border-vd-primary/30 px-2.5 py-1 rounded-full font-medium whitespace-nowrap">
                🧑‍💼 Live
              </button>
            </div>
          )}

          {status !== 'ended' ? (
            <div className="p-3 border-t border-vd-border bg-vd-bg-section">
              {typeahead.length > 0 && input.trim().length >= 2 && (
                <div className="mb-2 bg-vd-bg border border-vd-border rounded-xl overflow-hidden shadow-sm">
                  {typeahead.map((s) => (
                    <button key={s.id} type="button" onClick={() => { setInput(''); sendMessage(s.text); }}
                      className="w-full text-left text-xs px-3 py-2 hover:bg-vd-accent-soft text-vd-text-sub flex items-center gap-2 border-b border-vd-border last:border-0">
                      <Search className="w-3 h-3 text-vd-primary" /> {s.label}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-vd-text-light pointer-events-none" />
                  <input value={input} onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder={status === 'live' ? 'Message agent...' : 'Type 1-9, or ask anything...'}
                    className="w-full bg-vd-bg text-vd-text-heading text-sm pl-9 pr-3 py-2.5 rounded-xl border border-vd-border focus:outline-none focus:border-vd-primary placeholder-vd-text-light"
                    disabled={loading} />
                </div>
                <button type="button" onClick={() => sendMessage()} disabled={loading || !input.trim()}
                  className="w-10 h-10 vd-gradient-gold rounded-xl flex items-center justify-center disabled:opacity-40 hover:opacity-90 flex-shrink-0">
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 border-t border-vd-border bg-vd-bg-section text-center">
              <button type="button" onClick={resetChat}
                className="text-sm vd-gradient-gold text-white px-5 py-2.5 rounded-xl hover:opacity-90 font-semibold">
                Start New Chat
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
