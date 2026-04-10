'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import SmartImage from '@/components/SmartImage';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import {
  Heart, Check, X, MapPin, GraduationCap, Briefcase,
  BadgeCheck, Star, MessageCircle, Eye, ChevronRight, Clock
} from 'lucide-react';
import { differenceInYears, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

export default function InterestsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState('received');
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(null); // id of interest being responded to

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      setLoading(true);
      fetch(`/api/interest?type=${tab}`)
        .then(r => r.json())
        .then(data => { setInterests(data); setLoading(false); });
    }
  }, [status, tab]);

  const respond = async (id, newStatus) => {
    setResponding(id);
    try {
      const res = await fetch(`/api/interest/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setInterests(prev => prev.map(i => i.id === id ? { ...i, status: newStatus } : i));
        if (newStatus === 'ACCEPTED') {
          toast.success('Interest accepted! Chat is now unlocked.');
        } else {
          toast('Interest declined.', { icon: '👋' });
        }
      }
    } finally {
      setResponding(null);
    }
  };

  const counts = {
    received: interests.filter(i => i.status === 'PENDING').length,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-12">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Interests</h1>
            <p className="text-gray-500 text-sm mt-1">Manage your connection requests</p>
          </div>
          {tab === 'received' && counts.received > 0 && (
            <span className="gradient-bg text-white text-sm px-3 py-1 rounded-full font-medium">
              {counts.received} pending
            </span>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'received', label: 'Received' },
            { key: 'sent', label: 'Sent' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-5 py-2 rounded-2xl font-medium text-sm transition-all ${tab === t.key ? 'gradient-bg text-white shadow-md' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-pink-300'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-40 skeleton rounded-3xl" />
            ))}
          </div>
        ) : interests.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-20">
            <Heart className="w-16 h-16 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-500">
              No {tab} interests yet
            </h3>
            {tab === 'received'
              ? <p className="text-gray-400 text-sm mt-1">Complete your profile to attract more matches</p>
              : <Link href="/matches" className="text-pink-500 text-sm mt-2 inline-block hover:underline">Browse profiles →</Link>
            }
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {interests.map((interest, i) => {
                const person = tab === 'received' ? interest.sender : interest.receiver;
                const profile = person?.profile || {};
                const photo = person?.photos?.[0]?.url || person?.image;
                const age = profile.dob ? differenceInYears(new Date(), new Date(profile.dob)) : null;
                const isPending = interest.status === 'PENDING';
                const isAccepted = interest.status === 'ACCEPTED';

                return (
                  <motion.div key={interest.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: i * 0.05 }}
                    className={`bg-white dark:bg-gray-800 rounded-3xl border-2 overflow-hidden shadow-sm transition-all ${
                      isPending && tab === 'received'
                        ? 'border-pink-200 dark:border-pink-800'
                        : 'border-gray-100 dark:border-gray-700'
                    }`}>

                    <div className="flex gap-0">
                      {/* Photo */}
                      <Link href={`/profile/${person?.id}`}
                        className="relative w-32 sm:w-40 flex-shrink-0 bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/20 dark:to-purple-900/20">
                        {photo ? (
                          <SmartImage src={photo} alt={person?.name} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-14 h-14 gradient-bg rounded-full flex items-center justify-center">
                              <span className="text-white text-2xl font-bold">{person?.name?.[0]}</span>
                            </div>
                          </div>
                        )}
                        {/* Badges */}
                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                          {person?.verificationBadge && (
                            <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                              <BadgeCheck className="w-3 h-3" />
                            </span>
                          )}
                          {person?.isPremium && (
                            <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                              <Star className="w-3 h-3 fill-white" />
                            </span>
                          )}
                        </div>
                      </Link>

                      {/* Details */}
                      <div className="flex-1 p-4 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <Link href={`/profile/${person?.id}`}
                              className="font-bold text-lg hover:text-pink-500 transition-colors flex items-center gap-2">
                              {person?.name}
                              {person?.verificationBadge && <BadgeCheck className="w-4 h-4 text-blue-500" />}
                            </Link>
                            <div className="flex items-center gap-3 text-sm text-gray-500 flex-wrap mt-0.5">
                              {age && <span>{age} yrs</span>}
                              {profile.height && <span>{profile.height} cm</span>}
                              {profile.maritalStatus && (
                                <span className="capitalize">{profile.maritalStatus.replace('_', ' ').toLowerCase()}</span>
                              )}
                            </div>
                          </div>
                          {/* Status badge */}
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${
                            isAccepted ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                            interest.status === 'REJECTED' ? 'bg-red-100 text-red-500 dark:bg-red-900/30 dark:text-red-400' :
                            'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}>
                            {interest.status === 'PENDING' ? '⏳ Pending' :
                             interest.status === 'ACCEPTED' ? '✓ Accepted' : '✗ Declined'}
                          </span>
                        </div>

                        {/* Profile info */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-3">
                          {profile.city && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <MapPin className="w-3 h-3 text-pink-400 flex-shrink-0" />
                              <span className="truncate">{[profile.city, profile.country].filter(Boolean).join(', ')}</span>
                            </div>
                          )}
                          {profile.education && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <GraduationCap className="w-3 h-3 text-purple-400 flex-shrink-0" />
                              <span className="truncate">{profile.education}</span>
                            </div>
                          )}
                          {profile.profession && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <Briefcase className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                              <span className="truncate">{profile.profession}</span>
                            </div>
                          )}
                          {profile.religion && (
                            <div className="flex items-center gap-1.5 text-xs">
                              <span className="bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 px-2 py-0.5 rounded-full">
                                {profile.religion}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Message if any */}
                        {interest.message && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-700/50 rounded-xl px-3 py-2 mb-3">
                            "{interest.message}"
                          </p>
                        )}

                        {/* Time */}
                        <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(interest.createdAt), { addSuffix: true })}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* View profile */}
                          <Link href={`/profile/${person?.id}`}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-600 hover:border-pink-400 hover:text-pink-500 transition-colors">
                            <Eye className="w-3.5 h-3.5" /> View Profile
                          </Link>

                          {/* Accept / Reject — only for received + pending */}
                          {tab === 'received' && isPending && (
                            <>
                              <button
                                onClick={() => respond(interest.id, 'ACCEPTED')}
                                disabled={responding === interest.id}
                                className="flex items-center gap-1.5 text-xs px-4 py-1.5 rounded-xl bg-green-500 text-white hover:bg-green-600 disabled:opacity-60 transition-colors font-medium">
                                <Check className="w-3.5 h-3.5" />
                                {responding === interest.id ? 'Accepting...' : 'Accept'}
                              </button>
                              <button
                                onClick={() => respond(interest.id, 'REJECTED')}
                                disabled={responding === interest.id}
                                className="flex items-center gap-1.5 text-xs px-4 py-1.5 rounded-xl bg-red-100 text-red-500 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/40 disabled:opacity-60 transition-colors font-medium">
                                <X className="w-3.5 h-3.5" /> Decline
                              </button>
                            </>
                          )}

                          {/* Chat button — only after accepted */}
                          {isAccepted && (
                            session?.user?.isPremium ? (
                              <Link href={`/chat?userId=${person?.id}`}
                                className="flex items-center gap-1.5 text-xs px-4 py-1.5 rounded-xl gradient-bg text-white hover:opacity-90 transition-opacity font-medium">
                                <MessageCircle className="w-3.5 h-3.5" /> Open Chat
                              </Link>
                            ) : (
                              <Link href="/premium"
                                className="flex items-center gap-1.5 text-xs px-4 py-1.5 rounded-xl bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400 hover:bg-yellow-200 transition-colors font-medium">
                                <Star className="w-3.5 h-3.5 fill-yellow-500" /> Premium to Chat
                              </Link>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
