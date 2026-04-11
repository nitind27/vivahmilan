'use client';
import { motion } from 'framer-motion';
import { BadgeCheck } from 'lucide-react';

/**
 * size: 'sm' | 'md' | 'lg'
 * variant: 'badge' (pill) | 'icon' (just icon) | 'inline' (icon + text inline)
 */
export default function VerifiedBadge({ size = 'md', variant = 'badge', className = '' }) {
  const sizes = {
    sm:  { icon: 'w-3 h-3',   text: 'text-xs', pill: 'px-1.5 py-0.5 gap-0.5' },
    md:  { icon: 'w-3.5 h-3.5', text: 'text-xs', pill: 'px-2 py-0.5 gap-1' },
    lg:  { icon: 'w-5 h-5',   text: 'text-sm', pill: 'px-3 py-1 gap-1.5' },
  };
  const s = sizes[size] || sizes.md;

  if (variant === 'icon') {
    return (
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        title="Admin Verified Profile"
        className={`inline-flex items-center justify-center ${className}`}
      >
        <BadgeCheck className={`${s.icon} text-blue-500 fill-blue-50`} />
      </motion.span>
    );
  }

  if (variant === 'inline') {
    return (
      <motion.span
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300 }}
        title="Admin Verified Profile"
        className={`inline-flex items-center gap-1 ${className}`}
      >
        <BadgeCheck className={`${s.icon} text-blue-500`} />
      </motion.span>
    );
  }

  // Default: pill badge
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300 }}
      title="Admin Verified Profile"
      className={`inline-flex items-center ${s.pill} bg-blue-500 text-white rounded-full font-medium shadow-sm ${className}`}
    >
      <BadgeCheck className={`${s.icon} fill-white/30`} />
      <span className={s.text}>Verified</span>
    </motion.span>
  );
}
