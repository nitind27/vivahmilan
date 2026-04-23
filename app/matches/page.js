'use client';
import { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import ProfileCard from '@/components/ProfileCard';
import SkeletonCard from '@/components/SkeletonCard';
import { SlidersHorizontal, X, ChevronLeft, ChevronRight } from 'lucide-react';

const religions = ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Buddhist', 'Jain', 'Jewish', 'Other'];
const educations = ['High School', 'Diploma', "Bachelor's", "Master's", 'PhD', 'MBBS', 'CA', 'Other'];
const countries = ['India', 'USA', 'UK', 'Canada', 'Australia', 'UAE', 'Singapore', 'Germany', 'Other'];

function MatchesPage() {
  const { status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isLimited, setIsLimited] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    ageMin: '', ageMax: '', religion: '', country: '', education: '',
    heightMin: '', heightMax: '', maritalStatus: '',
  });

  // Debounced filters — only fire fetch 500ms after user stops changing
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  const debounceRef = useRef(null);
  const updateFilter = (key, value) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedFilters(next);
      setPage(1);
    }, 500);
  };

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 12 });
    Object.entries(debouncedFilters).forEach(([k, v]) => { if (v) params.set(k, v); });
    try {
      const res = await fetch(`/api/matches?${params}`);
      const data = await res.json();
      setUsers(data.users || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
      setIsLimited(data.isLimited || false);
      setIsPremium(data.isPremium || false);
    } catch { /* keep previous results on error */ }
    setLoading(false);
  }, [page, debouncedFilters]);

  useEffect(() => { if (status === 'authenticated') fetchMatches(); }, [status, fetchMatches]);

  const clearFilters = () => {
    const empty = { ageMin: '', ageMax: '', religion: '', country: '', education: '', heightMin: '', heightMax: '', maritalStatus: '' };
    setFilters(empty);
    setDebouncedFilters(empty);
    setPage(1);
  };

  const activeFilters = Object.values(filters).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-vd-bg">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Find Matches</h1>
            <p className="text-gray-500 mt-1">{total} profiles found</p>
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl border-2 font-medium transition-all ${showFilters ? 'border-vd-primary bg-vd-accent-soft dark:bg-vd-accent/20 text-vd-primary-dark' : 'border-gray-200 dark:border-gray-700 hover:border-vd-primary'}`}>
            <SlidersHorizontal className="w-4 h-4" />
            Filters {activeFilters > 0 && <span className="bg-vd-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">{activeFilters}</span>}
          </button>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-vd-bg-section dark:bg-vd-bg-card rounded-2xl p-6 mb-6 border border-vd-border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Filter Matches</h3>
              {activeFilters > 0 && (
                <button onClick={clearFilters} className="text-sm text-vd-primary flex items-center gap-1 hover:text-vd-primary-dark">
                  <X className="w-4 h-4" /> Clear all
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Age Min</label>
                <input type="number" min="18" max="70" value={filters.ageMin} onChange={e => updateFilter('ageMin', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-sm input-focus" placeholder="18" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Age Max</label>
                <input type="number" min="18" max="70" value={filters.ageMax} onChange={e => updateFilter('ageMax', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-sm input-focus" placeholder="40" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Religion</label>
                <select value={filters.religion} onChange={e => updateFilter('religion', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-sm input-focus">
                  <option value="">Any</option>
                  {religions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Country</label>
                <select value={filters.country} onChange={e => updateFilter('country', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-sm input-focus">
                  <option value="">Any</option>
                  {countries.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Education</label>
                <select value={filters.education} onChange={e => updateFilter('education', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-sm input-focus">
                  <option value="">Any</option>
                  {educations.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Height Min (cm)</label>
                <input type="number" value={filters.heightMin} onChange={e => updateFilter('heightMin', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-sm input-focus" placeholder="150" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Height Max (cm)</label>
                <input type="number" value={filters.heightMax} onChange={e => updateFilter('heightMax', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-sm input-focus" placeholder="190" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Marital Status</label>
                <select value={filters.maritalStatus} onChange={e => updateFilter('maritalStatus', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-sm input-focus">
                  <option value="">Any</option>
                  <option value="NEVER_MARRIED">Never Married</option>
                  <option value="DIVORCED">Divorced</option>
                  <option value="WIDOWED">Widowed</option>
                </select>
              </div>
            </div>
            <button onClick={() => { setDebouncedFilters(filters); setPage(1); }} className="mt-4 vd-gradient-gold text-white px-6 py-2 rounded-xl font-medium hover:opacity-90 transition-opacity">
              Apply Filters
            </button>
          </motion.div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(12)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">💔</div>
            <h3 className="text-xl font-semibold mb-2">No matches found</h3>
            <p className="text-gray-500 mb-4">Try adjusting your filters</p>
            <button onClick={clearFilters} className="vd-gradient-gold text-white px-6 py-2 rounded-xl font-medium">Clear Filters</button>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {users.map((u, i) => <ProfileCard key={u.id} user={u} index={i} />)}
            </div>

            {/* Premium gate banner */}
            {isLimited && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 relative rounded-3xl overflow-hidden"
              >
                {/* Blurred preview cards behind */}
                <div className="absolute inset-0 grid grid-cols-4 gap-4 p-4 opacity-30 blur-sm pointer-events-none select-none">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-2xl h-64" />
                  ))}
                </div>

                {/* Overlay */}
                <div className="relative z-10 vd-gradient-gold rounded-3xl p-8 text-white text-center">
                  <div className="text-5xl mb-4">🔒</div>
                  <h3 className="text-2xl font-bold mb-2">
                    {total - users.length}+ More Profiles Waiting!
                  </h3>
                  <p className="text-white/80 mb-2 text-sm max-w-md mx-auto">
                    You're seeing {users.length} of {total} compatible matches.
                    Upgrade to Premium to unlock all profiles, chat, and see contact details.
                  </p>
                  <div className="flex flex-wrap justify-center gap-3 mb-6 text-sm">
                    {['✅ All profiles unlocked', '💬 Unlimited chat', '📞 See contact details', '⭐ Profile boost'].map(f => (
                      <span key={f} className="bg-white/20 px-3 py-1 rounded-full">{f}</span>
                    ))}
                  </div>
                  <a href="/premium"
                    className="inline-block bg-white text-vd-primary font-bold px-8 py-3 rounded-2xl hover:bg-gray-50 transition-colors text-base shadow-lg">
                    Upgrade to Premium →
                  </a>
                </div>
              </motion.div>
            )}
          </>
        )}

        {/* Pagination — only for premium */}
        {isPremium && totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-10">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:border-vd-primary transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:border-vd-primary transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MatchesPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-vd-bg flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-vd-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <MatchesPage />
    </Suspense>
  );
}
