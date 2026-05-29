'use client';
import {
  countWords,
  ABOUT_ME_MIN_WORDS,
  ABOUT_ME_MAX_WORDS,
} from '@/lib/aboutMeValidation';

export default function AboutMeField({
  value,
  onChange,
  rows = 4,
  inputClassName = '',
  label = 'About Me *',
  placeholder = 'Apne bare mein likhein — parivar, shiksha, career, hobbies, partner mein kya dhundh rahe hain… (kam se kam 50 shabd)',
}) {
  const wordCount = countWords(value);
  const hasText = wordCount > 0;
  const tooFew = hasText && wordCount < ABOUT_ME_MIN_WORDS;
  const tooMany = wordCount > ABOUT_ME_MAX_WORDS;
  const isValid = hasText && !tooFew && !tooMany;

  return (
    <div>
      <label className="block text-xs font-semibold text-vd-text-light mb-1.5 uppercase tracking-wide">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className={inputClassName}
      />
      <p className={`text-xs mt-1.5 ${tooFew || tooMany ? 'text-red-500' : isValid ? 'text-green-600' : 'text-vd-text-light'}`}>
        {wordCount} words · minimum {ABOUT_ME_MIN_WORDS} · maximum {ABOUT_ME_MAX_WORDS.toLocaleString('en-IN')}
        {tooFew && ` · ${ABOUT_ME_MIN_WORDS - wordCount} more word${ABOUT_ME_MIN_WORDS - wordCount === 1 ? '' : 's'} needed`}
        {tooMany && ` · ${wordCount - ABOUT_ME_MAX_WORDS} words over limit`}
      </p>
    </div>
  );
}
