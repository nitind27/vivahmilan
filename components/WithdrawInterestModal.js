'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { Undo2, X, BellOff } from 'lucide-react';

export default function WithdrawInterestModal({ open, name, onConfirm, onCancel, loading }) {
  const firstName = name?.split(' ')[0] || 'them';

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/55 backdrop-blur-md"
            onClick={loading ? undefined : onCancel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="relative w-full max-w-sm overflow-hidden rounded-3xl shadow-2xl border border-vd-border bg-vd-bg-section"
            onClick={e => e.stopPropagation()}
          >
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-br from-amber-400/25 via-orange-400/15 to-transparent pointer-events-none" />

            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-vd-bg/80 border border-vd-border hover:bg-vd-accent-soft transition-colors disabled:opacity-50"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-vd-text-light" />
            </button>

            <div className="relative px-6 pt-8 pb-6 text-center">
              <div className="relative mx-auto w-[4.5rem] h-[4.5rem] mb-5">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 opacity-20 animate-pulse" />
                <div className="relative w-full h-full rounded-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/30 border-2 border-amber-200/80 dark:border-amber-700/50 flex items-center justify-center shadow-lg">
                  <Undo2 className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                </div>
              </div>

              <h3 className="text-xl font-bold text-vd-text-heading mb-2">
                Withdraw interest?
              </h3>
              <p className="text-sm text-vd-text-sub leading-relaxed mb-4">
                Your interest sent to{' '}
                <span className="font-semibold text-vd-text-heading">{firstName}</span>{' '}
                will be cancelled. They will no longer see this request in their notifications.
              </p>

              <div className="flex items-start gap-2.5 text-left rounded-2xl bg-amber-50/80 dark:bg-amber-900/15 border border-amber-200/60 dark:border-amber-800/40 px-3.5 py-3 mb-6">
                <BellOff className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800/90 dark:text-amber-200/90">
                  You can send interest again later if you change your mind.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={loading}
                  className="flex-1 py-3 rounded-2xl border border-vd-border text-sm font-semibold text-vd-text-sub hover:bg-vd-accent-soft transition-colors disabled:opacity-50"
                >
                  Keep waiting
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={loading}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm font-semibold shadow-md shadow-amber-500/25 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Undo2 className="w-4 h-4" />
                  )}
                  {loading ? 'Withdrawing…' : 'Yes, withdraw'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
