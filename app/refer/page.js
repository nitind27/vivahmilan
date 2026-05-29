'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import toast from 'react-hot-toast';
import { Gift, Copy, Users, Share2 } from 'lucide-react';
import { SiteLoaderInline } from '@/components/SiteLoader';

export default function ReferPage() {
  const { status } = useSession();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/referral').then(r => r.json()).then(setData).finally(() => setLoading(false));
  }, [status]);

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied!');
  };

  const share = async () => {
    if (navigator.share && data?.referralLink) {
      await navigator.share({ title: 'Join Vivah Dwar', url: data.referralLink });
    } else {
      copy(data?.referralLink || '');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-vd-bg dark:bg-gray-950">
        <Navbar />
        <SiteLoaderInline message="Loading…" className="pt-32" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-vd-bg dark:bg-gray-950">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 pt-24 pb-12">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-vd-primary/15 flex items-center justify-center mx-auto mb-4">
            <Gift className="w-8 h-8 text-vd-primary" />
          </div>
          <h1 className="text-2xl font-bold text-vd-text dark:text-white">Refer & Earn</h1>
          <p className="text-sm text-gray-500 mt-2">Invite friends & family. Help them find their perfect match.</p>
        </div>

        <div className="bg-gradient-to-br from-vd-primary/20 to-orange-900/10 border border-vd-primary/30 rounded-2xl p-6 mb-6 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Your referral code</p>
          <p className="text-3xl font-bold text-white tracking-widest mb-4">{data?.referralCode}</p>
          <div className="flex gap-2 justify-center">
            <button type="button" onClick={() => copy(data?.referralCode)} className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-xl text-sm text-white hover:bg-gray-700">
              <Copy className="w-4 h-4" /> Copy Code
            </button>
            <button type="button" onClick={share} className="flex items-center gap-2 px-4 py-2 bg-vd-primary rounded-xl text-sm text-white font-semibold hover:opacity-90">
              <Share2 className="w-4 h-4" /> Share Link
            </button>
          </div>
          <p className="text-[11px] text-gray-500 mt-3 break-all">{data?.referralLink}</p>
        </div>

        <div className="bg-vd-bg-section dark:bg-gray-800 rounded-2xl border border-vd-border dark:border-gray-700 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-vd-primary" />
            <span className="font-semibold text-white">{data?.totalReferrals || 0} successful referrals</span>
          </div>
          {data?.referredUsers?.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-6">No referrals yet. Share your code to get started!</p>
          )}
          <div className="space-y-2">
            {data?.referredUsers?.map(u => (
              <div key={u.id} className="flex items-center gap-3 p-3 bg-gray-900/40 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">
                  {u.photo ? <img src={u.photo} alt="" className="w-full h-full object-cover" /> : <span className="w-full h-full flex items-center justify-center text-gray-400 text-sm">{u.name?.[0]}</span>}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{u.name}</p>
                  <p className="text-xs text-gray-500">Joined {new Date(u.joinedAt).toLocaleDateString('en-IN')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
