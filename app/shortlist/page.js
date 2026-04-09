'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import ProfileCard from '@/components/ProfileCard';
import SkeletonCard from '@/components/SkeletonCard';
import { Heart } from 'lucide-react';

export default function ShortlistPage() {
  const { status } = useSession();
  const router = useRouter();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/shortlist').then(r => r.json()).then(data => {
        setList(data);
        setLoading(false);
      });
    }
  }, [status]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <h1 className="text-3xl font-bold mb-2">Shortlisted Profiles</h1>
        <p className="text-gray-500 mb-6">{list.length} profiles saved</p>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : list.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-16 h-16 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-500">No shortlisted profiles</h3>
            <p className="text-gray-400 text-sm mt-1">Click the heart icon on any profile to shortlist them</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {list.map((item, i) => (
              <ProfileCard key={item.id} user={{ ...item.target, isShortlisted: true }} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
