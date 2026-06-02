'use client';
import { useEffect, useMemo, useState } from 'react';
import SearchableSelect from '@/components/SearchableSelect';
import {
  getCastesByReligion,
  getCasteCategoriesByReligion,
  getCasteRegionsByReligion,
  getCommunityFieldLabel,
} from '@/lib/casteData';

/** Internal select value — never stored in DB; user types real caste/community instead */
export const CASTE_OTHER_SELECT_VALUE = '__OTHER__';

const labelCls = 'block text-xs font-semibold text-vd-text-light mb-1.5 uppercase tracking-wide';
const inputCls =
  'w-full px-4 py-3 border border-vd-border rounded-2xl bg-vd-bg-section text-sm text-vd-text-heading placeholder:text-vd-text-light focus:outline-none focus:border-vd-primary focus:ring-2 focus:ring-vd-accent-soft transition-all';
const selectCls =
  'w-full px-4 py-3 border border-vd-border rounded-2xl bg-vd-bg-section text-sm text-vd-text-heading focus:outline-none focus:border-vd-primary focus:ring-2 focus:ring-vd-accent-soft transition-all';

const OTHER_OPTION = {
  val: CASTE_OTHER_SELECT_VALUE,
  label: 'Other — not in list (type below)',
  group: 'Other',
};

function isListedValue(value, options) {
  if (!value || value === CASTE_OTHER_SELECT_VALUE) return false;
  return options.some((o) => o.val === value);
}

/**
 * Religion-aware community picker: Category → State → list, or Other + custom text
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
  const [customMode, setCustomMode] = useState(false);
  const [customText, setCustomText] = useState('');

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
    let list = allOptions;
    if (category || region) {
      list = allOptions.filter((o) => {
        if (category && o.category !== category) return false;
        if (region && o.region !== region) return false;
        return true;
      });
    }
    return [...list, OTHER_OPTION];
  }, [allOptions, category, region]);

  const fieldLabel = getCommunityFieldLabel(religion);
  const showFilters = categories.length > 1;

  useEffect(() => {
    setCategory('');
    setRegion('');
    setCustomMode(false);
    setCustomText('');
  }, [religion]);

  useEffect(() => {
    if (!value) {
      setCustomMode(false);
      setCustomText('');
      return;
    }
    if (isListedValue(value, allOptions)) {
      setCustomMode(false);
      setCustomText('');
      const match = allOptions.find((o) => o.val === value);
      if (match?.category) {
        setCategory(match.category);
        if (match.region) setRegion(match.region);
      }
      return;
    }
    setCustomMode(true);
    setCustomText(value);
  }, [value, allOptions]);

  const handleSelectChange = (v) => {
    if (v === CASTE_OTHER_SELECT_VALUE) {
      setCustomMode(true);
      setCustomText('');
      onChange('');
      return;
    }
    setCustomMode(false);
    setCustomText('');
    onChange(v);
  };

  const handleCustomChange = (text) => {
    setCustomText(text);
    onChange(text.trim());
  };

  if (!religion) return null;

  const selectDisplayValue = customMode ? CASTE_OTHER_SELECT_VALUE : value || '';

  return (
    <div className={`space-y-3 ${className}`}>
      {showFilters && !customMode && (
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
            </p>
          )}
        </div>
      )}

      <SearchableSelect
        label={`${fieldLabel}${required ? ' *' : ''}`}
        value={selectDisplayValue}
        onChange={handleSelectChange}
        options={filteredOptions}
        placeholder={
          religion === 'Hindu'
            ? 'Search e.g. Brahmin UP, Ahir Gujarat…'
            : `Search ${fieldLabel.toLowerCase()}…`
        }
        required={required && !customMode}
      />

      {customMode && (
        <div className="rounded-2xl border-2 border-dashed border-vd-primary/40 bg-vd-accent-soft/30 p-4 space-y-2">
          <label className={labelCls}>
            Enter your {fieldLabel.toLowerCase()} *
          </label>
          <input
            type="text"
            value={customText}
            onChange={(e) => handleCustomChange(e.target.value)}
            placeholder={
              religion === 'Hindu'
                ? 'e.g. Brahmin — Rajasthan (custom), local community name…'
                : `Type your ${fieldLabel.toLowerCase()}…`
            }
            className={inputCls}
            maxLength={120}
            autoFocus
          />
          <p className="text-xs text-vd-text-sub">
            This will be saved on your profile exactly as you type it.
          </p>
          <button
            type="button"
            onClick={() => {
              setCustomMode(false);
              setCustomText('');
              onChange('');
            }}
            className="text-xs font-semibold text-vd-primary hover:underline"
          >
            ← Back to list
          </button>
        </div>
      )}
    </div>
  );
}
