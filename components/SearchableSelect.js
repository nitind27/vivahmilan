'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, X, Check } from 'lucide-react';

/**
 * SearchableSelect — dropdown with search filter + group headers
 * Props:
 *   label        string
 *   value        string
 *   onChange     (val: string) => void
 *   options      Array<{ val, label, group? }> | string[]
 *   placeholder  string
 *   required     bool
 *   className    string
 */
export default function SearchableSelect({
  label, value, onChange, options = [],
  placeholder = 'Select or search…', required = false, className = '',
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Normalize options
  const normalized = useMemo(() =>
    options.map(o => typeof o === 'string' ? { val: o, label: o, group: '' } : o),
    [options]
  );

  // Filter by query
  const filtered = useMemo(() => {
    if (!query.trim()) return normalized;
    const q = query.toLowerCase();
    return normalized.filter(o =>
      o.label.toLowerCase().includes(q) ||
      (o.group && o.group.toLowerCase().includes(q))
    );
  }, [normalized, query]);

  // Group filtered results
  const grouped = useMemo(() => {
    const map = new Map();
    filtered.forEach(o => {
      const g = o.group || '';
      if (!map.has(g)) map.set(g, []);
      map.get(g).push(o);
    });
    return map;
  }, [filtered]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const selectedLabel = normalized.find(o => o.val === value)?.label || '';

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
    setQuery('');
  };

  const clear = (e) => {
    e.stopPropagation();
    onChange('');
    setQuery('');
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
          {label}{required && <span className="text-pink-500 ml-0.5">*</span>}
        </label>
      )}

      {/* Trigger */}
      <button type="button" onClick={() => setOpen(p => !p)}
        className={`w-full flex items-center justify-between px-3 py-2.5 border-2 rounded-xl bg-white dark:bg-gray-700 text-sm transition-all text-left ${
          open ? 'border-pink-400 ring-2 ring-pink-100 dark:ring-pink-900/20' : 'border-gray-200 dark:border-gray-600 hover:border-pink-300'
        }`}>
        <span className={selectedLabel ? 'text-gray-900 dark:text-white' : 'text-gray-400'}>
          {selectedLabel || placeholder}
        </span>
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          {value && (
            <span onClick={clear} className="p-0.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-400 hover:text-red-500 transition-colors">
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-2xl shadow-2xl overflow-hidden"
          style={{ maxHeight: 320 }}>

          {/* Search input */}
          <div className="p-2 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search…"
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-pink-400 transition-all"
              />
              {query && (
                <button onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {query && (
              <p className="text-xs text-gray-400 mt-1 px-1">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</p>
            )}
          </div>

          {/* Options list */}
          <div className="overflow-y-auto" style={{ maxHeight: 240 }}>
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-400">No results for "{query}"</div>
            ) : (
              Array.from(grouped.entries()).map(([group, items]) => (
                <div key={group}>
                  {group && (
                    <div className="px-3 py-1.5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                      {group}
                    </div>
                  )}
                  {items.map(opt => (
                    <button key={opt.val} type="button" onClick={() => handleSelect(opt.val)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left hover:bg-pink-50 dark:hover:bg-pink-900/10 transition-colors ${
                        value === opt.val ? 'bg-pink-50 dark:bg-pink-900/10 text-pink-600 dark:text-pink-400 font-medium' : 'text-gray-700 dark:text-gray-300'
                      }`}>
                      <span>{opt.label}</span>
                      {value === opt.val && <Check className="w-4 h-4 text-pink-500 flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
