'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, ChevronLeft, ChevronRight, UserRound, MapPin, GraduationCap, Briefcase, Star } from 'lucide-react';
import Navbar from '@/components/Navbar';
import SmartImage from '@/components/SmartImage';
import SkeletonCard from '@/components/SkeletonCard';

const GENDERS = [
  { val: '', label: 'All' },
  { val: 'FEMALE', label: 'Brides' },
  { val: 'MALE', label: 'Grooms' },
];

function loginHref(profileId) {
  const next = profileId ? `/profile/${profileId}` : '/search';
  return `/login?callbackUrl=${encodeURIComponent(next)}`;
}

const CARD_WASHES = [
  'linear-gradient(165deg, #f6e3c4 0%, #d4a574 46%, #6b3e32 100%)',
  'linear-gradient(165deg, #f3d0c8 0%, #c4846a 48%, #4a2c32 100%)',
  'linear-gradient(165deg, #efe0c4 0%, #b8895a 50%, #3e2a22 100%)',
  'linear-gradient(165deg, #e7d3b0 0%, #a67c52 52%, #2f241c 100%)',
];

function cardWash(id = '') {
  let n = 0;
  for (let i = 0; i < id.length; i += 1) n = (n + id.charCodeAt(i)) % CARD_WASHES.length;
  return CARD_WASHES[n];
}

function LockedCard({ user }) {
  const router = useRouter();
  const profile = user.profile || {};
  const photo = user.photos?.[0]?.url;
  const [photoOk, setPhotoOk] = useState(Boolean(photo));
  const place = [profile.city, profile.country].filter(Boolean).join(', ');

  const openLogin = () => router.push(loginHref(user.id));

  return (
    <article className="overflow-hidden rounded-2xl border border-[#E8DCC8] bg-white shadow-sm">
      <button
        type="button"
        onClick={openLogin}
        className="block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A35A]"
        aria-label={`Login to view ${user.name || 'this profile'}`}
      >
        <div className="relative h-56">
          <div className="absolute inset-0" style={{ background: cardWash(user.id) }} />
          {photo && photoOk && (
            <SmartImage
              src={photo}
              alt=""
              fill
              draggable={false}
              onError={() => setPhotoOk(false)}
              className="object-cover scale-125 blur-2xl saturate-50 select-none pointer-events-none"
            />
          )}
          <div className="absolute inset-0 bg-[#FFFCF7]/20" />
          {!(photo && photoOk) && (
            <span className="absolute inset-0 flex items-center justify-center text-[#8F6B2E]/35">
              <UserRound className="h-16 w-16" strokeWidth={1.25} />
            </span>
          )}
          <span className="absolute left-3 top-3 flex flex-wrap gap-1">
            {user.isPremium ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 px-2 py-0.5 text-[11px] font-semibold text-white">
                <Star className="h-3 w-3 fill-white" /> Premium
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-[#8F6B2E]">
              <Lock className="h-3 w-3" />
              Photo private
            </span>
          </span>
          {user.verificationBadge ? (
            <span className="absolute right-3 top-3 rounded-full bg-[#2C2416]/80 px-2.5 py-1 text-[11px] font-semibold text-white">
              Verified
            </span>
          ) : null}
        </div>
        <div className="px-4 py-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-sm font-semibold text-[#2C2416]">{user.name || 'Profile'}</h3>
            {profile.age ? <span className="shrink-0 text-xs text-[#6E6254]">{profile.age} yrs</span> : null}
          </div>
          <div className="mt-2 space-y-1">
            {place ? (
              <p className="flex items-center gap-1 text-xs text-[#6E6254]">
                <MapPin className="h-3 w-3 shrink-0 text-[#C4A35A]" />
                <span className="truncate">{place}</span>
              </p>
            ) : null}
            {profile.education ? (
              <p className="flex items-center gap-1 text-xs text-[#6E6254]">
                <GraduationCap className="h-3 w-3 shrink-0 text-[#C4A35A]" />
                <span className="truncate">{profile.education}</span>
              </p>
            ) : null}
            {profile.profession ? (
              <p className="flex items-center gap-1 text-xs text-[#6E6254]">
                <Briefcase className="h-3 w-3 shrink-0 text-[#C4A35A]" />
                <span className="truncate">{profile.profession}</span>
              </p>
            ) : null}
          </div>
          {profile.religion ? (
            <span className="mt-3 inline-block rounded-full bg-[#F8F1E3] px-2 py-1 text-xs text-[#8F6B2E]">{profile.religion}</span>
          ) : null}
          <span className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#C4A35A] py-2 text-sm font-semibold text-[#8F6B2E]">
            View profile
          </span>
        </div>
      </button>
    </article>
  );
}

export default function GuestProfileBrowse() {
  const [gender, setGender] = useState('');
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '12' });
    if (gender) params.set('gender', gender);

    fetch(`/api/search?${params}`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        setUsers(data.users || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      })
      .catch(() => {
        if (!cancelled) setUsers([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [gender, page]);

  return (
    <div className="min-h-screen bg-vd-bg">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A67C3D]">Members</p>
            <h1 className="mt-1 font-display text-3xl font-semibold text-[#2C2416]">Browse verified profiles</h1>
            <p className="mt-2 max-w-xl text-sm text-[#6E6254]">
              {total > 0 ? `${total.toLocaleString('en-IN')} profiles are live.` : 'Profiles appear here as they are approved.'} Names and details are real. Photos stay blurred until you sign in.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/register"
              className="px-4 py-2.5 rounded-xl border border-vd-border text-sm font-semibold text-vd-text-heading hover:border-vd-primary transition-colors"
            >
              Register
            </Link>
            <Link
              href={loginHref()}
              className="px-4 py-2.5 rounded-xl vd-gradient-gold text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Login
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {GENDERS.map(g => (
            <button
              key={g.val || 'all'}
              type="button"
              onClick={() => { setGender(g.val); setPage(1); }}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                gender === g.val
                  ? 'vd-gradient-gold text-white'
                  : 'bg-vd-bg-section border border-vd-border text-vd-text-sub hover:border-vd-primary'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-20 bg-vd-bg-section rounded-3xl border border-vd-border">
            <p className="text-lg font-semibold text-vd-text-heading">No profiles yet</p>
            <p className="text-sm text-vd-text-sub mt-1">Try another filter, or check back soon.</p>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {users.map(u => <LockedCard key={u.id} user={u} />)}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-10">
                <button
                  type="button"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2.5 rounded-xl border border-vd-border disabled:opacity-40 hover:border-vd-primary transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-vd-text-sub">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2.5 rounded-xl border border-vd-border disabled:opacity-40 hover:border-vd-primary transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
