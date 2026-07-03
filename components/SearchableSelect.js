'use client';
import { useState, useRef, useEffect, useMemo, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, X, Check } from 'lucide-react';

export default function SearchableSelect({
  label, value, onChange, options = [],
  placeholder = 'Select or search…', required = false, className = '',
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [mounted, setMounted] = useState(false);
  const [menuStyle, setMenuStyle] = useState({});
  const containerRef = useRef(null);
  const menuRef = useRef(null);
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

  useEffect(() => { setMounted(true); }, []);

  const updateMenuPosition = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const maxH = 320;
    const spaceBelow = window.innerHeight - rect.bottom - 8;
    const spaceAbove = rect.top - 8;
    const openUp = spaceBelow < 200 && spaceAbove > spaceBelow;
    const height = Math.min(maxH, openUp ? spaceAbove : spaceBelow);

    setMenuStyle({
      position: 'fixed',
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
      maxHeight: height,
      ...(openUp
        ? { bottom: window.innerHeight - rect.top + 4 }
        : { top: rect.bottom + 4 }),
    });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updateMenuPosition();
    const onScrollOrResize = () => updateMenuPosition();
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [open]);

  useEffect(() => {
    const handler = (e) => {
      const inTrigger = containerRef.current?.contains(e.target);
      const inMenu = menuRef.current?.contains(e.target);
      if (!inTrigger && !inMenu) {
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
    e.preventDefault();
    e.stopPropagation();
    onChange('');
    setQuery('');
  };

  const menu = open && mounted ? (
    <div
      ref={menuRef}
      style={menuStyle}
      className="bg-vd-bg-section border border-vd-border rounded-2xl shadow-2xl overflow-hidden"
    >
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
            <button type="button" onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-vd-text-light hover:text-vd-text-sub">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {query && (
          <p className="text-xs text-vd-text-light mt-1 px-1">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</p>
        )}
      </div>

      <div className="overflow-y-auto" style={{ maxHeight: Math.max(120, (menuStyle.maxHeight || 320) - 56) }}>
        {filtered.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-vd-text-light">
            {query ? `No results for "${query}"` : 'No options available'}
          </div>
        ) : (
          Array.from(grouped.entries()).map(([group, items]) => (
            <div key={group || 'default'}>
              {group && (
                <div className="px-3 py-1.5 text-xs font-bold text-vd-text-light uppercase tracking-wider bg-vd-bg-alt sticky top-0">
                  {group}
                </div>
              )}
              {items.map(opt => (
                <button key={opt.val} type="button" onMouseDown={e => e.preventDefault()} onClick={() => handleSelect(opt.val)}
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
  ) : null;

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold text-vd-text-light mb-1.5 uppercase tracking-wide">
          {label}{required && <span className="text-vd-primary ml-0.5">*</span>}
        </label>
      )}

      <div
        role="combobox"
        aria-expanded={open}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!disabled) setOpen(p => !p); } }}
        onClick={() => !disabled && setOpen(p => !p)}
        className={`w-full flex items-center justify-between px-4 py-3 border-2 rounded-2xl bg-vd-bg-section text-sm transition-all text-left cursor-pointer ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        } ${
          open
            ? 'border-vd-primary ring-2 ring-vd-accent-soft'
            : 'border-vd-border hover:border-vd-primary'
        }`}
      >
        <span className={selectedLabel ? 'text-vd-text-heading' : 'text-vd-text-light'}>
          {selectedLabel || placeholder}
        </span>
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          {value && !disabled && (
            <button type="button" onClick={clear}
              className="p-0.5 rounded-full hover:bg-vd-accent-soft text-vd-text-light hover:text-vd-primary transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-vd-text-light transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {mounted && menu && createPortal(menu, document.body)}
    </div>
  );
}
