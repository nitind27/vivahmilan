'use client';
import { useEffect, useRef } from 'react';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import { Calendar } from 'lucide-react';

export default function DateOfBirthPicker({ value, onChange, label = 'Date of Birth' }) {
  const inputRef = useRef(null);
  const fpRef = useRef(null);

  const today = new Date();
  const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  const minDate = new Date(today.getFullYear() - 70, today.getMonth(), today.getDate());

  useEffect(() => {
    fpRef.current = flatpickr(inputRef.current, {
      dateFormat: 'd M Y',
      altInput: false,
      allowInput: false,
      disableMobile: true,
      minDate,
      maxDate,
      defaultDate: value || null,
      onChange: ([date]) => {
        if (date) {
          const y = date.getFullYear();
          const m = String(date.getMonth() + 1).padStart(2, '0');
          const d = String(date.getDate()).padStart(2, '0');
          onChange(`${y}-${m}-${d}`);
        }
      },
    });

    return () => fpRef.current?.destroy();
  }, []);

  // Sync external value changes
  useEffect(() => {
    if (fpRef.current && value) {
      fpRef.current.setDate(value, false);
    }
  }, [value]);

  return (
    <div className="flatpickr-dob-wrapper">
      <label className="block text-xs font-semibold text-vd-text-light mb-1.5 uppercase tracking-wide">
        {label}
      </label>
      <div className="relative">
        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-vd-text-light pointer-events-none z-10" />
        <input
          ref={inputRef}
          readOnly
          placeholder="Select date of birth"
          className="w-full pl-11 pr-4 py-3 border-2 border-vd-border rounded-2xl bg-vd-bg-section text-sm text-vd-text-heading placeholder:text-vd-text-light cursor-pointer focus:outline-none focus:border-vd-primary focus:ring-2 focus:ring-vd-accent-soft transition-all"
        />
      </div>

      <style>{`
        .flatpickr-dob-wrapper .flatpickr-calendar {
          font-family: inherit;
          border-radius: 1rem;
          border: 1px solid var(--vd-border);
          box-shadow: 0 20px 50px rgba(0,0,0,0.15);
          background: var(--vd-bg-section);
          overflow: hidden;
          padding: 0;
          width: 300px;
        }
        .flatpickr-dob-wrapper .flatpickr-months {
          background: linear-gradient(135deg, #C8A45C, #E5C88B);
          padding: 10px 8px;
          border-radius: 0;
        }
        .flatpickr-dob-wrapper .flatpickr-month {
          height: 36px;
          color: white;
        }
        .flatpickr-dob-wrapper .flatpickr-current-month {
          color: white;
          font-size: 1rem;
          font-weight: 700;
          padding-top: 4px;
        }
        .flatpickr-dob-wrapper .flatpickr-current-month select,
        .flatpickr-dob-wrapper .flatpickr-current-month input.cur-year {
          color: white;
          font-weight: 700;
          font-size: 1rem;
          background: transparent;
        }
        .flatpickr-dob-wrapper .flatpickr-current-month .numInputWrapper span {
          border-color: rgba(255,255,255,0.3);
        }
        .flatpickr-dob-wrapper .flatpickr-current-month .numInputWrapper span svg path {
          fill: white;
        }
        .flatpickr-dob-wrapper .flatpickr-prev-month,
        .flatpickr-dob-wrapper .flatpickr-next-month {
          color: white !important;
          fill: white !important;
          padding: 8px 10px;
        }
        .flatpickr-dob-wrapper .flatpickr-prev-month:hover,
        .flatpickr-dob-wrapper .flatpickr-next-month:hover {
          background: rgba(255,255,255,0.2);
          border-radius: 50%;
        }
        .flatpickr-dob-wrapper .flatpickr-prev-month svg,
        .flatpickr-dob-wrapper .flatpickr-next-month svg {
          fill: white;
        }
        .flatpickr-dob-wrapper .flatpickr-weekdays {
          background: var(--vd-bg-alt);
          border-bottom: 1px solid var(--vd-border);
          padding: 6px 0;
        }
        .flatpickr-dob-wrapper .flatpickr-weekday {
          color: var(--vd-text-light);
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
        }
        .flatpickr-dob-wrapper .flatpickr-days {
          border: none;
          width: 300px;
        }
        .flatpickr-dob-wrapper .dayContainer {
          width: 300px;
          min-width: 300px;
          max-width: 300px;
          padding: 8px;
          gap: 2px;
        }
        .flatpickr-dob-wrapper .flatpickr-day {
          color: var(--vd-text-sub);
          border-radius: 50%;
          height: 36px;
          line-height: 36px;
          max-width: 36px;
          font-size: 0.85rem;
          border: none;
          transition: all 0.15s;
        }
        .flatpickr-dob-wrapper .flatpickr-day:hover {
          background: var(--vd-accent-soft);
          color: var(--vd-primary);
          border: none;
        }
        .flatpickr-dob-wrapper .flatpickr-day.selected,
        .flatpickr-dob-wrapper .flatpickr-day.selected:hover {
          background: linear-gradient(135deg, #C8A45C, #E5C88B);
          border: none;
          color: white;
          font-weight: 700;
          box-shadow: 0 4px 12px rgba(200,164,92,0.4);
        }
        .flatpickr-dob-wrapper .flatpickr-day.today {
          border: 2px solid var(--vd-primary);
          color: var(--vd-primary);
          font-weight: 700;
        }
        .flatpickr-dob-wrapper .flatpickr-day.today:hover {
          background: var(--vd-accent-soft);
        }
        .flatpickr-dob-wrapper .flatpickr-day.flatpickr-disabled,
        .flatpickr-dob-wrapper .flatpickr-day.flatpickr-disabled:hover {
          color: var(--vd-text-light);
          opacity: 0.3;
          cursor: not-allowed;
          background: transparent;
        }
        .flatpickr-dob-wrapper .flatpickr-day.prevMonthDay,
        .flatpickr-dob-wrapper .flatpickr-day.nextMonthDay {
          opacity: 0.3;
        }
        .flatpickr-dob-wrapper .flatpickr-calendar.arrowTop:before,
        .flatpickr-dob-wrapper .flatpickr-calendar.arrowTop:after {
          display: none;
        }
      `}</style>
    </div>
  );
}
