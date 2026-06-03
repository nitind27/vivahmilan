'use client';
import { Info } from 'lucide-react';
import { GENERAL_NOTICE, UPLOAD_NOTICE, PLATFORM_DOMAIN } from '@/lib/platformDisclaimer';

/**
 * Shaadi-style info banner for Vivah Dwar (vivahdwar.com).
 * @param {'general' | 'upload' | 'compact'} variant
 */
export default function PlatformNotice({ variant = 'general', className = '' }) {
  const isUpload = variant === 'upload';
  const isCompact = variant === 'compact';
  const content = isUpload ? UPLOAD_NOTICE : GENERAL_NOTICE;

  return (
    <div
      role="note"
      className={`flex gap-3 rounded-2xl border bg-white dark:bg-vd-bg-section ${
        isUpload
          ? 'border-amber-300/80 dark:border-amber-700/50'
          : 'border-orange-200 dark:border-orange-800/40'
      } px-4 py-3.5 ${isCompact ? 'py-3' : ''} ${className}`}
    >
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUpload ? 'bg-amber-500' : 'bg-orange-500'
        }`}
        aria-hidden
      >
        <Info className="w-4 h-4 text-white" strokeWidth={2.5} />
      </div>
      <div className="min-w-0 flex-1 text-sm leading-relaxed text-gray-700 dark:text-vd-text-sub">
        {!isCompact && content.title && (
          <p className="font-semibold text-gray-900 dark:text-vd-text-heading mb-1">
            <span className="text-vd-primary">{PLATFORM_DOMAIN}</span>
            {' — '}
            {isUpload ? content.title : 'Genuine matrimonial platform only'}
          </p>
        )}
        <p>{content.body}</p>
        {isUpload && content.bullets?.length > 0 && !isCompact && (
          <ul className="mt-2.5 space-y-1 list-disc list-inside text-xs text-gray-600 dark:text-vd-text-light">
            {content.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
