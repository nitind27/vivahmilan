'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import SmartImage from '@/components/SmartImage';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import {
  Heart, MapPin, GraduationCap, Briefcase, Star,
  MessageCircle, Flag, Ban, ChevronLeft, Check, X, Lock,
  Eye, Users, Cigarette, Wine, Utensils, Ruler, Weight,
  Send, Clock, CheckCircle2, AlertTriangle, ShieldOff
} from 'lucide-react';
import { differenceInYears } from 'date-fns';
import toast from 'react-hot-toast';
import VerifiedBadge from '@/components/VerifiedBadge';
import KundaliChart from '@/components/KundaliChart';

const REPORT_REASONS = [
  'Fake profile / Impersonation',
  'Inappropriate photos',
  'Harassment or abusive behavior',
  'Spam or scam',
  'Underage user',
  'Other',
];

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
function InterestPanel({ interestStatus, interestId, isOwnProfile, isPremium, userId, session, onStatusChange }) {
  const [loading, setLoading] = useState(false);
  const [showMsgBox, setShowMsgBox] = useState(false);
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
      <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-4 text-center">
        <Clock className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
        <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Interest Sent</p>
        <p className="text-xs text-gray-500 mt-1">Waiting for their response…</p>
      </div>
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

  const [user, setUser]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [shortlisted, setShortlisted] = useState(false);
  const [interestStatus, setInterestStatus] = useState(null);
  const [activePhoto, setActivePhoto] = useState(0);
  const [kundali, setKundali]         = useState(undefined);
  const [showBlockModal, setShowBlockModal]   = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [blockLoading, setBlockLoading]   = useState(false);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated' || !id) return;
    fetch(`/api/profile/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setLoading(false); return; }
        setUser(data);
        setShortlisted(data.isShortlisted || false);
        // Build interestStatus object
        if (data.interestStatus) {
          setInterestStatus({
            status: data.interestStatus,
            direction: data.interestDirection, // 'sent' | 'received'
            id: data.interestId,
          });
        }
        setLoading(false);
      });

    // Fetch kundali for this profile
    fetch(`/api/kundali/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => setKundali(data))
      .catch(() => setKundali(null));
  }, [status, id]);

  const toggleShortlist = async () => {
    const res = await fetch('/api/shortlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetId: id }),
    });
    const data = await res.json();
    setShortlisted(data.shortlisted);
    toast.success(data.shortlisted ? 'Added to shortlist ❤️' : 'Removed from shortlist');
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

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-vd-bg">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 pt-24 pb-12">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="h-80 skeleton rounded-3xl" />
            <div className="h-32 skeleton rounded-2xl" />
          </div>
          <div className="md:col-span-2 space-y-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-28 skeleton rounded-2xl" />)}
          </div>
        </div>
      </div>
    </div>
  );

  // ── Not found ──────────────────────────────────────────────────────────────
  if (!user || user.error) return (
    <div className="min-h-screen bg-vd-bg flex items-center justify-center">
      <Navbar />
      <div className="text-center">
        <div className="text-6xl mb-4">😔</div>
        <h2 className="text-2xl font-bold mb-2">Profile not available</h2>
        <Link href="/matches" className="text-vd-primary hover:underline">Browse other profiles</Link>
      </div>
    </div>
  );

  const profile      = user.profile || {};
  const allPhotos    = user.image ? [{ url: user.image }, ...(user.photos || [])] : (user.photos || []);
  const age          = profile.dob ? differenceInYears(new Date(), new Date(profile.dob)) : null;
  const isOwnProfile = session?.user?.id === id;
  const isPremium    = session?.user?.isPremium;

  return (
    <div className="min-h-screen bg-vd-bg">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">

        {/* Back */}
        <button onClick={() => router.back()}
          className="flex items-center gap-1.5 text-gray-500 hover:text-vd-primary mb-6 transition-colors text-sm">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        <div className="grid md:grid-cols-3 gap-6">

          {/* ── LEFT COLUMN ─────────────────────────────────────────────── */}
          <div className="space-y-4">

            {/* Main photo */}
            <div className="relative h-80 rounded-3xl overflow-hidden bg-vd-accent-soft dark:bg-vd-accent/20 shadow-md">
              {allPhotos.length > 0 ? (
                <SmartImage src={allPhotos[activePhoto]?.url} alt={user.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-24 h-24 vd-gradient-gold rounded-full flex items-center justify-center">
                    <span className="text-white text-4xl font-bold">{user.name?.[0]}</span>
                  </div>
                </div>
              )}
              {/* Badges */}
              <div className="absolute top-3 left-3 flex flex-col gap-1">
                {user.isPremium && (
                  <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
                    <Star className="w-3 h-3 fill-white" /> Premium
                  </span>
                )}
                {user.verificationBadge && <VerifiedBadge size="md" />}
              </div>
            </div>

            {/* Thumbnails */}
            {allPhotos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {allPhotos.map((p, i) => (
                  <button key={i} onClick={() => setActivePhoto(i)}
                    className={`relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${activePhoto === i ? 'border-vd-primary scale-105' : 'border-transparent opacity-70 hover:opacity-100'}`}>
                    <SmartImage src={p.url} alt="" fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* ── ACTION PANEL ── */}
            {!isOwnProfile ? (
              <div className="space-y-3">
                {/* Interest / Accept-Reject / Chat */}
                <InterestPanel
                  interestStatus={interestStatus}
                  interestId={interestStatus?.id}
                  isOwnProfile={isOwnProfile}
                  isPremium={isPremium}
                  userId={id}
                  session={session}
                  onStatusChange={setInterestStatus}
                />

                {/* Shortlist */}
                <button onClick={toggleShortlist}
                  className={`w-full py-2.5 rounded-2xl font-medium border-2 flex items-center justify-center gap-2 transition-all text-sm ${
                    shortlisted
                      ? 'border-vd-primary bg-vd-accent-soft dark:bg-vd-accent/20 text-vd-primary'
                      : 'border-gray-200 dark:border-gray-700 hover:border-vd-primary text-gray-600 dark:text-gray-400'
                  }`}>
                  <Heart className={`w-4 h-4 ${shortlisted ? 'fill-vd-primary text-vd-primary' : ''}`} />
                  {shortlisted ? 'Shortlisted' : 'Add to Shortlist'}
                </button>

                {/* Report / Block */}
                <div className="flex gap-2">
                  <button onClick={() => setShowReportModal(true)}
                    className="flex-1 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-400 text-xs flex items-center justify-center gap-1 hover:border-red-300 hover:text-red-500 transition-colors">
                    <Flag className="w-3.5 h-3.5" /> Report
                  </button>
                  <button onClick={() => setShowBlockModal(true)}
                    className="flex-1 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-400 text-xs flex items-center justify-center gap-1 hover:border-red-300 hover:text-red-500 transition-colors">
                    <Ban className="w-3.5 h-3.5" /> Block
                  </button>
                </div>
              </div>
            ) : (
              <Link href="/profile/edit"
                className="block w-full text-center vd-gradient-gold text-white py-3 rounded-2xl font-semibold hover:opacity-90 transition-opacity text-sm">
                Edit My Profile
              </Link>
            )}
          </div>

          {/* ── RIGHT COLUMN ────────────────────────────────────────────── */}
          <div className="md:col-span-2 space-y-4">

            {/* Name + quick stats */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-vd-bg-section dark:bg-vd-bg-card rounded-2xl p-6 border border-vd-border shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h1 className="text-2xl font-bold flex items-center gap-2 flex-wrap">
                    {user.name}
                    {user.verificationBadge && (
                      <VerifiedBadge size="lg" variant="badge" />
                    )}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {age && <span className="text-gray-500 text-sm">{age} years</span>}
                    {profile.height && <span className="text-gray-400 text-sm">• {profile.height} cm</span>}
                    {profile.maritalStatus && (
                      <span className="text-gray-400 text-sm capitalize">
                        • {profile.maritalStatus.replace(/_/g, ' ').toLowerCase()}
                      </span>
                    )}
                  </div>
                </div>
                {profile.religion && (
                  <span className="bg-vd-accent-soft dark:bg-vd-accent/20 text-vd-primary dark:text-vd-primary text-xs px-3 py-1 rounded-full font-medium">
                    {profile.religion}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                {profile.city && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <MapPin className="w-4 h-4 text-vd-primary flex-shrink-0" />
                    <span className="truncate">{[profile.city, profile.state, profile.country].filter(Boolean).join(', ')}</span>
                  </div>
                )}
                {profile.education && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <GraduationCap className="w-4 h-4 text-vd-primary flex-shrink-0" />
                    <span className="truncate">{profile.education}</span>
                  </div>
                )}
                {profile.profession && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Briefcase className="w-4 h-4 text-vd-primary flex-shrink-0" />
                    <span className="truncate">{profile.profession}</span>
                  </div>
                )}
                {profile.income && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span className="text-green-500 font-bold text-xs">₹/$</span>
                    <span className="truncate">{profile.income}</span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* About */}
            {profile.aboutMe && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="bg-vd-bg-section dark:bg-vd-bg-card rounded-2xl p-6 border border-vd-border shadow-sm">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-vd-primary" /> About Me
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{profile.aboutMe}</p>
              </motion.div>
            )}

            {/* Profile details */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="bg-vd-bg-section dark:bg-vd-bg-card rounded-2xl p-6 border border-vd-border shadow-sm">
              <h3 className="font-semibold mb-4">Profile Details</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Height', value: profile.height ? `${profile.height} cm` : null, icon: Ruler },
                  { label: 'Weight', value: profile.weight ? `${profile.weight} kg` : null, icon: Weight },
                  { label: 'Mother Tongue', value: profile.motherTongue, icon: null },
                  { label: 'Caste', value: profile.caste, icon: null },
                  { label: 'Diet', value: profile.diet, icon: Utensils },
                  { label: 'Smoking', value: profile.smoking, icon: Cigarette },
                  { label: 'Drinking', value: profile.drinking, icon: Wine },
                  { label: 'Body Type', value: profile.bodyType, icon: null },
                  { label: 'Complexion', value: profile.complexion, icon: null },
                  { label: 'Horoscope', value: profile.horoscopeSign, icon: null },
                ].filter(i => i.value).map(item => (
                  <div key={item.label} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-0.5">{item.label}</p>
                    <p className="text-sm font-medium capitalize">{String(item.value).toLowerCase()}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Family */}
            {(profile.familyType || profile.fatherOccupation || profile.siblings != null) && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="bg-vd-bg-section dark:bg-vd-bg-card rounded-2xl p-6 border border-vd-border shadow-sm">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4 text-vd-primary" /> Family Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Family Type', value: profile.familyType },
                    { label: 'Family Status', value: profile.familyStatus },
                    { label: "Father's Occupation", value: profile.fatherOccupation },
                    { label: "Mother's Occupation", value: profile.motherOccupation },
                    { label: 'Siblings', value: profile.siblings != null ? String(profile.siblings) : null },
                  ].filter(i => i.value).map(item => (
                    <div key={item.label} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-0.5">{item.label}</p>
                      <p className="text-sm font-medium">{item.value}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Partner preferences */}
            {(profile.partnerAgeMin || profile.partnerReligion || profile.partnerLocation) && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                className="bg-vd-bg-section dark:bg-vd-bg-card rounded-2xl p-6 border border-vd-border shadow-sm">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-vd-primary" /> Partner Preferences
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {profile.partnerAgeMin && profile.partnerAgeMax && (
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-0.5">Age Range</p>
                      <p className="text-sm font-medium">{profile.partnerAgeMin} – {profile.partnerAgeMax} yrs</p>
                    </div>
                  )}
                  {[
                    { label: 'Religion', value: profile.partnerReligion },
                    { label: 'Education', value: profile.partnerEducation },
                    { label: 'Location', value: profile.partnerLocation },
                  ].filter(i => i.value).map(item => (
                    <div key={item.label} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-0.5">{item.label}</p>
                      <p className="text-sm font-medium">{item.value}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Kundali Chart */}
            {kundali !== undefined && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                {kundali ? (
                  <KundaliChart kundali={kundali} />
                ) : isOwnProfile ? (
                  <div className="bg-vd-bg-section dark:bg-vd-bg-card rounded-2xl p-6 border border-vd-border shadow-sm text-center">
                    <div className="text-4xl mb-2">🪐</div>
                    <p className="text-sm font-semibold text-vd-text-heading mb-1">No Kundali Generated</p>
                    <p className="text-xs text-vd-text-light mb-4">Generate your Vedic birth chart to enhance your profile.</p>
                    <a
                      href="/onboarding?email=&step=1"
                      className="inline-block vd-gradient-gold text-white px-5 py-2.5 rounded-2xl font-semibold text-sm hover:opacity-90 transition-opacity"
                    >
                      Generate Kundali
                    </a>
                  </div>
                ) : null}
              </motion.div>
            )}
          </div>
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