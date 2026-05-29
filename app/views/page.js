'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import SmartImage from '@/components/SmartImage';
import { Eye, Lock, Crown, MapPin, Clock, ChevronRight, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { SiteLoaderInline } from '@/components/SiteLoader';

export default function ProfileViewsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    setLoading(true);
    fetch('/api/profile-views')
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [status]);

  return (
    <div className="min-h-screen bg-vd-bg dark:bg-gray-950">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 pt-24 pb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-vd-primary/15 flex items-center justify-center">
            <Eye className="w-5 h-5 text-vd-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-vd-text dark:text-white">Who Viewed My Profile</h1>
            <p className="text-sm text-gray-500">
              {data?.total != null ? `${data.total} total views` : 'See who is interested in your profile'}
            </p>
          </div>
        </div>

        {loading && <SiteLoaderInline message="Loading viewers…" className="py-16" />}

        {!loading && data?.locked && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-yellow-900/20 to-orange-900/10 border border-yellow-700/40 rounded-2xl p-6 text-center">
              <Lock className="w-10 h-10 text-yellow-400 mx-auto mb-3" />
              <h2 className="text-lg font-bold text-white mb-2">Premium Feature</h2>
              <p className="text-sm text-gray-400 mb-4">{data.message}</p>
              <p className="text-2xl font-bold text-yellow-400 mb-4">{data.total} people viewed your profile</p>
              <Link href="/premium" className="inline-flex items-center gap-2 px-6 py-3 bg-vd-primary text-white rounded-xl font-semibold hover:opacity-90">
                <Crown className="w-4 h-4" /> Upgrade to Premium
              </Link>
            </div>
            {data.teaser?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 uppercase tracking-wide px-1">Recent activity (blurred)</p>
                {data.teaser.map((v, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 bg-gray-800/60 rounded-xl border border-gray-700 blur-[2px] select-none">
                    <div className="w-12 h-12 rounded-full bg-gray-700" />
                    <div className="flex-1">
                      <p className="text-white font-medium">••••••••</p>
                      <p className="text-xs text-gray-500">{v.gender} · {v.location || 'Unknown'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!loading && data && !data.locked && (
          <div className="space-y-3">
            {data.viewers?.length === 0 && (
              <div className="text-center py-16 text-gray-500">
                <Eye className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No profile views yet. Complete your profile to get more visibility!</p>
                <Link href="/profile/edit" className="text-vd-primary text-sm mt-2 inline-block">Edit Profile</Link>
              </div>
            )}
            {data.viewers?.map(v => (
              <Link
                key={v.viewId}
                href={`/profile/${v.user.id}`}
                className="flex items-center gap-3 p-4 bg-vd-bg-section dark:bg-gray-800 rounded-2xl border border-vd-border dark:border-gray-700 hover:border-vd-primary/40 transition-all group"
              >
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-700 flex-shrink-0">
                  {v.user.photo
                    ? <SmartImage src={v.user.photo} alt="" width={56} height={56} className="object-cover w-full h-full" />
                    : <div className="w-full h-full flex items-center justify-center"><User className="w-6 h-6 text-gray-500" /></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-vd-text dark:text-white truncate group-hover:text-vd-primary transition-colors">{v.user.name}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-2 flex-wrap mt-0.5">
                    {v.user.profile?.gender && <span>{v.user.profile.gender}</span>}
                    {(v.user.profile?.city || v.user.profile?.state) && (
                      <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{[v.user.profile.city, v.user.profile.state].filter(Boolean).join(', ')}</span>
                    )}
                  </p>
                  <p className="text-[11px] text-gray-600 flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" /> {formatDistanceToNow(new Date(v.viewedAt), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  {v.user.isPremium && <span className="text-[10px] bg-yellow-900/30 text-yellow-400 px-2 py-0.5 rounded-full">Premium</span>}
                  {v.user.adminVerified && <span className="text-[10px] bg-green-900/30 text-green-400 px-2 py-0.5 rounded-full">Verified</span>}
                  <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-vd-primary" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
