'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, X, Check } from 'lucide-react';

export default function SearchableSelect({
  label, value, onChange, options = [],
  placeholder = 'Select or search…', required = false, className = '',
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const normalized = useMemo(() =>
    options.map(o => typeof o === 'string' ? { val: o, label: o, group: '' } : o),
    [options]
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return normalized;
    const q = query.toLowerCase();
    return normalized.filter(o =>
      o.label.toLowerCase().includes(q) ||
      (o.group && o.group.toLowerCase().includes(q))
    );
  }, [normalized, query]);

  const grouped = useMemo(() => {
    const map = new Map();
    filtered.forEach(o => {
      const g = o.group || '';
      if (!map.has(g)) map.set(g, []);
      map.get(g).push(o);
    });
    return map;
  }, [filtered]);

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
        <label className="block text-xs font-semibold text-vd-text-light mb-1.5 uppercase tracking-wide">
          {label}{required && <span className="text-vd-primary ml-0.5">*</span>}
        </label>
      )}

      {/* Trigger */}
      <button type="button" onClick={() => setOpen(p => !p)}
        className={`w-full flex items-center justify-between px-4 py-3 border-2 rounded-2xl bg-vd-bg-section text-sm transition-all text-left ${
          open
            ? 'border-vd-primary ring-2 ring-vd-accent-soft'
            : 'border-vd-border hover:border-vd-primary'
        }`}>
        <span className={selectedLabel ? 'text-vd-text-heading' : 'text-vd-text-light'}>
          {selectedLabel || placeholder}
        </span>
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          {value && (
            <span onClick={clear}
              className="p-0.5 rounded-full hover:bg-vd-accent-soft text-vd-text-light hover:text-vd-primary transition-colors">
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-vd-text-light transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-vd-bg-section border border-vd-border rounded-2xl shadow-2xl overflow-hidden"
          style={{ maxHeight: 320 }}>

          {/* Search input */}
          <div className="p-2 border-b border-vd-border sticky top-0 bg-vd-bg-section">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vd-text-light" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search…"
                className="w-full pl-9 pr-3 py-2 text-sm bg-vd-bg border border-vd-border rounded-xl text-vd-text-heading placeholder:text-vd-text-light focus:outline-none focus:border-vd-primary transition-all"
              />
              {query && (
                <button onClick={() => setQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-vd-text-light hover:text-vd-text-sub">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {query && (
              <p className="text-xs text-vd-text-light mt-1 px-1">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</p>
            )}
          </div>

          {/* Options list */}
          <div className="overflow-y-auto" style={{ maxHeight: 240 }}>
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-vd-text-light">No results for "{query}"</div>
            ) : (
              Array.from(grouped.entries()).map(([group, items]) => (
                <div key={group}>
                  {group && (
                    <div className="px-3 py-1.5 text-xs font-bold text-vd-text-light uppercase tracking-wider bg-vd-bg-alt sticky top-0">
                      {group}
                    </div>
                  )}
                  {items.map(opt => (
                    <button key={opt.val} type="button" onClick={() => handleSelect(opt.val)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors ${
                        value === opt.val
                          ? 'bg-vd-accent-soft text-vd-primary font-medium'
                          : 'text-vd-text-sub hover:bg-vd-accent-soft hover:text-vd-text-heading'
                      }`}>
                      <span>{opt.label}</span>
                      {value === opt.val && <Check className="w-4 h-4 text-vd-primary flex-shrink-0" />}
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
