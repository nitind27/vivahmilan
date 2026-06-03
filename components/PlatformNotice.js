'use client';
import { Info } from 'lucide-react';
import { GENERAL_NOTICE, UPLOAD_NOTICE, PLATFORM_DOMAIN } from '@/lib/platformDisclaimer';

/**
 * Info banner for profile/onboarding (vivahdwar.com).
 * @param {'general' | 'upload' | 'full'} variant — full = general + upload on one screen
 */
export default function PlatformNotice({ variant = 'general', className = '' }) {
  const isUpload = variant === 'upload';
  const isFull = variant === 'full';

  if (isFull) {
    return (
      <div className={`space-y-3 ${className}`} role="note">
        <NoticeBlock content={GENERAL_NOTICE} tone="orange" />
        <NoticeBlock content={UPLOAD_NOTICE} tone="amber" showBullets />
      </div>
    );
  }

  const content = isUpload ? UPLOAD_NOTICE : GENERAL_NOTICE;
  return (
    <NoticeBlock
      content={content}
      tone={isUpload ? 'amber' : 'orange'}
      showBullets={isUpload}
      className={className}
    />
  );
}

function NoticeBlock({ content, tone, showBullets, className = '' }) {
  const border = tone === 'amber' ? 'border-amber-400/35' : 'border-orange-300/40';
  const iconBg = tone === 'amber' ? 'bg-amber-500' : 'bg-orange-500';

  return (
    <div
      className={`flex gap-3 rounded-2xl border ${border} bg-vd-bg-alt/60 px-4 py-3.5 ${className}`}
    >
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full ${iconBg} flex items-center justify-center`}
        aria-hidden
      >
        <Info className="w-4 h-4 text-white" strokeWidth={2.5} />
      </div>
      <div className="min-w-0 flex-1 text-[13px] leading-relaxed text-vd-text-sub">
        <p className="font-semibold text-vd-text-heading mb-1">
          <span className="text-vd-primary">{PLATFORM_DOMAIN}</span>
        </p>
        <p>{content.body}</p>
        {showBullets && content.bullets?.length > 0 && (
          <ul className="mt-2 space-y-0.5 list-disc list-inside text-xs text-vd-text-light">
            {content.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
