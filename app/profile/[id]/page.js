'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import SmartImage from '@/components/SmartImage';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import SiteLoader from '@/components/SiteLoader';
import {
  Heart, MapPin, GraduationCap, Briefcase, Star,
  MessageCircle, Flag, Ban, ChevronLeft, Check, X, Lock,
  Eye, Users, Cigarette, Wine, Utensils, Ruler, Weight,
  Send, Clock, CheckCircle2, AlertTriangle, ShieldOff, Undo2,
  ChevronRight, Calendar, Phone, Globe, Home, Sparkles, User,
  BookOpen, Target, ImageIcon, ZoomIn
} from 'lucide-react';
import { differenceInYears, format } from 'date-fns';
import toast from 'react-hot-toast';
import VerifiedBadge from '@/components/VerifiedBadge';
import KundaliChart from '@/components/KundaliChart';
import WithdrawInterestModal from '@/components/WithdrawInterestModal';
import ShareProfileButton from '@/components/ShareProfileButton';

const REPORT_REASONS = [
  'Fake profile / Impersonation',
  'Inappropriate photos',
  'Harassment or abusive behavior',
  'Spam or scam',
  'Underage user',
  'Other',
];

const MARITAL_LABELS = {
  NEVER_MARRIED: 'Never Married',
  DIVORCED: 'Divorced',
  WIDOWED: 'Widowed',
  SEPARATED: 'Separated',
};

function formatValue(val) {
  if (val == null || val === '') return null;
  const s = String(val);
  if (/\d\s*(cm|kg|yrs|–)/i.test(s)) return s;
  if (MARITAL_LABELS[s]) return MARITAL_LABELS[s];
  if (s === 'NO') return 'No';
  if (s === 'YES') return 'Yes';
  if (s === 'OCCASIONALLY') return 'Occasionally';
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function buildPhotoList(user) {
  const seen = new Set();
  const list = [];
  const add = (url) => {
    if (!url || seen.has(url)) return;
    seen.add(url);
    list.push({ url });
  };
  add(user?.image);
  (user?.photos || []).forEach(p => add(p.url));
  return list;
}

function ProfileSection({ title, icon: Icon, children, delay = 0 }) {
  if (!children) return null;
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-vd-bg-section dark:bg-vd-bg-card rounded-3xl border border-vd-border shadow-sm overflow-hidden"
    >
      <div className="px-6 py-4 border-b border-vd-border bg-gradient-to-r from-vd-accent-soft/80 to-transparent dark:from-vd-accent/10">
        <h2 className="font-bold text-lg text-vd-text-heading flex items-center gap-2.5">
          {Icon && (
            <span className="w-9 h-9 rounded-xl vd-gradient-gold flex items-center justify-center shadow-sm">
              <Icon className="w-[18px] h-[18px] text-white" />
            </span>
          )}
          {title}
        </h2>
      </div>
      <div className="p-6">{children}</div>
    </motion.section>
  );
}

function DetailItem({ label, value, icon: Icon }) {
  const display = formatValue(value);
  if (!display) return null;
  return (
    <div className="group flex gap-3 p-4 rounded-2xl bg-vd-bg dark:bg-vd-bg/50 border border-vd-border/80 hover:border-vd-primary/30 transition-colors">
      {Icon && (
        <div className="w-10 h-10 rounded-xl bg-vd-accent-soft dark:bg-vd-accent/20 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-vd-primary" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-vd-text-light mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-vd-text-heading break-words">{display}</p>
      </div>
    </div>
  );
}

function DetailGrid({ items }) {
  const visible = items.filter(i => formatValue(i.value));
  if (!visible.length) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {visible.map(item => (
        <DetailItem key={item.label} label={item.label} value={item.value} icon={item.icon} />
      ))}
    </div>
  );
}

function PhotoGallery({ photos, name, activePhoto, setActivePhoto }) {
  const [lightbox, setLightbox] = useState(false);

  const go = (dir) => {
    setActivePhoto(i => {
      const n = photos.length;
      if (!n) return 0;
      return dir > 0 ? (i + 1) % n : (i - 1 + n) % n;
    });
  };

  if (!photos.length) {
    return (
      <div className="relative aspect-[4/5] max-h-[520px] bg-gradient-to-br from-vd-accent-soft to-vd-bg flex items-center justify-center">
        <div className="w-28 h-28 vd-gradient-gold rounded-full flex items-center justify-center shadow-xl">
          <span className="text-white text-5xl font-bold">{name?.[0]?.toUpperCase()}</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative bg-black/5 dark:bg-black/30">
        <div className="relative aspect-[4/5] max-h-[520px] w-full overflow-hidden">
          <SmartImage
            src={photos[activePhoto]?.url}
            alt={name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />

          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur text-white flex items-center justify-center hover:bg-black/60 transition-colors"
                aria-label="Previous photo"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur text-white flex items-center justify-center hover:bg-black/60 transition-colors"
                aria-label="Next photo"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setLightbox(true)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur text-white flex items-center justify-center hover:bg-black/60 transition-colors"
                aria-label="View fullscreen"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </>
          )}

          <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-1.5">
            {photos.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActivePhoto(i)}
                className={`h-1.5 rounded-full transition-all ${activePhoto === i ? 'w-8 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'}`}
                aria-label={`Photo ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {photos.length > 1 && (
          <div className="p-4 border-t border-vd-border bg-vd-bg-section/80 dark:bg-vd-bg-card/80">
            <p className="text-xs font-semibold text-vd-text-light uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5" /> All Photos ({photos.length})
            </p>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
              {photos.map((p, i) => (
                <button
                  key={p.url}
                  type="button"
                  onClick={() => setActivePhoto(i)}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${activePhoto === i ? 'border-vd-primary ring-2 ring-vd-primary/30 scale-[1.02]' : 'border-transparent opacity-80 hover:opacity-100'}`}
                >
                  <SmartImage src={p.url} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4"
            onClick={() => setLightbox(false)}
          >
            <button
              type="button"
              onClick={() => setLightbox(false)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </button>
            {photos.length > 1 && (
              <>
                <button type="button" onClick={e => { e.stopPropagation(); go(-1); }}
                  className="absolute left-4 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center">
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button type="button" onClick={e => { e.stopPropagation(); go(1); }}
                  className="absolute right-4 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center">
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
            <div className="relative w-full max-w-3xl aspect-[3/4] max-h-[85vh]" onClick={e => e.stopPropagation()}>
              <SmartImage src={photos[activePhoto]?.url} alt={name} fill className="object-contain" />
            </div>
            <p className="absolute bottom-6 text-white/70 text-sm">{activePhoto + 1} / {photos.length}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Block Confirmation Modal ──────────────────────────────────────────────────
function BlockModal({ name, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="relative bg-vd-bg-section rounded-3xl shadow-2xl border border-vd-border p-6 w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
            <ShieldOff className="w-7 h-7 text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-vd-text-heading mb-1">Block {name?.split(' ')[0]}?</h3>
          <p className="text-sm text-vd-text-sub mb-6">
            They won't be able to view your profile, send you interests, or message you.
          </p>
          <div className="flex gap-3 w-full">
            <button onClick={onCancel}
              className="flex-1 py-3 rounded-2xl border border-vd-border text-sm font-medium text-vd-text-sub hover:bg-vd-accent-soft transition-colors">
              Cancel
            </button>
            <button onClick={onConfirm} disabled={loading}
              className="flex-1 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Ban className="w-4 h-4" />}
              Block
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── Report Modal ──────────────────────────────────────────────────────────────
function ReportModal({ name, onSubmit, onCancel, loading }) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="relative bg-vd-bg-section rounded-3xl shadow-2xl border border-vd-border p-6 w-full max-w-sm">
        <button onClick={onCancel} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-vd-accent-soft transition-colors">
          <X className="w-4 h-4 text-vd-text-light" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h3 className="text-base font-bold text-vd-text-heading">Report {name?.split(' ')[0]}</h3>
            <p className="text-xs text-vd-text-light">Help us keep the community safe</p>
          </div>
        </div>

        <p className="text-xs font-semibold text-vd-text-light uppercase tracking-wide mb-2">Select a reason</p>
        <div className="space-y-2 mb-4">
          {REPORT_REASONS.map(r => (
            <button key={r} type="button" onClick={() => setReason(r)}
              className={`w-full text-left px-4 py-2.5 rounded-2xl text-sm border-2 transition-all ${
                reason === r
                  ? 'border-vd-primary bg-vd-accent-soft text-vd-text-heading font-medium'
                  : 'border-vd-border text-vd-text-sub hover:border-vd-primary hover:bg-vd-accent-soft'
              }`}>
              {r}
            </button>
          ))}
        </div>

        <textarea value={details} onChange={e => setDetails(e.target.value)} rows={2}
          placeholder="Additional details (optional)…"
          className="w-full px-4 py-3 border border-vd-border rounded-2xl bg-vd-bg text-sm text-vd-text-heading placeholder:text-vd-text-light focus:outline-none focus:border-vd-primary resize-none mb-4" />

        <button onClick={() => reason && onSubmit(reason, details)} disabled={!reason || loading}
          className="w-full py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Flag className="w-4 h-4" />}
          Submit Report
        </button>
      </motion.div>
    </div>
  );
}

// ── Interest Action Panel ─────────────────────────────────────────────────────
function InterestPanel({ interestStatus, interestId, isOwnProfile, isPremium, userId, profileName, session, onStatusChange }) {
  const [loading, setLoading] = useState(false);
  const [showMsgBox, setShowMsgBox] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [msg, setMsg] = useState('');

  // Who sent the interest to whom
  const iReceived = interestStatus?.direction === 'received';
  const iSent     = interestStatus?.direction === 'sent';
  const status    = interestStatus?.status;

  const sendInterest = async () => {
    if (showMsgBox && !msg.trim()) { toast.error('Write a message'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: userId, message: msg }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success('Interest sent!');
      onStatusChange({ status: 'PENDING', direction: 'sent', id: data.id });
      setShowMsgBox(false);
    } finally { setLoading(false); }
  };

  const respond = async (newStatus) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/interest/${interestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) { toast.error('Failed'); return; }
      toast.success(newStatus === 'ACCEPTED' ? '✅ Accepted! Chat unlocked.' : 'Interest declined.');
      onStatusChange({ ...interestStatus, status: newStatus });
    } finally { setLoading(false); }
  };

  const confirmWithdraw = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/interest/${interestId}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(data.error || 'Could not withdraw interest'); return; }
      toast.success('Interest withdrawn.');
      setShowWithdrawModal(false);
      onStatusChange(null);
    } finally { setLoading(false); }
  };

  if (isOwnProfile) return null;

  // ── ACCEPTED ──────────────────────────────────────────────────────────────
  if (status === 'ACCEPTED') {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold text-sm">
          <CheckCircle2 className="w-5 h-5" /> Interest Accepted
        </div>
        <p className="text-xs text-gray-500">
          {iSent ? 'They accepted your interest.' : 'You accepted their interest.'}
          {' '}You can now chat.
        </p>
        {isPremium ? (
          <Link href={`/chat?userId=${userId}`}
            className="flex items-center justify-center gap-2 w-full vd-gradient-gold text-white py-3 rounded-2xl font-semibold hover:opacity-90 transition-opacity text-sm">
            <MessageCircle className="w-4 h-4" /> Open Chat
          </Link>
        ) : (
          <Link href="/premium"
            className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white py-3 rounded-2xl font-semibold hover:opacity-90 transition-opacity text-sm">
            <Lock className="w-4 h-4" /> Upgrade to Chat
          </Link>
        )}
      </motion.div>
    );
  }

  // ── REJECTED ──────────────────────────────────────────────────────────────
  if (status === 'REJECTED') {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 text-center">
        <p className="text-sm text-gray-500">
          {iSent ? 'Your interest was declined.' : 'You declined this interest.'}
        </p>
      </div>
    );
  }

  // ── PENDING — I SENT ──────────────────────────────────────────────────────
  if (status === 'PENDING' && iSent) {
    return (
      <>
        <WithdrawInterestModal
          open={showWithdrawModal}
          name={profileName}
          loading={loading}
          onCancel={() => !loading && setShowWithdrawModal(false)}
          onConfirm={confirmWithdraw}
        />
        <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-4 space-y-3 text-center">
          <Clock className="w-5 h-5 text-yellow-500 mx-auto" />
          <div>
            <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Interest Sent</p>
            <p className="text-xs text-gray-500 mt-1">Waiting for their response…</p>
          </div>
          <button onClick={() => setShowWithdrawModal(true)} disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 text-sm font-medium transition-colors disabled:opacity-60">
            <Undo2 className="w-4 h-4" />
            Withdraw Interest
          </button>
        </div>
      </>
    );
  }

  // ── PENDING — THEY SENT (I need to accept/reject) ─────────────────────────
  if (status === 'PENDING' && iReceived) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-vd-accent-soft dark:bg-vd-accent/10 border-2 border-vd-border rounded-2xl p-4 space-y-3">
        <p className="text-sm font-semibold text-vd-primary dark:text-vd-primary text-center">
          💌 They sent you an interest!
        </p>
        <div className="flex gap-2">
          <button onClick={() => respond('ACCEPTED')} disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-60">
            <Check className="w-4 h-4" /> {loading ? '...' : 'Accept'}
          </button>
          <button onClick={() => respond('REJECTED')} disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-500 py-2.5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-60">
            <X className="w-4 h-4" /> Decline
          </button>
        </div>
      </motion.div>
    );
  }

  // ── NO INTEREST YET ───────────────────────────────────────────────────────
  return (
    <div className="space-y-2">
      <AnimatePresence>
        {showMsgBox && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <textarea value={msg} onChange={e => setMsg(e.target.value)} rows={3}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-2xl bg-gray-50 dark:bg-gray-700 text-sm resize-none input-focus"
              placeholder="Write a personal message (optional)…" maxLength={200} />
          </motion.div>
        )}
      </AnimatePresence>
      <button onClick={showMsgBox ? sendInterest : () => setShowMsgBox(true)} disabled={loading}
        className="w-full vd-gradient-gold text-white py-3 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60 transition-opacity text-sm">
        {showMsgBox
          ? <><Send className="w-4 h-4" /> {loading ? 'Sending…' : 'Send Interest'}</>
          : <><Heart className="w-4 h-4" /> Send Interest</>
        }
      </button>
      {showMsgBox && (
        <button onClick={() => setShowMsgBox(false)} className="w-full text-xs text-gray-400 hover:text-gray-600 py-1">
          Cancel
        </button>
      )}
    </div>
  );
}

// ── Main Profile Page ─────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id } = useParams();
  const [isSharedLink, setIsSharedLink] = useState(false);

  useEffect(() => {
    setIsSharedLink(new URLSearchParams(window.location.search).get('share') === '1');
  }, []);

  const [user, setUser]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [accessError, setAccessError] = useState(null);
  const [shortlisted, setShortlisted] = useState(false);
  const [interestStatus, setInterestStatus] = useState(null);
  const [activePhoto, setActivePhoto] = useState(0);
  const [kundali, setKundali]         = useState(undefined);
  const [showBlockModal, setShowBlockModal]   = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [blockLoading, setBlockLoading]   = useState(false);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/login?callbackUrl=${encodeURIComponent(`/profile/${id}${isSharedLink ? '?share=1' : ''}`)}`);
    }
  }, [status, router, id, isSharedLink]);

  useEffect(() => {
    if (status !== 'authenticated' || !id) return;
    setAccessError(null);
    fetch(`/api/profile/${id}`)
      .then(async r => {
        const data = await r.json();
        if (!r.ok) {
          setAccessError({ code: data.code, message: data.error, reason: data.reason });
          setLoading(false);
          return;
        }
        setUser(data);
        setShortlisted(data.isShortlisted || false);
        if (data.interestStatus) {
          setInterestStatus({
            status: data.interestStatus,
            direction: data.interestDirection,
            id: data.interestId,
          });
        }
        if (isSharedLink) toast('Profile shared with you', { icon: '🔗' });
        setLoading(false);
      });

    // Fetch kundali for this profile
    fetch(`/api/kundali/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => setKundali(data))
      .catch(() => setKundali(null));
  }, [status, id, isSharedLink]);

  const toggleShortlist = async () => {
    const res = await fetch('/api/shortlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetId: id }),
    });
    const data = await res.json();
    setShortlisted(data.shortlisted);
    if (data.shortlisted) {
      toast.success(
        (t) => (
          <span className="flex flex-col gap-1">
            <span>Added to shortlist</span>
            <button
              type="button"
              className="text-vd-primary font-semibold text-sm underline text-left"
              onClick={() => { toast.dismiss(t.id); router.push('/shortlist'); }}
            >
              View My Shortlist →
            </button>
          </span>
        ),
        { duration: 5000 }
      );
    } else {
      toast.success('Removed from shortlist');
    }
  };

  const reportUser = async (reason, details) => {
    setReportLoading(true);
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId: id, reason, details }),
      });
      if (res.ok) { toast.success('Report submitted. We will review it.'); setShowReportModal(false); }
      else toast.error('Failed to submit report');
    } finally { setReportLoading(false); }
  };

  const blockUser = async () => {
    setBlockLoading(true);
    try {
      const res = await fetch('/api/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockedId: id }),
      });
      if (res.ok) {
        toast.success('User blocked successfully');
        setShowBlockModal(false);
        router.push('/matches');
      } else toast.error('Failed to block user');
    } finally { setBlockLoading(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-vd-bg">
      <Navbar />
      <SiteLoader message="Loading profile…" fullScreen={false} size="lg" className="pt-24 min-h-[70vh]" />
    </div>
  );

  // ── Access denied (religion/caste/gender mismatch) ───────────────────────
  if (accessError) {
    const titles = {
      GENDER_MISMATCH: 'Gender criteria not met',
      RELIGION_MISMATCH: 'Religion criteria not met',
      CASTE_MISMATCH: 'Caste criteria not met',
      GOTRA_MISMATCH: 'Gotra restriction',
      BLOCKED: 'Profile blocked',
      PROFILE_UNAVAILABLE: 'Profile not available',
    };
    return (
      <div className="min-h-screen bg-vd-bg">
        <Navbar />
        <div className="flex items-center justify-center min-h-[70vh] px-4 pt-20">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
              <Lock className="w-10 h-10 text-amber-500" />
            </div>
            <h2 className="text-2xl font-bold text-vd-text-heading mb-2">
              {titles[accessError.code] || 'Cannot view this profile'}
            </h2>
            <p className="text-vd-text-sub text-sm mb-2">
              {accessError.reason || accessError.message}
            </p>
            <p className="text-xs text-vd-text-light mb-6">
              Shared profiles are only visible when your religion, caste (for Hindu), and gender match our matrimonial criteria — same as Find Matches.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/matches" className="inline-flex items-center justify-center gap-2 vd-gradient-gold text-white px-6 py-3 rounded-2xl font-semibold hover:opacity-90">
                Browse Matches <ChevronRight className="w-4 h-4" />
              </Link>
              <Link href="/profile/edit" className="inline-flex items-center justify-center gap-2 border border-vd-border px-6 py-3 rounded-2xl font-semibold text-vd-text-sub hover:border-vd-primary transition-colors text-sm">
                Update My Profile
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Not found ──────────────────────────────────────────────────────────────
  if (!user || user.error) return (
    <div className="min-h-screen bg-vd-bg">
      <Navbar />
      <div className="flex items-center justify-center min-h-[70vh] px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-vd-accent-soft flex items-center justify-center text-4xl">😔</div>
          <h2 className="text-2xl font-bold text-vd-text-heading mb-2">Profile not available</h2>
          <p className="text-vd-text-sub text-sm mb-6">This profile may be private, blocked, or no longer exists.</p>
          <Link href="/matches" className="inline-flex items-center gap-2 vd-gradient-gold text-white px-6 py-3 rounded-2xl font-semibold hover:opacity-90">
            Browse Profiles <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );

  const profile = user.profile || {};
  const allPhotos = buildPhotoList(user);
  const age = profile.dob ? differenceInYears(new Date(), new Date(profile.dob)) : null;
  const dobFormatted = profile.dob ? format(new Date(profile.dob), 'dd MMM yyyy') : null;
  const isOwnProfile = session?.user?.id === id;
  const isPremium = session?.user?.isPremium;
  const locationLine = [profile.city, profile.state, profile.country].filter(Boolean).join(', ');
  const profileComplete = profile.profileComplete ?? 0;

  const personalItems = [
    { label: 'Gender', value: profile.gender, icon: User },
    { label: 'Date of Birth', value: dobFormatted, icon: Calendar },
    { label: 'Age', value: age != null ? `${age} years` : null, icon: Calendar },
    { label: 'Height', value: profile.height ? `${profile.height} cm` : null, icon: Ruler },
    { label: 'Weight', value: profile.weight ? `${profile.weight} kg` : null, icon: Weight },
    { label: 'Marital Status', value: profile.maritalStatus, icon: Heart },
    { label: 'Body Type', value: profile.bodyType, icon: User },
    { label: 'Complexion', value: profile.complexion, icon: Sparkles },
  ];

  const religionItems = [
    { label: 'Religion', value: profile.religion, icon: BookOpen },
    { label: 'Caste', value: profile.caste, icon: null },
    { label: 'Sub Caste', value: profile.subCaste, icon: null },
    { label: 'Sect', value: profile.sect, icon: null },
    { label: 'Gotra', value: profile.gotra, icon: null },
    { label: 'Mother Tongue', value: profile.motherTongue, icon: null },
    { label: 'Horoscope (Rashi)', value: profile.horoscopeSign, icon: Sparkles },
    { label: 'Nakshatra', value: profile.nakshatra, icon: Sparkles },
    { label: 'Manglik', value: profile.manglik, icon: null },
    { label: 'Kundli Match', value: profile.kundliMatch, icon: null },
    { label: 'Amritdhari', value: profile.amritdhari, icon: null },
  ];

  const locationItems = [
    { label: 'Country', value: profile.country, icon: Globe },
    { label: 'State', value: profile.state, icon: MapPin },
    { label: 'City', value: profile.city, icon: Home },
  ];

  const careerItems = [
    { label: 'Education', value: profile.education, icon: GraduationCap },
    { label: 'Profession', value: profile.profession, icon: Briefcase },
    { label: 'Annual Income', value: profile.income, icon: Briefcase },
  ];

  const lifestyleItems = [
    { label: 'Diet', value: profile.diet, icon: Utensils },
    { label: 'Smoking', value: profile.smoking, icon: Cigarette },
    { label: 'Drinking', value: profile.drinking, icon: Wine },
  ];

  const familyItems = [
    { label: 'Family Type', value: profile.familyType, icon: Users },
    { label: 'Family Status', value: profile.familyStatus, icon: Users },
    { label: "Father's Occupation", value: profile.fatherOccupation, icon: Briefcase },
    { label: "Mother's Occupation", value: profile.motherOccupation, icon: Briefcase },
    { label: 'Siblings', value: profile.siblings != null ? String(profile.siblings) : null, icon: Users },
  ];

  const partnerItems = [
    {
      label: 'Preferred Age',
      value: profile.partnerAgeMin && profile.partnerAgeMax
        ? `${profile.partnerAgeMin} – ${profile.partnerAgeMax} yrs`
        : null,
      icon: Target,
    },
    {
      label: 'Preferred Height',
      value: profile.partnerHeightMin && profile.partnerHeightMax
        ? `${profile.partnerHeightMin} – ${profile.partnerHeightMax} cm`
        : null,
      icon: Ruler,
    },
    { label: 'Religion', value: profile.partnerReligion, icon: BookOpen },
    { label: 'Caste', value: profile.partnerCaste, icon: null },
    { label: 'Education', value: profile.partnerEducation, icon: GraduationCap },
    { label: 'Profession', value: profile.partnerProfession, icon: Briefcase },
    { label: 'Location', value: profile.partnerLocation, icon: MapPin },
    { label: 'Marital Status', value: profile.partnerMaritalStatus, icon: Heart },
    { label: 'Manglik Preference', value: profile.partnerManglik, icon: Sparkles },
  ];

  const hasSection = (items) => items.some(i => formatValue(i.value));

  return (
    <div className="min-h-screen bg-vd-bg">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">

        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-vd-text-sub hover:text-vd-primary mb-5 transition-colors text-sm font-medium"
        >
          <ChevronLeft className="w-4 h-4" /> Back to browsing
        </button>

        {/* Photo + identity hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-vd-border bg-vd-bg-section dark:bg-vd-bg-card shadow-lg overflow-hidden mb-8"
        >
          <PhotoGallery
            photos={allPhotos}
            name={user.name}
            activePhoto={activePhoto}
            setActivePhoto={setActivePhoto}
          />

          <div className="p-6 sm:p-8 border-t border-vd-border">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {!!user.isPremium && (
                    <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1 font-semibold shadow-sm">
                      <Star className="w-3 h-3 fill-white" /> Premium Member
                    </span>
                  )}
                  {!!user.verificationBadge && <VerifiedBadge size="md" variant="badge" />}
                  {profile.religion && (
                    <span className="bg-vd-accent-soft text-vd-primary text-xs px-3 py-1 rounded-full font-semibold">
                      {profile.religion}
                    </span>
                  )}
                  {profile.gender && (
                    <span className="bg-vd-bg text-vd-text-sub text-xs px-3 py-1 rounded-full font-medium border border-vd-border capitalize">
                      {formatValue(profile.gender)}
                    </span>
                  )}
                </div>

                <h1 className="text-3xl sm:text-4xl font-black text-vd-text-heading flex items-center gap-2 flex-wrap leading-tight">
                  {user.name}
                  {!!user.verificationBadge && <VerifiedBadge size="lg" variant="icon" />}
                </h1>

                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm text-vd-text-sub">
                  {age != null && <span>{age} years</span>}
                  {profile.height && <span>{profile.height} cm</span>}
                  {profile.maritalStatus && <span>{formatValue(profile.maritalStatus)}</span>}
                  {locationLine && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-vd-primary" /> {locationLine}
                    </span>
                  )}
                </div>

                {(profile.education || profile.profession) && (
                  <div className="flex flex-wrap gap-4 mt-4">
                    {profile.education && (
                      <div className="flex items-center gap-2 text-sm text-vd-text-sub">
                        <GraduationCap className="w-4 h-4 text-vd-primary" />
                        <span>{profile.education}</span>
                      </div>
                    )}
                    {profile.profession && (
                      <div className="flex items-center gap-2 text-sm text-vd-text-sub">
                        <Briefcase className="w-4 h-4 text-vd-primary" />
                        <span>{profile.profession}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {profileComplete > 0 && (
                <div className="lg:w-44 flex-shrink-0 rounded-2xl border border-vd-border p-4 bg-vd-bg">
                  <p className="text-xs font-semibold text-vd-text-light uppercase tracking-wide mb-2">Profile strength</p>
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-2xl font-black text-vd-primary">{profileComplete}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-vd-accent-soft overflow-hidden">
                    <div
                      className="h-full vd-gradient-gold rounded-full transition-all"
                      style={{ width: `${Math.min(100, profileComplete)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Sidebar — actions */}
          <aside className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">
            <div className="rounded-3xl border border-vd-border bg-vd-bg-section dark:bg-vd-bg-card p-5 shadow-sm space-y-3">
              <h2 className="text-sm font-bold text-vd-text-heading uppercase tracking-wide">Connect</h2>
              <ShareProfileButton
                profileId={id}
                profileName={user?.name}
                label={isOwnProfile ? 'Share My Profile' : 'Share Profile'}
              />
              {!isOwnProfile ? (
                <>
                  <InterestPanel
                    interestStatus={interestStatus}
                    interestId={interestStatus?.id}
                    isOwnProfile={isOwnProfile}
                    isPremium={isPremium}
                    userId={id}
                    profileName={user?.name}
                    session={session}
                    onStatusChange={setInterestStatus}
                  />
                  <button
                    type="button"
                    onClick={toggleShortlist}
                    className={`w-full py-3 rounded-2xl font-semibold border-2 flex items-center justify-center gap-2 transition-all text-sm ${
                      shortlisted
                        ? 'border-vd-primary bg-vd-accent-soft text-vd-primary'
                        : 'border-vd-border hover:border-vd-primary text-vd-text-sub'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${shortlisted ? 'fill-vd-primary text-vd-primary' : ''}`} />
                    {shortlisted ? 'Shortlisted' : 'Add to Shortlist'}
                  </button>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowReportModal(true)}
                      className="flex-1 py-2.5 rounded-xl border border-vd-border text-vd-text-light text-xs flex items-center justify-center gap-1 hover:border-orange-300 hover:text-orange-600 transition-colors"
                    >
                      <Flag className="w-3.5 h-3.5" /> Report
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowBlockModal(true)}
                      className="flex-1 py-2.5 rounded-xl border border-vd-border text-vd-text-light text-xs flex items-center justify-center gap-1 hover:border-red-300 hover:text-red-500 transition-colors"
                    >
                      <Ban className="w-3.5 h-3.5" /> Block
                    </button>
                  </div>
                </>
              ) : (
                <Link
                  href="/profile/edit"
                  className="block w-full text-center vd-gradient-gold text-white py-3.5 rounded-2xl font-semibold hover:opacity-90 transition-opacity text-sm"
                >
                  Edit My Profile
                </Link>
              )}
            </div>

            {user.phone && (
              <div className="rounded-2xl border border-vd-border bg-vd-bg-section dark:bg-vd-bg-card p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                  <Phone className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-vd-text-light font-semibold">Contact</p>
                  <p className="text-sm font-semibold text-vd-text-heading">{user.phone}</p>
                </div>
              </div>
            )}
          </aside>

          {/* Main details */}
          <main className="lg:col-span-8 space-y-6">
            {profile.aboutMe && (
              <ProfileSection title="About Me" icon={Eye} delay={0.05}>
                <p className="text-vd-text-sub text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                  {profile.aboutMe}
                </p>
              </ProfileSection>
            )}

            {hasSection(personalItems) && (
              <ProfileSection title="Personal Information" icon={User} delay={0.08}>
                <DetailGrid items={personalItems} />
              </ProfileSection>
            )}

            {hasSection(religionItems) && (
              <ProfileSection title="Religion & Horoscope" icon={Sparkles} delay={0.1}>
                <DetailGrid items={religionItems} />
              </ProfileSection>
            )}

            {hasSection(locationItems) && (
              <ProfileSection title="Location" icon={MapPin} delay={0.12}>
                <DetailGrid items={locationItems} />
              </ProfileSection>
            )}

            {hasSection(careerItems) && (
              <ProfileSection title="Education & Career" icon={GraduationCap} delay={0.14}>
                <DetailGrid items={careerItems} />
              </ProfileSection>
            )}

            {hasSection(lifestyleItems) && (
              <ProfileSection title="Lifestyle" icon={Utensils} delay={0.16}>
                <DetailGrid items={lifestyleItems} />
              </ProfileSection>
            )}

            {hasSection(familyItems) && (
              <ProfileSection title="Family Details" icon={Users} delay={0.18}>
                <DetailGrid items={familyItems} />
              </ProfileSection>
            )}

            {hasSection(partnerItems) && (
              <ProfileSection title="Partner Preferences" icon={Target} delay={0.2}>
                <DetailGrid items={partnerItems} />
              </ProfileSection>
            )}

            {kundali !== undefined && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
                {kundali ? (
                  <KundaliChart kundali={kundali} />
                ) : isOwnProfile ? (
                  <div className="bg-vd-bg-section dark:bg-vd-bg-card rounded-3xl p-8 border border-vd-border shadow-sm text-center">
                    <div className="text-4xl mb-2">🪐</div>
                    <p className="text-sm font-semibold text-vd-text-heading mb-1">No Kundali Generated</p>
                    <p className="text-xs text-vd-text-light mb-4">Generate your Vedic birth chart to enhance your profile.</p>
                    <Link
                      href="/profile/edit"
                      className="inline-block vd-gradient-gold text-white px-5 py-2.5 rounded-2xl font-semibold text-sm hover:opacity-90 transition-opacity"
                    >
                      Generate Kundali
                    </Link>
                  </div>
                ) : null}
              </motion.div>
            )}
          </main>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showBlockModal && (
          <BlockModal
            name={user?.name}
            onConfirm={blockUser}
            onCancel={() => setShowBlockModal(false)}
            loading={blockLoading}
          />
        )}
        {showReportModal && (
          <ReportModal
            name={user?.name}
            onSubmit={reportUser}
            onCancel={() => setShowReportModal(false)}
            loading={reportLoading}
          />
        )}
      </AnimatePresence>
    </div>
  );
}