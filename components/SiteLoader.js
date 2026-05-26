'use client';

import { motion } from 'framer-motion';

const SIZES = {
  sm: { box: 'w-16 h-16', logo: 'p-3', gap: 'gap-3', text: 'text-xs' },
  md: { box: 'w-24 h-24', logo: 'p-4', gap: 'gap-5', text: 'text-sm' },
  lg: { box: 'w-32 h-32', logo: 'p-5', gap: 'gap-6', text: 'text-base' },
};

/**
 * Branded loader using /logo/icon.png — use for full-page and section loading states.
 * @param {string} message
 * @param {boolean} fullScreen — min-h-screen centered
 * @param {'sm'|'md'|'lg'} size
 * @param {string} className — extra wrapper classes
 */
export default function SiteLoader({
  message = 'Loading…',
  fullScreen = true,
  size = 'md',
  className = '',
}) {
  const s = SIZES[size] || SIZES.md;

  const wrap = fullScreen
    ? `min-h-screen flex items-center justify-center bg-vd-bg ${className}`
    : `flex items-center justify-center py-16 ${className}`;

  return (
    <div className={wrap} role="status" aria-live="polite" aria-label={message}>
      <div className={`flex flex-col items-center ${s.gap}`}>
        <div className={`relative ${s.box}`}>
          {/* Outer ring — clockwise */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-vd-primary border-r-vd-primary/30"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
            aria-hidden
          />
          {/* Inner ring — counter-clockwise */}
          <motion.div
            className="absolute inset-1.5 rounded-full border-2 border-transparent border-b-vd-primary-light/80 border-l-vd-accent/50"
            animate={{ rotate: -360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            aria-hidden
          />
          {/* Soft glow pulse */}
          <motion.div
            className="absolute inset-2 rounded-full bg-vd-primary/20 blur-md"
            animate={{ opacity: [0.35, 0.75, 0.35], scale: [0.92, 1.08, 0.92] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            aria-hidden
          />
          {/* Logo */}
          <motion.div
            className={`absolute inset-0 flex items-center justify-center ${s.logo}`}
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo/icon.png"
              alt=""
              className="w-full h-full object-contain drop-shadow-[0_4px_14px_rgba(200,164,92,0.45)]"
              width={96}
              height={96}
            />
          </motion.div>
        </div>

        {message ? (
          <motion.p
            className={`${s.text} font-semibold text-vd-text-sub tracking-wide`}
            animate={{ opacity: [0.45, 1, 0.45] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          >
            {message}
          </motion.p>
        ) : null}

        <div className="flex gap-1.5" aria-hidden>
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-2 h-2 rounded-full bg-vd-primary"
              animate={{ opacity: [0.25, 1, 0.25], y: [0, -5, 0] }}
              transition={{ duration: 0.85, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Inline loader for admin panels / modals */
export function SiteLoaderInline({ message, className = '' }) {
  return <SiteLoader message={message} fullScreen={false} size="sm" className={className} />;
}
