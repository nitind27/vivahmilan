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
      className="inline-flex items-center gap-1 bg-vd-accent-soft dark:bg-vd-accent/30 text-vd-primary dark:text-vd-primary text-xs px-3 py-1 rounded-full font-medium">
      {label}
      <button onClick={onRemove} className="hover:text-vd-primary-dark dark:hover:text-vd-primary-light ml-0.5">
        <X className="w-3 h-3" />
      </button>
    </motion.span>
  );
}

// ── Select Field ──────────────────────────────────────────────────────────────
function FilterSelect({ label, value, onChange, options, icon: Icon }) {
  return (
    <div className="relative">
      <label className="block text-xs font-semibold text-vd-text-light mb-1.5 uppercase tracking-wide">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vd-text-light pointer-events-none" />}
        <select value={value} onChange={e => onChange(e.target.value)}
          className={`w-full ${Icon ? 'pl-9' : 'pl-3'} pr-8 py-2.5 border border-vd-border rounded-2xl bg-vd-bg-section text-sm text-vd-text-heading appearance-none cursor-pointer focus:outline-none focus:border-vd-primary focus:ring-2 focus:ring-vd-accent-soft transition-all`}>
          <option value="">Any</option>
          {options.map(o => (
            <option key={typeof o === 'string' ? o : o.val} value={typeof o === 'string' ? o : o.val}>
              {typeof o === 'string' ? o : o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-vd-text-light pointer-events-none" />
      </div>
    </div>
  );
}

// ── Range Input ───────────────────────────────────────────────────────────────
function RangeInput({ label, minVal, maxVal, onMinChange, onMaxChange, minPlaceholder, maxPlaceholder }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-vd-text-light mb-1.5 uppercase tracking-wide">{label}</label>
      <div className="flex items-center gap-2">
        <input type="number" value={minVal} onChange={e => onMinChange(e.target.value)} placeholder={minPlaceholder}
          className="w-full px-3 py-2.5 border border-vd-border rounded-2xl bg-vd-bg-section text-sm text-vd-text-heading placeholder:text-vd-text-light focus:outline-none focus:border-vd-primary focus:ring-2 focus:ring-vd-accent-soft transition-all" />
        <span className="text-vd-text-light text-xs flex-shrink-0">to</span>
        <input type="number" value={maxVal} onChange={e => onMaxChange(e.target.value)} placeholder={maxPlaceholder}
          className="w-full px-3 py-2.5 border border-vd-border rounded-2xl bg-vd-bg-section text-sm text-vd-text-heading placeholder:text-vd-text-light focus:outline-none focus:border-vd-primary focus:ring-2 focus:ring-vd-accent-soft transition-all" />
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
    <div className="min-h-screen bg-vd-bg">
      <Navbar />

      {/* ── Hero search bar ── */}
      <div className="pt-24 pb-12 px-4" style={{ background: 'linear-gradient(135deg, #A67C3D 0%, #C8A45C 40%, #D4AF37 70%, #A67C3D 100%)' }}>
        <div className="max-w-3xl mx-auto text-center">
          <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl font-black mb-2 leading-tight"
            style={{ color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.25)' }}>
            Find Your Perfect Match
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            className="mb-7 text-sm font-medium"
            style={{ color: 'rgba(255,255,255,0.9)' }}>
            Search by name, profession, city and more
          </motion.p>

          {/* Search input */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-vd-text-light" />
              <input
                value={filters.q}
                onChange={e => set('q', e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search by name, profession, city…"
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl text-sm bg-vd-bg-section text-vd-text-heading placeholder:text-vd-text-light shadow-xl focus:outline-none focus:ring-2 focus:ring-white/40 transition-all"
              />
              {filters.q && (
                <button onClick={() => set('q', '')} className="absolute right-3 top-1/2 -translate-y-1/2 text-vd-text-light hover:text-vd-text-sub">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button onClick={() => doSearch(1)}
              className="font-semibold px-6 py-3.5 rounded-2xl shadow-xl transition-all flex items-center gap-2 flex-shrink-0"
              style={{ background: 'rgba(0,0,0,0.2)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.4)', backdropFilter: 'blur(8px)' }}>
              <Search className="w-4 h-4" /> Search
            </button>
          </motion.div>

          {/* Quick gender filter */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="flex justify-center gap-2 mt-5">
            {[{ val: '', label: 'All' }, { val: 'FEMALE', label: '👩 Brides' }, { val: 'MALE', label: '👨 Grooms' }].map(g => (
              <button key={g.val} onClick={() => set('gender', g.val)}
                className="px-4 py-1.5 rounded-full text-sm font-semibold transition-all"
                style={filters.gender === g.val
                  ? { background: '#fff', color: '#A67C3D', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }
                  : { background: 'rgba(255,255,255,0.18)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }
                }>
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
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all ${showFilters ? 'vd-gradient-gold text-white border-transparent' : 'bg-vd-bg-section dark:bg-vd-bg-card border-vd-border hover:border-vd-primary'}`}>
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {activeFilters.length > 0 && (
              <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${showFilters ? 'bg-white text-vd-primary' : 'vd-gradient-gold text-white'}`}>
                {activeFilters.length}
              </span>
            )}
          </button>

          <AnimatePresence>
            {activeFilters.map(f => (
              <Chip key={f.key} label={f.label} onRemove={() => set(f.key, '')} />
            ))}
          </AnimatePresence>

          {activeFilters.length > 0 && (
            <button onClick={reset} className="flex items-center gap-1 text-xs text-vd-text-light hover:text-red-500 transition-colors ml-1">
              <RotateCcw className="w-3 h-3" /> Reset all
            </button>
          )}

          {searched && (
            <span className="ml-auto text-sm text-vd-text-light">
              {total} result{total !== 1 ? 's' : ''} found
            </span>
          )}
        </div>

        {/* ── Filter Panel ── */}
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-6">
              <div className="bg-vd-bg-section dark:bg-vd-bg-card rounded-2xl border border-vd-border p-5 shadow-sm">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  <FilterSelect label="Religion" value={filters.religion} onChange={v => set('religion', v)} options={RELIGIONS} icon={Heart} />
                  <FilterSelect label="Education" value={filters.education} onChange={v => set('education', v)} options={EDUCATIONS} icon={GraduationCap} />
                  <FilterSelect label="Profession" value={filters.profession} onChange={v => set('profession', v)} options={PROFESSIONS} icon={Briefcase} />
                  <FilterSelect label="Marital Status" value={filters.maritalStatus} onChange={v => set('maritalStatus', v)} options={MARITAL} icon={Users} />

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
                    <label className="block text-xs font-semibold text-vd-text-light mb-1.5 uppercase tracking-wide">State / Province</label>
                    <input value={filters.state} onChange={e => set('state', e.target.value)} placeholder="e.g. Maharashtra"
                      className="w-full px-3 py-2.5 border border-vd-border rounded-2xl bg-vd-bg-section text-sm text-vd-text-heading placeholder:text-vd-text-light focus:outline-none focus:border-vd-primary focus:ring-2 focus:ring-vd-accent-soft transition-all" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-vd-text-light mb-1.5 uppercase tracking-wide">City</label>
                    <input value={filters.city} onChange={e => set('city', e.target.value)} placeholder="e.g. Mumbai"
                      className="w-full px-3 py-2.5 border border-vd-border rounded-2xl bg-vd-bg-section text-sm text-vd-text-heading placeholder:text-vd-text-light focus:outline-none focus:border-vd-primary focus:ring-2 focus:ring-vd-accent-soft transition-all" />
                  </div>

                  <RangeInput label="Age Range" minVal={filters.ageMin} maxVal={filters.ageMax}
                    onMinChange={v => set('ageMin', v)} onMaxChange={v => set('ageMax', v)}
                    minPlaceholder="18" maxPlaceholder="50" />

                  <RangeInput label="Height (cm)" minVal={filters.heightMin} maxVal={filters.heightMax}
                    onMinChange={v => set('heightMin', v)} onMaxChange={v => set('heightMax', v)}
                    minPlaceholder="150" maxPlaceholder="190" />
                </div>

                <div className="flex gap-3 mt-5 pt-4 border-t border-vd-border">
                  <button onClick={() => { doSearch(1); setShowFilters(false); }}
                    className="vd-gradient-gold text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity flex items-center gap-2">
                    <Search className="w-4 h-4" /> Apply & Search
                  </button>
                  <button onClick={reset} className="border border-vd-border px-5 py-2.5 rounded-2xl text-sm hover:bg-vd-accent-soft transition-colors flex items-center gap-2 text-vd-text-sub">
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
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-center py-20">
            <div className="w-24 h-24 vd-gradient-gold rounded-full flex items-center justify-center mx-auto mb-5 opacity-80">
              <Search className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-xl font-bold text-vd-text-heading mb-2">Start Your Search</h3>
            <p className="text-vd-text-sub text-sm max-w-xs mx-auto">
              Type a name, city, or profession above — or use filters to find your perfect match.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {['Mumbai', 'Software Engineer', 'Hindu', 'Canada', 'Doctor', 'London'].map(tag => (
                <button key={tag} onClick={() => { set('q', tag); doSearch(1); }}
                  className="px-4 py-1.5 bg-vd-bg-section dark:bg-vd-bg-card border border-vd-border rounded-full text-sm text-gray-600 dark:text-gray-400 hover:border-vd-primary hover:text-vd-primary transition-all">
                  {tag}
                </button>
              ))}
            </div>
          </motion.div>
        ) : results.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-vd-text-sub mb-2">No results found</h3>
            <p className="text-vd-text-light text-sm mb-5">Try different keywords or remove some filters</p>
            <button onClick={reset} className="vd-gradient-gold text-white px-6 py-2.5 rounded-xl font-medium text-sm hover:opacity-90 transition-opacity">
              Clear All Filters
            </button>
          </motion.div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {results.map((u, i) => <ProfileCard key={u.id} user={u} index={i} />)}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-10">
                <button onClick={() => doSearch(page - 1)} disabled={page === 1}
                  className="p-2.5 rounded-xl border border-vd-border disabled:opacity-40 hover:border-vd-primary transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex gap-1">
                  {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                    const pg = i + 1;
                    return (
                      <button key={pg} onClick={() => doSearch(pg)}
                        className={`w-9 h-9 rounded-xl text-sm font-medium transition-all ${pg === page ? 'vd-gradient-gold text-white' : 'border border-vd-border hover:border-vd-primary'}`}>
                        {pg}
                      </button>
                    );
                  })}
                </div>
                <button onClick={() => doSearch(page + 1)} disabled={page === totalPages}
                  className="p-2.5 rounded-xl border border-vd-border disabled:opacity-40 hover:border-vd-primary transition-colors">
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
      <div className="min-h-screen bg-vd-bg">
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
