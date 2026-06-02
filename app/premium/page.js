'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import { SiteLoaderInline } from '@/components/SiteLoader';
import EarlyBirdOfferCard from '@/components/EarlyBirdOfferCard';
import PricingPlanGrid from '@/components/PricingPlanGrid';
import { normalizePlans } from '@/lib/plans.js';
import {
  CheckCircle, Crown, MessageCircle, Eye, TrendingUp,
  Shield, Zap, Star, Ticket,
} from 'lucide-react';
import toast from 'react-hot-toast';

const DURATION_OPTIONS = [
  { label: '3 Months', months: 3 },
  { label: '6 Months', months: 6 },
  { label: '12 Months', months: 12 },
];

const PERKS = [
  { icon: MessageCircle, title: 'Unlimited Chat', desc: 'Talk freely with your matches' },
  { icon: Eye, title: 'Contact Details', desc: 'View verified phone & email' },
  { icon: TrendingUp, title: 'Profile Boost', desc: 'Appear higher in search' },
  { icon: Shield, title: 'Verified Badge', desc: 'Stand out with trust' },
  { icon: Zap, title: 'AI Match Score', desc: 'Smarter compatibility' },
  { icon: Star, title: 'Priority Support', desc: 'Faster help when you need it' },
];

export default function PremiumPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [selectedMonths, setSelectedMonths] = useState(3);
  const [couponCode, setCouponCode] = useState('');
  const [discountPct, setDiscountPct] = useState(0);
  const [verifyingCoupon, setVerifyingCoupon] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    fetch('/api/plans')
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(d => setPlans(normalizePlans(d)))
      .catch(() => setPlans([]))
      .finally(() => setLoadingPlans(false));
  }, []);

  const goToCheckout = (plan) => {
    const params = new URLSearchParams({ plan: plan.plan, months: String(selectedMonths) });
    if (discountPct && couponCode.trim()) params.set('coupon', couponCode.trim());
    router.push(`/payment/checkout?${params.toString()}`);
  };

  const handleFreeActivate = (plan) => {
    setLoadingPlan(plan.plan);
    fetch('/api/payment/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan: plan.plan,
        couponCode: discountPct ? couponCode : null,
        durationDays: selectedMonths * 30,
      }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.instantActivation) {
          toast.success('Premium activated!');
          window.location.reload();
        } else toast.error(data.error || 'Activation failed');
      })
      .finally(() => setLoadingPlan(null));
  };

  const validateCoupon = async () => {
    if (!couponCode.trim()) return;
    setVerifyingCoupon(true);
    setDiscountPct(0);
    try {
      const firstPlan = plans.find(p => p.plan !== 'EARLY_BIRD')?.plan || 'GOLD';
      const res = await fetch('/api/payment/apply-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim(), planId: firstPlan }),
      });
      const data = await res.json();
      if (!res.ok) toast.error(data.error || 'Invalid coupon code');
      else {
        toast.success(`Coupon applied! ${data.discountPct}% off`);
        setDiscountPct(data.discountPct);
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setVerifyingCoupon(false);
    }
  };

  return (
    <div className="min-h-screen bg-vd-bg">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-24 pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-vd-accent-soft/40 via-vd-bg to-vd-bg pointer-events-none" />
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-vd-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-vd-primary/10 border border-vd-primary/25 text-vd-primary text-xs font-semibold uppercase tracking-widest mb-5">
              <Crown className="w-3.5 h-3.5" />
              Premium Membership
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 text-balance">
              Unlock Your <span className="vd-gradient-text">Perfect Match</span>
            </h1>
            <p className="text-vd-text-sub text-base sm:text-lg max-w-2xl mx-auto">
              Choose a plan that fits your journey. Upgrade anytime — secure payments, instant activation.
            </p>
            {session?.user?.isPremium && (
              <div className="mt-5 inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 px-4 py-2 rounded-full text-sm font-semibold">
                <CheckCircle className="w-4 h-4" />
                Active plan: {session.user.premiumPlan}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section className="pb-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <EarlyBirdOfferCard className="mb-12 max-w-3xl mx-auto" />

          {/* Section header + controls */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-2">
              Simple <span className="vd-gradient-text">Pricing</span>
            </h2>
            <p className="text-vd-text-sub text-sm sm:text-base max-w-lg mx-auto mb-8">
              Transparent plans — no hidden fees. Pick duration, apply a coupon, and checkout in minutes.
            </p>

            <div className="inline-flex p-1.5 rounded-2xl bg-vd-bg-section border border-vd-border shadow-sm gap-1 flex-wrap justify-center mb-8">
              {DURATION_OPTIONS.map(opt => (
                <button
                  key={opt.months}
                  type="button"
                  onClick={() => setSelectedMonths(opt.months)}
                  className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    selectedMonths === opt.months
                      ? 'vd-gradient-gold text-white shadow-md'
                      : 'text-vd-text-sub hover:text-vd-text-heading hover:bg-vd-bg-alt'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="max-w-md mx-auto">
              <div className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-vd-primary/30 bg-vd-bg-section px-4 py-3 shadow-sm">
                <div className="w-10 h-10 rounded-xl vd-gradient-gold flex items-center justify-center flex-shrink-0">
                  <Ticket className="w-5 h-5 text-white" />
                </div>
                <input
                  value={couponCode}
                  onChange={e => {
                    setCouponCode(e.target.value.toUpperCase());
                    setDiscountPct(0);
                  }}
                  onKeyDown={e => e.key === 'Enter' && validateCoupon()}
                  placeholder="Coupon code"
                  className="flex-1 min-w-0 bg-transparent text-sm outline-none uppercase font-semibold tracking-wide"
                />
                <button
                  type="button"
                  onClick={validateCoupon}
                  disabled={verifyingCoupon || !couponCode.trim()}
                  className="text-xs font-bold px-4 py-2 vd-gradient-gold text-white rounded-xl disabled:opacity-50"
                >
                  {verifyingCoupon ? '…' : 'Apply'}
                </button>
              </div>
              {discountPct > 0 && (
                <p className="text-green-600 dark:text-green-400 text-sm mt-3 font-medium">
                  {discountPct}% discount applied to all paid plans
                </p>
              )}
            </div>
          </motion.div>

          {/* Plan cards */}
          {loadingPlans ? (
            <SiteLoaderInline message="Loading plans…" className="py-20" />
          ) : (
            <PricingPlanGrid
              plans={plans}
              selectedMonths={selectedMonths}
              discountPct={discountPct}
              session={session}
              mode="checkout"
              loadingPlan={loadingPlan}
              onCheckout={goToCheckout}
              onFreeActivate={handleFreeActivate}
              onLoginRequired={() => router.push('/login?callbackUrl=/premium')}
            />
          )}

          {/* Trust perks */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
          >
            {PERKS.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="text-center p-4 rounded-2xl bg-vd-bg-section border border-vd-border hover:border-vd-primary/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-vd-primary/10 flex items-center justify-center mx-auto mb-2">
                  <Icon className="w-5 h-5 text-vd-primary" />
                </div>
                <p className="text-xs font-bold text-vd-text-heading">{title}</p>
                <p className="text-[10px] text-vd-text-sub mt-0.5 leading-snug">{desc}</p>
              </div>
            ))}
          </motion.div>

          <p className="text-center text-xs text-vd-text-light mt-10 max-w-2xl mx-auto">
            All payments are secure via Cashfree (UPI, cards, net banking). Plans auto-adjust when you add or edit them in admin — layout stays balanced on every screen size.
          </p>
        </div>
      </section>
    </div>
  );
}
