'use client';
import { useState, useEffect } from 'react';

const cache = {};

export function useProfileOptions(category) {
  const [options, setOptions] = useState(cache[category] || []);
  const [loading, setLoading] = useState(!cache[category]);

  useEffect(() => {
    if (!category) return;
    if (cache[category]) { setOptions(cache[category]); setLoading(false); return; }
    fetch(`/api/profile-options?category=${category}`)
      .then(r => r.json())
      .then(data => {
        cache[category] = data;
        setOptions(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [category]);

  // Convert to SearchableSelect format
  const asSelectOptions = options.map(o => ({ val: o.value, label: o.label, group: o.group || '' }));
  // Convert to simple string array
  const asStringArray = options.map(o => o.value);

  return { options, asSelectOptions, asStringArray, loading };
}

// Fetch multiple categories at once
export function useMultipleOptions(categories) {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!categories?.length) return;
    const uncached = categories.filter(c => !cache[c]);
    if (uncached.length === 0) {
      const result = {};
      categories.forEach(c => { result[c] = cache[c] || []; });
      setData(result);
      setLoading(false);
      return;
    }
    Promise.all(
      uncached.map(c => fetch(`/api/profile-options?category=${c}`).then(r => r.json()).then(d => ({ c, d })))
    ).then(results => {
      results.forEach(({ c, d }) => { cache[c] = d; });
      const result = {};
      categories.forEach(c => { result[c] = cache[c] || []; });
      setData(result);
      setLoading(false);
    });
  }, [categories?.join(',')]);

  return { data, loading };
}
