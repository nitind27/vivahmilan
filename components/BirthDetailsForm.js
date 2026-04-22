'use client';
import { useState } from 'react';
import { Loader2, Clock, Calendar, MapPin } from 'lucide-react';
import BirthLocationSearch from './BirthLocationSearch';

const inputCls = "w-full px-4 py-3 border rounded-2xl bg-vd-bg-section text-sm text-vd-text-heading placeholder:text-vd-text-light focus:outline-none focus:border-vd-primary focus:ring-2 focus:ring-vd-accent-soft transition-all";
const labelCls = "block text-xs font-semibold text-vd-text-light mb-1.5 uppercase tracking-wide";

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

function getAge(dateStr) {
  if (!dateStr) return null;
  const dob = new Date(dateStr);
  if (isNaN(dob.getTime())) return null;
  return Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

export default function BirthDetailsForm({ onSubmit, loading, initialData, email }) {
  const [date, setDate] = useState(initialData?.birthDate || '');
  const [hour, setHour] = useState(initialData?.birthHour ? String(initialData.birthHour) : '12');
  const [minute, setMinute] = useState(initialData?.birthMinute != null ? String(initialData.birthMinute).padStart(2, '0') : '00');
  const [period, setPeriod] = useState(initialData?.birthPeriod || 'AM');
  const [location, setLocation] = useState(
    initialData?.birthPlace
      ? { place: initialData.birthPlace, lat: initialData.lat, lng: initialData.lng }
      : null
  );
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!date) {
      errs.date = 'Date of birth is required';
    } else {
      const age = getAge(date);
      if (age === null) errs.date = 'Invalid date of birth';
      else if (age < 18) errs.date = 'You must be at least 18 years old';
    }
    if (!hour || !minute) errs.time = 'Time of birth is required';
    if (!location) errs.location = 'Birth location is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    try {
      const res = await fetch('/api/kundali', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          birthDate: date,
          birthHour: parseInt(hour),
          birthMinute: parseInt(minute),
          birthPeriod: period,
          birthPlace: location.place,
          lat: location.lat,
          lng: location.lng,
          ...(email ? { email } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors({ submit: data.error || 'Failed to generate Kundali' });
        return;
      }
      onSubmit(data);
    } catch {
      setErrors({ submit: 'Network error. Please try again.' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4 p-4 bg-vd-bg-alt rounded-2xl border border-vd-border">
      <p className="text-sm font-semibold text-vd-text-heading flex items-center gap-2">
        🪐 Birth Details for Kundali
      </p>

      {/* Date of Birth */}
      <div>
        <label className={labelCls}>Date of Birth *</label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vd-text-light pointer-events-none" />
          <input
            type="date"
            value={date}
            onChange={e => { setDate(e.target.value); setErrors(p => ({ ...p, date: undefined })); }}
            className={`${inputCls} pl-9 ${errors.date ? 'border-red-400' : 'border-vd-border'}`}
            max={new Date().toISOString().split('T')[0]}
          />
        </div>
        {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date}</p>}
      </div>

      {/* Time of Birth */}
      <div>
        <label className={labelCls}>Time of Birth *</label>
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vd-text-light pointer-events-none" />
            <select
              value={hour}
              onChange={e => { setHour(e.target.value); setErrors(p => ({ ...p, time: undefined })); }}
              className={`${inputCls} pl-9 ${errors.time ? 'border-red-400' : 'border-vd-border'}`}
            >
              {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
          <span className="text-vd-text-light font-bold">:</span>
          <select
            value={minute}
            onChange={e => { setMinute(e.target.value); setErrors(p => ({ ...p, time: undefined })); }}
            className={`${inputCls} flex-1 ${errors.time ? 'border-red-400' : 'border-vd-border'}`}
          >
            {MINUTES.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <div className="flex rounded-2xl overflow-hidden border border-vd-border flex-shrink-0">
            {['AM', 'PM'].map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`px-4 py-3 text-sm font-semibold transition-all ${
                  period === p
                    ? 'vd-gradient-gold text-white'
                    : 'bg-vd-bg-section text-vd-text-sub hover:bg-vd-accent-soft'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        {errors.time && <p className="mt-1 text-xs text-red-500">{errors.time}</p>}
      </div>

      {/* Birth Location */}
      <div>
        <label className={labelCls}>Birth Place *</label>
        <BirthLocationSearch
          value={location?.place || ''}
          onChange={(loc) => { setLocation(loc); setErrors(p => ({ ...p, location: undefined })); }}
          error={errors.location}
        />
      </div>

      {errors.submit && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-2">
          {errors.submit}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full vd-gradient-gold text-white py-3 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60 transition-opacity text-sm"
        style={{ boxShadow: '0 4px 16px rgba(200,164,92,0.35)' }}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : '🪐'}
        {loading ? 'Generating Kundali…' : 'Generate Kundali'}
      </button>
    </form>
  );
}
