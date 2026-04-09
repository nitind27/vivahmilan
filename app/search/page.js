'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import ProfileCard from '@/components/ProfileCard';
import SkeletonCard from '@/components/SkeletonCard';
import SearchableSelect from '@/components/SearchableSelect';
import LocationPicker from '@/components/LocationPicker';

import {
  Search, SlidersHorizontal, X, ChevronDown, MapPin,
  GraduationCap, Heart, Users, Briefcase, RotateCcw, ChevronLeft, ChevronRight
} from 'lucide-react';
const RELIGIONS = ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Buddhist', 'Jain', 'Jewish', 'Other'];
const EDUCATIONS = ["High School", "Diploma", "Bachelor's", "Master's", "PhD", "MBBS", "CA", "Other"];
const PROFESSIONS = ['Software Engineer', 'Doctor', 'Teacher', 'Business', 'Lawyer', 'Engineer', 'Accountant', 'Other'];
const MARITAL = [
  { val: 'NEVER_MARRIED', label: 'Never Married' },
  { val: 'DIVORCED', label: 'Divorced' },
  { val: 'WIDOWED', label: 'Widowed' },
];

const DEFAULT_FILTERS = {
  q: '', gender: '', ageMin: '', ageMax: '',
  religion: '', country: '', state: '', city: '',
  education: '', profession: '', heightMin: '', heightMax: '',
  maritalStatus: '', income: '',
};

// ── Filter Chip ───────────────────────────────────────────────────────────────
function Chip({ label, onRemove }) {
  return (
    <motion.span initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      className="inline-flex items-center gap-1 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 text-xs px-3 py-1 rounded-full font-medium">
      {label}
      <button onClick={onRemove} className="hover:text-pink-900 dark:hover:text-pink-100 ml-0.5">
        <X className="w-3 h-3" />
      </button>
    </motion.span>
  );
}

// ── Select Field ──────────────────────────────────────────────────────────────
function FilterSelect({ label, value, onChange, options, icon: Icon }) {
  return (
    <div className="relative">
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />}
        <select value={value} onChange={e => onChange(e.target.value)}
          className={`w-full ${Icon ? 'pl-9' : 'pl-3'} pr-8 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-sm appearance-none cursor-pointer focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 dark:focus:ring-pink-900/30 transition-all`}>
          <option value="">Any</option>
          {options.map(o => (
            <option key={typeof o === 'string' ? o : o.val} value={typeof o === 'string' ? o : o.val}>
              {typeof o === 'string' ? o : o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}

// ── Range Input ───────────────────────────────────────────────────────────────
function RangeInput({ label, minVal, maxVal, onMinChange, onMaxChange, minPlaceholder, maxPlaceholder }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{label}</label>
      <div className="flex items-center gap-2">
        <input type="number" value={minVal} onChange={e => onMinChange(e.target.value)} placeholder={minPlaceholder}
          className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-sm focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 dark:focus:ring-pink-900/30 transition-all" />
        <span className="text-gray-400 text-xs flex-shrink-0">to</span>
        <input type="number" value={maxVal} onChange={e => onMaxChange(e.target.value)} placeholder={maxPlaceholder}
          className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-sm focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 dark:focus:ring-pink-900/30 transition-all" />
      </div>
    </div>
  );
}

// ── Main Search Inner ─────────────────────────────────────────────────────────
function SearchInner() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS, q: searchParams.get('q') || '' });
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  const set = (key, val) => setFilters(prev => ({ ...prev, [key]: val }));

  const activeFilters = Object.entries(filters).filter(([k, v]) => v && k !== 'q').map(([k, v]) => {
    const labels = { gender: v, ageMin: `Age ≥ ${v}`, ageMax: `Age ≤ ${v}`, religion: v, country: v, state: v, city: v, education: v, profession: v, heightMin: `Height ≥ ${v}cm`, heightMax: `Height ≤ ${v}cm`, maritalStatus: MARITAL.find(m => m.val === v)?.label || v, income: v };
    return { key: k, label: labels[k] || v };
  });

  const doSearch = useCallback(async (pg = 1) => {
    setLoading(true);
    setSearched(true);
    const params = new URLSearchParams({ page: pg, limit: 12 });
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    try {
      const res = await fetch(`/api/search?${params}`);
      const data = await res.json();
      setResults(data.users || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
      setPage(pg);
    } finally { setLoading(false); }
  }, [filters]);

  const reset = () => { setFilters(DEFAULT_FILTERS); setResults([]); setSearched(false); setTotal(0); };

  const handleKeyDown = (e) => { if (e.key === 'Enter') doSearch(1); };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />

      {/* ── Hero search bar ── */}
      <div className="gradient-bg pt-24 pb-10 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Find Your Perfect Match
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            className="text-white/70 mb-6 text-sm">
            Search by name, profession, city and more
          </motion.p>

          {/* Search input */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                value={filters.q}
                onChange={e => set('q', e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search by name, profession, city…"
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl text-sm bg-white dark:bg-gray-800 shadow-lg focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
              />
              {filters.q && (
                <button onClick={() => set('q', '')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button onClick={() => doSearch(1)}
              className="bg-white text-pink-600 font-semibold px-6 py-3.5 rounded-2xl shadow-lg hover:bg-pink-50 transition-colors flex items-center gap-2 flex-shrink-0">
              <Search className="w-4 h-4" /> Search
            </button>
          </motion.div>

          {/* Quick gender filter */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="flex justify-center gap-2 mt-4">
            {[{ val: '', label: 'All' }, { val: 'FEMALE', label: '👩 Brides' }, { val: 'MALE', label: '👨 Grooms' }].map(g => (
              <button key={g.val} onClick={() => { set('gender', g.val); }}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${filters.gender === g.val ? 'bg-white text-pink-600 shadow' : 'bg-white/20 text-white hover:bg-white/30'}`}>
                {g.label}
              </button>
            ))}
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* ── Filter toggle + active chips ── */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <button onClick={() => setShowFilters(p => !p)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all ${showFilters ? 'gradient-bg text-white border-transparent' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-pink-300'}`}>
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {activeFilters.length > 0 && (
              <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${showFilters ? 'bg-white text-pink-600' : 'gradient-bg text-white'}`}>
                {activeFilters.length}
              </span>
            )}
          </button>

          {/* Active filter chips */}
          <AnimatePresence>
            {activeFilters.map(f => (
              <Chip key={f.key} label={f.label} onRemove={() => set(f.key, '')} />
            ))}
          </AnimatePresence>

          {activeFilters.length > 0 && (
            <button onClick={reset} className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors ml-1">
              <RotateCcw className="w-3 h-3" /> Reset all
            </button>
          )}

          {searched && (
            <span className="ml-auto text-sm text-gray-500">
              {total} result{total !== 1 ? 's' : ''} found
            </span>
          )}
        </div>

        {/* ── Filter Panel ── */}
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  <FilterSelect label="Religion" value={filters.religion} onChange={v => set('religion', v)} options={RELIGIONS} icon={Heart} />
                  <FilterSelect label="Education" value={filters.education} onChange={v => set('education', v)} options={EDUCATIONS} icon={GraduationCap} />
                  <FilterSelect label="Profession" value={filters.profession} onChange={v => set('profession', v)} options={PROFESSIONS} icon={Briefcase} />
                  <FilterSelect label="Marital Status" value={filters.maritalStatus} onChange={v => set('maritalStatus', v)} options={MARITAL} icon={Users} />

                  {/* Location cascade */}
                  <div className="col-span-2 sm:col-span-3 lg:col-span-4">
                    <LocationPicker
                      country={filters.country}
                      state={filters.state}
                      city={filters.city}
                      onCountryChange={(name) => setFilters(p => ({ ...p, country: name, state: '', city: '' }))}
                      onStateChange={(name) => setFilters(p => ({ ...p, state: name, city: '' }))}
                      onCityChange={(name) => setFilters(p => ({ ...p, city: name }))}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">State / Province</label>
                    <input value={filters.state} onChange={e => set('state', e.target.value)} placeholder="e.g. Maharashtra"
                      className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-sm focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 dark:focus:ring-pink-900/30 transition-all" />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">City</label>
                    <input value={filters.city} onChange={e => set('city', e.target.value)} placeholder="e.g. Mumbai"
                      className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-sm focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 dark:focus:ring-pink-900/30 transition-all" />
                  </div>

                  <RangeInput label="Age Range" minVal={filters.ageMin} maxVal={filters.ageMax}
                    onMinChange={v => set('ageMin', v)} onMaxChange={v => set('ageMax', v)}
                    minPlaceholder="18" maxPlaceholder="50" />

                  <RangeInput label="Height (cm)" minVal={filters.heightMin} maxVal={filters.heightMax}
                    onMinChange={v => set('heightMin', v)} onMaxChange={v => set('heightMax', v)}
                    minPlaceholder="150" maxPlaceholder="190" />
                </div>

                <div className="flex gap-3 mt-5 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <button onClick={() => { doSearch(1); setShowFilters(false); }}
                    className="gradient-bg text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity flex items-center gap-2">
                    <Search className="w-4 h-4" /> Apply & Search
                  </button>
                  <button onClick={reset} className="border border-gray-200 dark:border-gray-600 px-5 py-2.5 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <RotateCcw className="w-4 h-4" /> Reset
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Results ── */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : !searched ? (
          /* Initial state */
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-center py-20">
            <div className="w-24 h-24 gradient-bg rounded-full flex items-center justify-center mx-auto mb-5 opacity-80">
              <Search className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">Start Your Search</h3>
            <p className="text-gray-400 text-sm max-w-xs mx-auto">
              Type a name, city, or profession above — or use filters to find your perfect match.
            </p>
            {/* Quick suggestion tags */}
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {['Mumbai', 'Software Engineer', 'Hindu', 'Canada', 'Doctor', 'London'].map(tag => (
                <button key={tag} onClick={() => { set('q', tag); doSearch(1); }}
                  className="px-4 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm text-gray-600 dark:text-gray-400 hover:border-pink-400 hover:text-pink-500 transition-all">
                  {tag}
                </button>
              ))}
            </div>
          </motion.div>
        ) : results.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">No results found</h3>
            <p className="text-gray-400 text-sm mb-5">Try different keywords or remove some filters</p>
            <button onClick={reset} className="gradient-bg text-white px-6 py-2.5 rounded-xl font-medium text-sm hover:opacity-90 transition-opacity">
              Clear All Filters
            </button>
          </motion.div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {results.map((u, i) => <ProfileCard key={u.id} user={u} index={i} />)}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-10">
                <button onClick={() => doSearch(page - 1)} disabled={page === 1}
                  className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:border-pink-400 transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex gap-1">
                  {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                    const pg = i + 1;
                    return (
                      <button key={pg} onClick={() => doSearch(pg)}
                        className={`w-9 h-9 rounded-xl text-sm font-medium transition-all ${pg === page ? 'gradient-bg text-white' : 'border border-gray-200 dark:border-gray-700 hover:border-pink-400'}`}>
                        {pg}
                      </button>
                    );
                  })}
                </div>
                <button onClick={() => doSearch(page + 1)} disabled={page === totalPages}
                  className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:border-pink-400 transition-colors">
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

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 pt-24">
          <div className="h-16 skeleton rounded-2xl mb-6" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      </div>
    }>
      <SearchInner />
    </Suspense>
  );
}
