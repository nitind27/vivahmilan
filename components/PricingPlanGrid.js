'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  CheckCircle, Star, Zap, Crown, MessageCircle, Eye, TrendingUp,
  Lock, ArrowRight, Sparkles,
} from 'lucide-react';
import { parsePlanPermissions } from '@/lib/plans.js';

const PLAN_ICONS = {
  FREE: Star,
  SILVER: Eye,
  GOLD: Crown,
  PLATINUM: Sparkles,
  EARLY_BIRD: Zap,
};

const HIDDEN_CHECKOUT_PLANS = new Set(['EARLY_BIRD']);

function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

function gridColsClass(count) {
  if (count <= 1) return 'grid-cols-1 max-w-md';
  if (count === 2) return 'grid-cols-1 md:grid-cols-2 max-w-4xl';
  if (count === 3) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-6xl';
  if (count === 4) return 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 max-w-7xl';
  return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-7xl';
}

function buildFeatures(perms) {
  const list = [
    perms.canChat && 'Unlimited Chat',
    perms.canSeeContact && 'View Contact Details',
    perms.canBoostProfile && 'Profile Boost',
    perms.canSeeWhoViewed && 'See Who Viewed You',
    perms.unlimitedInterests && 'Unlimited Interests',
    perms.aiMatchScore && 'AI Match Score',
    perms.kundaliMatchPdf && 'Kundali PDF Report',
    !perms.unlimitedInterests && perms.interestLimit > 0 && `Send ${perms.interestLimit} Interests / mo`,
    !perms.unlimitedInterests && perms.interestLimit === -1 && 'Unlimited Interests',
    'Browse & Search Profiles',
  ];
  return list.filter(Boolean);
}

/**
 * @param {'link'|'checkout'} mode - homepage links to /premium; premium runs checkout
 */
export default function PricingPlanGrid({
  plans = [],
  selectedMonths = 3,
  discountPct = 0,
  session = null,
  mode = 'checkout',
  loadingPlan = null,
  onCheckout,
  onFreeActivate,
  onLoginRequired,
}) {
  const displayPlans = [...plans]
    .filter(p => !HIDDEN_CHECKOUT_PLANS.has(p.plan))
    .sort((a, b) => Number(a.price) - Number(b.price));

  if (displayPlans.length === 0) {
    return (
      <div className="text-center py-16 px-4 rounded-3xl border border-dashed border-vd-border bg-vd-bg-section/50">
        <Crown className="w-10 h-10 mx-auto mb-3 text-vd-primary/40" />
        <p className="font-medium text-vd-text-heading">No plans available right now</p>
        <p className="text-sm text-vd-text-sub mt-1">Please check back soon or contact support.</p>
      </div>
    );
  }

  const count = displayPlans.length;
  const highlightPlan = displayPlans.some(p => p.plan === 'GOLD') ? 'GOLD' : displayPlans[Math.floor(displayPlans.length / 2)]?.plan;

  return (
    <div className={`grid gap-6 lg:gap-8 mx-auto items-stretch pt-2 ${gridColsClass(count)}`}>
      {displayPlans.map((p, i) => {
        const isHighlight = p.plan === highlightPlan && p.plan !== 'FREE';
        const PlanIcon = PLAN_ICONS[p.plan] || Star;
        const userPlan = session?.user?.premiumPlan;
        const hasPremium = session?.user?.isPremium;
        const isActive = hasPremium && p.plan === userPlan;

        const basePrice = Number(p.price || 0);
        const baseDays = Number(p.durationDays || 30);
        const pricePerDay = baseDays > 0 ? basePrice / baseDays : 0;
        const isLifetime = selectedMonths === 0;
        const isFree = basePrice === 0;
        const totalDays = isLifetime ? 0 : selectedMonths * 30;
        const totalPrice = isFree ? 0 : isLifetime ? 4999 : Math.round(pricePerDay * totalDays);
        const discountedPrice = isFree ? 0 : Math.round(totalPrice * (1 - discountPct / 100));
        const monthlyEquiv = !isFree && !isLifetime && selectedMonths > 0
          ? Math.round(discountedPrice / selectedMonths)
          : null;

        const perms = parsePlanPermissions(p.permissions);
        const features = buildFeatures(perms);

        const userPlanObj = displayPlans.find(pl => pl.plan === userPlan);
        const userBasePrice = userPlanObj ? Number(userPlanObj.price || 0) : 0;
        let btnText = isFree ? 'Get Started Free' : `Choose ${p.displayName || p.plan}`;
        if (hasPremium) {
          if (isActive) btnText = 'Extend Plan';
          else if (basePrice > userBasePrice) btnText = `Upgrade to ${p.displayName || p.plan}`;
          else if (!isFree) btnText = `Switch to ${p.displayName || p.plan}`;
        }

        const card = (
          <motion.article
            key={p.plan}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.45 }}
            viewport={{ once: true, margin: '-40px' }}
            whileHover={{ y: -6 }}
            className={`group relative flex flex-col h-full min-h-[420px] rounded-3xl overflow-hidden transition-shadow duration-300 ${
              isActive
                ? 'ring-2 ring-emerald-500/70 shadow-xl shadow-emerald-500/10 bg-vd-bg-section border border-emerald-500/30'
                : isHighlight
                  ? 'ring-2 ring-vd-primary/50 shadow-2xl shadow-vd-primary/15 bg-gradient-to-b from-[#3d3220] via-[#2a2318] to-[#1c1812] text-white'
                  : 'bg-vd-bg-section border border-vd-border shadow-lg hover:shadow-xl hover:border-vd-primary/35'
            }`}
          >
            {/* Accent bar */}
            <div className={`w-full ${isHighlight ? 'h-1.5 bg-gradient-to-r from-yellow-300 via-vd-primary-light to-yellow-300' : 'h-1 vd-gradient-gold opacity-80'}`} />

            {/* Badges — inside card, no negative offset */}
            <div className="absolute top-4 right-4 left-4 flex flex-wrap justify-end gap-2 z-10 pointer-events-none">
              {isActive && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold shadow">
                  <CheckCircle className="w-3 h-3" /> Active
                </span>
              )}
              {!isActive && isHighlight && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-400 text-yellow-950 text-[10px] font-bold shadow">
                  <Crown className="w-3 h-3" /> Most Popular
                </span>
              )}
            </div>

            <div className="p-5 sm:p-6 flex flex-col flex-1">
              {/* Header */}
              <div className="flex items-start gap-3 mb-5 mt-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md ${
                  isHighlight ? 'bg-white/15 ring-1 ring-white/20' : 'vd-gradient-gold'
                }`}>
                  <PlanIcon className={`w-5 h-5 ${isHighlight ? 'text-yellow-300' : 'text-white'}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${isHighlight ? 'text-white/50' : 'text-vd-text-light'}`}>
                    {p.plan}
                  </p>
                  <h3 className={`text-lg sm:text-xl font-bold leading-tight ${isHighlight ? 'text-white' : 'text-vd-text-heading'}`}>
                    {p.displayName || p.plan}
                  </h3>
                  {p.description && (
                    <p className={`text-xs mt-1 line-clamp-2 ${isHighlight ? 'text-white/65' : 'text-vd-text-sub'}`}>
                      {p.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Price */}
              <div className={`rounded-2xl p-4 mb-5 ${isHighlight ? 'bg-white/10 ring-1 ring-white/10' : 'bg-vd-bg-alt dark:bg-vd-bg/40'}`}>
                <div className="flex items-end gap-2 flex-wrap">
                  {isFree ? (
                    <span className={`text-3xl sm:text-4xl font-black ${isHighlight ? 'text-white' : 'vd-gradient-text'}`}>Free</span>
                  ) : (
                    <>
                      {discountPct > 0 && (
                        <span className={`text-sm line-through mb-1 ${isHighlight ? 'text-white/45' : 'text-vd-text-light'}`}>
                          {formatINR(totalPrice)}
                        </span>
                      )}
                      <span className={`text-3xl sm:text-4xl font-black tracking-tight ${isHighlight ? 'text-white' : 'text-vd-text-heading'}`}>
                        {formatINR(discountedPrice)}
                      </span>
                    </>
                  )}
                </div>
                <p className={`text-xs mt-2 leading-relaxed ${isHighlight ? 'text-white/60' : 'text-vd-text-sub'}`}>
                  {isFree && 'Forever · no payment required'}
                  {!isFree && (
                    <>
                      Billed for {selectedMonths} month{selectedMonths > 1 ? 's' : ''}
                      {monthlyEquiv != null && (
                        <span className={`block mt-0.5 font-semibold ${isHighlight ? 'text-vd-primary-light' : 'text-vd-primary'}`}>
                          ≈ {formatINR(monthlyEquiv)} / month
                        </span>
                      )}
                    </>
                  )}
                  {discountPct > 0 && !isFree && (
                    <span className="block mt-1 text-green-500 font-semibold">{discountPct}% coupon applied</span>
                  )}
                </p>
              </div>

              {/* Features */}
              <div className={`flex-1 border-t pt-4 mb-5 ${isHighlight ? 'border-white/10' : 'border-vd-border'}`}>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${isHighlight ? 'text-white/45' : 'text-vd-text-light'}`}>
                  Included
                </p>
                <ul className="space-y-2">
                  {features.slice(0, 8).map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <span className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isHighlight ? 'bg-white/15' : 'bg-vd-primary/10'
                      }`}>
                        <CheckCircle className={`w-3 h-3 ${isHighlight ? 'text-yellow-300' : 'text-vd-primary'}`} />
                      </span>
                      <span className={isHighlight ? 'text-white/90' : 'text-vd-text-sub'}>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA */}
              {mode === 'link' ? (
                <Link
                  href={isFree ? '/register' : '/premium'}
                  className={`mt-auto flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-bold text-sm transition-all ${
                    isHighlight
                      ? 'bg-white text-vd-primary-dark hover:bg-vd-primary-light shadow-lg'
                      : 'vd-gradient-gold text-white hover:opacity-90 shadow-md'
                  }`}
                >
                  {btnText}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <button
                  type="button"
                  disabled={loadingPlan === p.plan}
                  onClick={() => {
                    if (!session) {
                      onLoginRequired?.();
                      return;
                    }
                    if (isFree || discountedPrice === 0) {
                      onFreeActivate?.(p);
                    } else {
                      onCheckout?.(p);
                    }
                  }}
                  className={`mt-auto flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-bold text-sm transition-all disabled:opacity-60 ${
                    isHighlight
                      ? 'bg-white text-vd-primary-dark hover:bg-vd-primary-light shadow-lg'
                      : 'vd-gradient-gold text-white hover:opacity-90 shadow-md'
                  }`}
                >
                  {loadingPlan === p.plan ? (
                    <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : isFree ? (
                    <Star className="w-4 h-4" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                  {btnText}
                </button>
              )}
            </div>
          </motion.article>
        );

        return card;
      })}
    </div>
  );
}
