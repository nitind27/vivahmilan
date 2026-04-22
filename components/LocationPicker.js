'use client';
import { useState, useEffect, useCallback } from 'react';
import SearchableSelect from './SearchableSelect';
import { MapPin, Loader2 } from 'lucide-react';

/**
 * LocationPicker — Country → State → City cascading dropdowns
 * Props:
 *   country, state, city          — current values (country = full name)
 *   onCountryChange(name, iso)
 *   onStateChange(name, iso)
 *   onCityChange(name)
 */
export default function LocationPicker({
  country = '', state = '', city = '',
  onCountryChange, onStateChange, onCityChange,
}) {
  const [countries, setCountries] = useState([]);
  const [states, setStates]       = useState([]);
  const [cities, setCities]       = useState([]);
  const [countryIso, setCountryIso] = useState('');
  const [stateIso, setStateIso]     = useState('');
  const [loadingStates, setLoadingStates]   = useState(false);
  const [loadingCities, setLoadingCities]   = useState(false);

  // Load countries once
  useEffect(() => {
    fetch('/api/location/countries')
      .then(r => r.json())
      .then(data => setCountries(data));
  }, []);

  // When country name changes from outside, find its ISO
  useEffect(() => {
    if (country && countries.length > 0) {
      const found = countries.find(c => c.name === country);
      if (found && found.isoCode !== countryIso) {
        setCountryIso(found.isoCode);
      }
    }
  }, [country, countries]);

  // Load states when countryIso changes
  useEffect(() => {
    if (!countryIso) { setStates([]); setCities([]); return; }
    setLoadingStates(true);
    fetch(`/api/location/states?country=${countryIso}`)
      .then(r => r.json())
      .then(data => { setStates(data); setLoadingStates(false); });
  }, [countryIso]);

  // When state name changes from outside, find its ISO
  useEffect(() => {
    if (state && states.length > 0) {
      const found = states.find(s => s.name === state);
      if (found && found.isoCode !== stateIso) {
        setStateIso(found.isoCode);
      }
    }
  }, [state, states]);

  // Load cities when stateIso changes
  useEffect(() => {
    if (!countryIso || !stateIso) { setCities([]); return; }
    setLoadingCities(true);
    fetch(`/api/location/cities?country=${countryIso}&state=${stateIso}`)
      .then(r => r.json())
      .then(data => { setCities(data); setLoadingCities(false); });
  }, [countryIso, stateIso]);

  const handleCountry = (name) => {
    const found = countries.find(c => c.name === name);
    setCountryIso(found?.isoCode || '');
    setStateIso('');
    setStates([]);
    setCities([]);
    onCountryChange?.(name, found?.isoCode || '');
    onStateChange?.('', '');
    onCityChange?.('');
  };

  const handleState = (name) => {
    const found = states.find(s => s.name === name);
    setStateIso(found?.isoCode || '');
    setCities([]);
    onStateChange?.(name, found?.isoCode || '');
    onCityChange?.('');
  };

  const handleCity = (name) => {
    onCityChange?.(name);
  };

  const countryOptions = countries.map(c => ({
    val: c.name,
    label: `${c.flag || ''} ${c.name}`.trim(),
    group: '',
  }));

  const stateOptions = states.map(s => ({ val: s.name, label: s.name, group: '' }));

  const cityOptions = cities.map(c => ({ val: c.name, label: c.name, group: '' }));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <MapPin className="w-4 h-4 text-vd-primary" />
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Location</span>
      </div>

      {/* Country */}
      <SearchableSelect
        label="Country"
        value={country}
        onChange={handleCountry}
        options={countryOptions}
        placeholder="Select country…"
      />

      {/* State */}
      <div className="relative">
        {loadingStates && (
          <div className="absolute right-3 top-8 z-10">
            <Loader2 className="w-4 h-4 text-vd-primary animate-spin" />
          </div>
        )}
        <SearchableSelect
          label="State / Province"
          value={state}
          onChange={handleState}
          options={stateOptions}
          placeholder={countryIso ? 'Select state…' : 'Select country first'}
        />
      </div>

      {/* City */}
      <div className="relative">
        {loadingCities && (
          <div className="absolute right-3 top-8 z-10">
            <Loader2 className="w-4 h-4 text-vd-primary animate-spin" />
          </div>
        )}
        <SearchableSelect
          label="City / Town"
          value={city}
          onChange={handleCity}
          options={cityOptions}
          placeholder={stateIso ? 'Select city…' : 'Select state first'}
        />
      </div>

      {/* Manual entry fallback */}
      {stateIso && cities.length === 0 && !loadingCities && (
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
            City / Town <span className="text-gray-400 font-normal normal-case">(type manually)</span>
          </label>
          <input
            value={city}
            onChange={e => handleCity(e.target.value)}
            placeholder="Enter your city…"
            className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-sm focus:outline-none focus:border-vd-primary focus:ring-2 focus:ring-vd-accent-soft dark:focus:ring-vd-accent/20 transition-all"
          />
        </div>
      )}
    </div>
  );
}
