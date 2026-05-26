'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Crown, MessageCircle, Shield, Sparkles, ArrowRight,
  CalendarX, Clock, Lock
} from 'lucide-react';
import { format } from 'date-fns';

const COPY = {
  premium_expired: {
    badge: 'Plan expired',
    title: 'Your Premium plan has expired',
    subtitle:
      'Renew your subscription to continue chatting with your matches and access all premium features.',
    icon: CalendarX,
    accent: 'from-amber-500 via-orange-500 to-rose-500',
  },
  trial_expired: {
    badge: 'Trial ended',
    title: 'Your free trial has ended',
    subtitle:
      'Upgrade to Premium to unlock unlimited chat, contact details, and more.',
    icon: Clock,
    accent: 'from-violet-500 via-purple-500 to-indigo-500',
  },
  no_access: {
    badge: 'Premium required',
    title: 'Chat is a Premium feature',
    subtitle:
      'Upgrade your plan to start conversations with matches who accepted your interest.',
    icon: Lock,
    accent: 'from-amber-400 via-orange-500 to-pink-500',
  },
};

const PERKS = [
  { icon: MessageCircle, label: 'Unlimited messaging' },
  { icon: Shield, label: 'Verified match connections' },
  { icon: Sparkles, label: 'Priority profile visibility' },
];

export default function ChatPlanExpired({ access }) {
  const reason = access?.reason || 'no_access';
  const copy = COPY[reason] || COPY.no_access;
  const Icon = copy.icon;

  const expiryLabel =
    reason === 'premium_expired' && access?.premiumExpiry
      ? format(new Date(access.premiumExpiry), 'MMMM d, yyyy')
      : reason === 'trial_expired' && access?.freeTrialExpiry
        ? format(new Date(access.freeTrialExpiry), 'MMMM d, yyyy')
        : null;

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-8 min-h-0 overflow-y-auto">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[28rem] h-[28rem] rounded-full bg-gradient-to-br from-amber-400/15 to-orange-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-vd-primary/5 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
        className="relative w-full max-w-lg"
      >
        <div className="rounded-[2rem] border border-vd-border bg-vd-bg-section/95 backdrop-blur-xl shadow-2xl shadow-black/5 dark:shadow-black/30 overflow-hidden">
          <div className={`h-1.5 w-full bg-gradient-to-r ${copy.accent}`} />

          <div className="px-6 sm:px-10 pt-10 pb-8 text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 mb-6">
              <Crown className="w-3.5 h-3.5" />
              {copy.badge}
            </span>

            <div className="relative mx-auto w-20 h-20 mb-6">
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${copy.accent} opacity-20 blur-md`} />
              <div className={`relative w-full h-full rounded-2xl bg-gradient-to-br ${copy.accent} flex items-center justify-center shadow-lg`}>
                <Icon className="w-9 h-9 text-white" strokeWidth={1.75} />
              </div>
            </div>

            <h1 className="text-2xl sm:text-[1.65rem] font-bold text-vd-text-heading leading-tight mb-3">
              {copy.title}
            </h1>
            <p className="text-sm sm:text-base text-vd-text-sub leading-relaxed max-w-md mx-auto mb-5">
              {copy.subtitle}
            </p>

            {expiryLabel && (
              <p className="text-xs font-medium text-amber-700/90 dark:text-amber-300/90 bg-amber-50 dark:bg-amber-900/20 border border-amber-200/70 dark:border-amber-800/50 rounded-xl px-4 py-2.5 inline-block mb-6">
                {reason === 'premium_expired' ? 'Expired on' : 'Trial ended on'}{' '}
                <span className="font-semibold">{expiryLabel}</span>
                {access?.premiumPlan && reason === 'premium_expired' && (
                  <span className="text-vd-text-light"> · {access.premiumPlan} plan</span>
                )}
              </p>
            )}

            <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-8 text-left">
              {PERKS.map(({ icon: PIcon, label }) => (
                <li
                  key={label}
                  className="flex items-center gap-2.5 rounded-2xl border border-vd-border bg-vd-bg/60 px-3.5 py-3"
                >
                  <span className="w-8 h-8 rounded-xl bg-vd-accent-soft flex items-center justify-center flex-shrink-0">
                    <PIcon className="w-4 h-4 text-vd-primary" />
                  </span>
                  <span className="text-xs font-medium text-vd-text-heading">{label}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/premium"
              className={`inline-flex w-full sm:w-auto min-w-[220px] items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r ${copy.accent} text-white font-semibold text-sm shadow-lg shadow-orange-500/20 hover:opacity-95 transition-opacity`}
            >
              Upgrade now
              <ArrowRight className="w-4 h-4" />
            </Link>

            <div className="flex flex-wrap items-center justify-center gap-4 mt-5 text-xs text-vd-text-light">
              <Link href="/interests" className="hover:text-vd-primary transition-colors font-medium">
                View interests
              </Link>
              <span className="text-vd-border">·</span>
              <Link href="/dashboard" className="hover:text-vd-primary transition-colors font-medium">
                Back to dashboard
              </Link>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-vd-text-light mt-4 px-4">
          Your previous conversations are saved and will be available again after you renew.
        </p>
      </motion.div>
    </div>
  );
}
