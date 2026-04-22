'use client';
import { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, AlertCircle } from 'lucide-react';

const inputCls = "w-full px-4 py-3 border rounded-2xl bg-vd-bg-section text-sm text-vd-text-heading placeholder:text-vd-text-light focus:outline-none focus:ring-2 focus:ring-vd-accent-soft transition-all";

export default function BirthLocationSearch({ value, onChange, error }) {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const search = async (q) => {
    if (!q || q.trim().length < 2) {
      setSuggestions([]);
      setNoResults(false);
      setNetworkError(false);
      setOpen(false);
      return;
    }
    setLoading(true);
    setNetworkError(false);
    setNoResults(false);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5`,
        { headers: { 'User-Agent': 'VivahDwar/1.0 (matrimonial app)' } }
      );
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();
      setSuggestions(data);
      setNoResults(data.length === 0);
      setOpen(true);
    } catch {
      setNetworkError(true);
      setSuggestions([]);
      setOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleInput = (e) => {
    const val = e.target.value;
    setQuery(val);
    // Clear selection if user types again
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 400);
  };

  const handleSelect = (item) => {
    const place = item.display_name;
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    setQuery(place);
    setSuggestions([]);
    setOpen(false);
    onChange({ place, lat, lng });
  };

  const borderColor = error ? 'border-red-400' : 'border-vd-border focus:border-vd-primary';

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vd-text-light pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={handleInput}
          onFocus={() => (suggestions.length > 0 || noResults || networkError) && setOpen(true)}
          placeholder="Search birth city or town…"
          className={`${inputCls} ${borderColor} pl-9 pr-9`}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vd-primary animate-spin" />
        )}
      </div>

      {error && (
        <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {error}
        </p>
      )}

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-vd-bg-section border border-vd-border rounded-2xl shadow-lg overflow-hidden">
          {networkError && (
            <div className="px-4 py-3 text-sm text-red-500 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              Location search unavailable. Please try again.
            </div>
          )}
          {noResults && !networkError && (
            <div className="px-4 py-3 text-sm text-vd-text-light">
              No places found. Try a different search.
            </div>
          )}
          {suggestions.map((item) => (
            <button
              key={item.place_id}
              type="button"
              onMouseDown={() => handleSelect(item)}
              className="w-full text-left px-4 py-3 text-sm text-vd-text-heading hover:bg-vd-accent-soft transition-colors border-b border-vd-border last:border-0 flex items-start gap-2"
            >
              <MapPin className="w-4 h-4 text-vd-primary flex-shrink-0 mt-0.5" />
              <span className="line-clamp-2">{item.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
