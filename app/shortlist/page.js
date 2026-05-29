'use client';
import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import ProfileCard from '@/components/ProfileCard';
import { SiteLoaderInline } from '@/components/SiteLoader';
import { Heart, Search, ChevronRight, Bookmark, Scale, CheckSquare, Square } from 'lucide-react';

export default function ShortlistPage() {
  const { status } = useSession();
  const router = useRouter();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [compareIds, setCompareIds] = useState([]);

  const loadShortlist = useCallback(() => {
    setLoading(true);
    fetch('/api/shortlist')
      .then(r => (r.ok ? r.json() : []))
      .then(data => {
        setList(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setList([]);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') loadShortlist();
  }, [status, loadShortlist]);

  const toggleCompare = (id) => {
    setCompareIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const compareHref = compareIds.length >= 2 ? `/compare?ids=${compareIds.join(',')}` : null;

  const handleShortlistChange = (targetId, shortlisted) => {
    if (!shortlisted) {
      setCompareIds(prev => prev.filter(x => x !== targetId));
      setList(prev => prev.filter(item => item.target?.id !== targetId && item.targetId !== targetId));
    }
  };

  return (
    <div className="min-h-screen bg-vd-bg">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <Link href="/dashboard" className="hover:text-vd-primary transition-colors">Dashboard</Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-vd-primary font-medium">Shortlist</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl vd-gradient-gold flex items-center justify-center shadow-md">
                  <Bookmark className="w-6 h-6 text-white fill-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Shortlist</h1>
                  <p className="text-gray-500 text-sm mt-0.5">
                    Profiles you&apos;ve saved for later
                  </p>
                </div>
              </div>
            </div>
            {!loading && list.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                {compareIds.length >= 2 && compareHref && (
                  <Link href={compareHref}
                    className="inline-flex items-center gap-2 bg-vd-primary text-white text-sm px-4 py-1.5 rounded-full font-semibold shadow-sm hover:opacity-90">
                    <Scale className="w-4 h-4" /> Compare ({compareIds.length})
                  </Link>
                )}
                <span className="vd-gradient-gold text-white text-sm px-4 py-1.5 rounded-full font-semibold shadow-sm">
                  {list.length} profile{list.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>

          {/* Hint */}
          <div className="mt-5 rounded-2xl border border-vd-border bg-vd-bg-section dark:bg-vd-bg-card px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium text-vd-primary">Tip:</span> Tap the heart on any profile card to save it here.
            Select 2–3 profiles with the checkbox to compare side by side.
          </div>
        </motion.div>

        {loading ? (
          <SiteLoaderInline message="Loading shortlist…" className="py-24" />
        ) : list.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 rounded-3xl border border-dashed border-vd-border bg-vd-bg-section/50 dark:bg-vd-bg-card/50"
          >
            <Heart className="w-16 h-16 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">No saved profiles yet</h3>
            <p className="text-gray-400 text-sm mt-2 max-w-md mx-auto">
              Browse Matches or Search, then use &quot;Add to Shortlist&quot; or the heart icon on a profile card.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              <Link
                href="/matches"
                className="inline-flex items-center gap-2 vd-gradient-gold text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                <Heart className="w-4 h-4" /> Find Matches
              </Link>
              <Link
                href="/search"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border border-vd-border bg-vd-bg-section dark:bg-vd-bg-card hover:border-vd-primary transition-colors"
              >
                <Search className="w-4 h-4 text-vd-primary" /> Advanced Search
              </Link>
            </div>
          </motion.div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {list.map((item, i) => {
              const uid = item.target?.id || item.targetId;
              const selected = compareIds.includes(uid);
              return (
              <div key={item.id} className="relative">
                <button type="button" onClick={() => toggleCompare(uid)}
                  className={`absolute top-3 left-3 z-10 p-1.5 rounded-lg border shadow-sm transition-colors ${selected ? 'bg-vd-primary border-vd-primary text-white' : 'bg-white/90 border-vd-border text-vd-text-light hover:border-vd-primary'}`}
                  title="Select to compare">
                  {selected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                </button>
              <ProfileCard
                user={{ ...item.target, isShortlisted: true }}
                index={i}
                onShortlistChange={handleShortlistChange}
              />
              </div>
            );})}
          </div>
        )}
      </div>
    </div>
  );
}
