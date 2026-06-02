'use client';
import { useEffect, useMemo, useState } from 'react';
import SearchableSelect from '@/components/SearchableSelect';
import {
  getCastesByReligion,
  getCasteCategoriesByReligion,
  getCasteRegionsByReligion,
  getCommunityFieldLabel,
} from '@/lib/casteData';

const labelCls = 'block text-xs font-semibold text-vd-text-light mb-1.5 uppercase tracking-wide';
const selectCls =
  'w-full px-4 py-3 border border-vd-border rounded-2xl bg-vd-bg-section text-sm text-vd-text-heading focus:outline-none focus:border-vd-primary focus:ring-2 focus:ring-vd-accent-soft transition-all';

/**
 * Religion-aware community picker: Category → State → Searchable community list
 */
export default function CasteCommunitySelect({
  religion,
  value,
  onChange,
  required = false,
  className = '',
}) {
  const [category, setCategory] = useState('');
  const [region, setRegion] = useState('');

  const categories = useMemo(
    () => (religion ? getCasteCategoriesByReligion(religion).filter((c) => c !== 'Other') : []),
    [religion]
  );

  const regions = useMemo(
    () => (religion && category ? getCasteRegionsByReligion(religion, category) : []),
    [religion, category]
  );

  const allOptions = useMemo(
    () => (religion ? getCastesByReligion(religion) : []),
    [religion]
  );

  const filteredOptions = useMemo(() => {
    if (!category && !region) return allOptions;
    return allOptions.filter((o) => {
      if (category && o.category !== category) return false;
      if (region && o.region !== region) return false;
      return true;
    });
  }, [allOptions, category, region]);

  const fieldLabel = getCommunityFieldLabel(religion);
  const showFilters = categories.length > 1;

  useEffect(() => {
    setCategory('');
    setRegion('');
  }, [religion]);

  useEffect(() => {
    if (!value || !religion) return;
    const match = allOptions.find((o) => o.val === value);
    if (match?.category) {
      setCategory(match.category);
      if (match.region) setRegion(match.region);
    }
  }, [value, religion, allOptions]);

  if (!religion) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-2xl bg-vd-bg-alt/60 border border-vd-border">
          <div>
            <label className={labelCls}>Community type</label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setRegion('');
                onChange('');
              }}
              className={selectCls}
            >
              <option value="">All types — search below</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>State / region</label>
            <select
              value={region}
              onChange={(e) => {
                setRegion(e.target.value);
                onChange('');
              }}
              disabled={!category}
              className={`${selectCls} disabled:opacity-50`}
            >
              <option value="">{category ? 'All regions in type' : 'Select type first'}</option>
              {regions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          {category && (
            <p className="sm:col-span-2 text-xs text-vd-text-sub">
              Filter: <span className="font-semibold text-vd-text-heading">{category}</span>
              {region ? (
                <> — <span className="font-semibold text-vd-text-heading">{region}</span></>
              ) : null}
              {' '}({filteredOptions.length} options)
            </p>
          )}
        </div>
      )}

      <SearchableSelect
        label={`${fieldLabel}${required ? ' *' : ''}`}
        value={value}
        onChange={onChange}
        options={filteredOptions}
        placeholder={
          religion === 'Hindu'
            ? 'Search e.g. Brahmin UP, Ahir Gujarat…'
            : `Search ${fieldLabel.toLowerCase()}…`
        }
        required={required}
      />
    </div>
  );
}
