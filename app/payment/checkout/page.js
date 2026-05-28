'use client';

import { Suspense, useEffect, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import SiteLoader from '@/components/SiteLoader';
import { useCashfreeSdk } from '@/components/CashfreeCheckout';
import {
  Crown, Shield, Lock, Heart, CheckCircle, Tag, ArrowLeft,
  Sparkles, CreditCard, Smartphone, Building2, Mail, Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';

const PLAN_ICONS = { FREE: Heart, SILVER: Sparkles, GOLD: Crown, PLATINUM: Crown };

function formatINR(n) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

function calcPrice(plan, months, discountPct = 0) {
  const basePrice = Number(plan.price || 0);
  const baseDays = Number(plan.durationDays || 30);
  if (basePrice === 0) return { total: 0, original: 0, days: months * 30 || baseDays, isLifetime: false, isFree: true };
  const isLifetime = months === 0;
  const days = isLifetime ? 36500 : months * 30;
  const pricePerDay = baseDays > 0 ? basePrice / baseDays : 0;
  const original = isLifetime ? 4999 : Math.round(pricePerDay * days);
  const total = Math.round(original * (1 - discountPct / 100));
  return { total, original, days, isLifetime, isFree: false };
}

function CheckoutInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { ready: sdkReady, openCheckout } = useCashfreeSdk();

  const planKey = (searchParams.get('plan') || 'GOLD').toUpperCase();
  const months = parseInt(searchParams.get('months') || '3', 10);
  const initialCoupon = searchParams.get('coupon') || '';

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [openingGateway, setOpeningGateway] = useState(false);
  const [couponCode, setCouponCode] = useState(initialCoupon);
  const [discountPct, setDiscountPct] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login?callbackUrl=/payment/checkout');
  }, [status, router]);

  useEffect(() => {
    fetch('/api/plans')
      .then(r => r.json())
      .then(d => setPlans(Array.isArray(d) ? d.filter(p => p.isActive) : []))
      .catch(() => toast.error('Failed to load plans'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (initialCoupon && plans.length) applyCoupon(initialCoupon);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plans.length]);

  const plan = useMemo(() => plans.find(p => p.plan === planKey), [plans, planKey]);
  const pricing = useMemo(() => (plan ? calcPrice(plan, months, discountPct) : null), [plan, months, discountPct]);

  const features = useMemo(() => {
    if (!plan?.permissions) return [];
    try {
      const p = JSON.parse(plan.permissions);
      return [
        p.canChat && 'Unlimited Chat',
        p.canSeeContact && 'View Contact Details',
        p.canBoostProfile && 'Profile Boost',
        p.canSeeWhoViewed && 'See Who Viewed You',
        p.unlimitedInterests && 'Unlimited Interests',
        p.aiMatchScore && 'AI Match Score',
        !p.unlimitedInterests && p.interestLimit > 0 && `${p.interestLimit} Interests / month`,
        'Browse Verified Matches',
      ].filter(Boolean);
    } catch { return []; }
  }, [plan]);

  const PlanIcon = PLAN_ICONS[planKey] || Crown;
  const durationLabel = months === 0 ? 'Lifetime' : `${months} Month${months > 1 ? 's' : ''}`;

  const applyCoupon = async (code = couponCode) => {
    if (!code.trim()) return;
    setCouponLoading(true);
    try {
      const res = await fetch('/api/payment/apply-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim(), planId: planKey }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Invalid coupon');
        setDiscountPct(0);
      } else {
        toast.success(`${data.discountPct}% discount applied`);
        setDiscountPct(data.discountPct);
        setCouponCode(code.trim().toUpperCase());
      }
    } catch {
      toast.error('Could not verify coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const handlePay = async () => {
    if (!plan || !pricing || !session) return;
    setPaying(true);
    try {
      const res = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: planKey,
          couponCode: discountPct > 0 ? couponCode : null,
          durationDays: pricing.days,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Could not start payment'); return; }

      if (data.instantActivation) {
        toast.success('Premium activated!');
        router.push('/dashboard');
        return;
      }

      if (!sdkReady) { toast.error('Payment gateway loading… please wait'); return; }

      setOpeningGateway(true);
      await openCheckout(data.paymentSessionId, '_self');
    } catch (err) {
      console.error(err);
      toast.error('Payment could not be started');
      setOpeningGateway(false);
    } finally {
      setPaying(false);
    }
  };

  if (status === 'loading' || loading) {
    return <SiteLoader message="Preparing secure checkout…" />;
  }

  if (!plan || !pricing) {
    return (
      <div className="min-h-screen bg-vd-bg flex flex-col items-center justify-center px-4">
        <p className="text-vd-text-sub mb-4">Plan not found.</p>
        <Link href="/premium" className="vd-gradient-gold text-white px-6 py-3 rounded-xl font-semibold">View Plans</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-vd-bg relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute -top-32 right-0 w-96 h-96 bg-vd-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-vd-accent/15 rounded-full blur-3xl" />
      </div>

      <Navbar />

      {/* Gateway overlay */}
      {openingGateway && (
        <div className="fixed inset-0 z-[100] bg-vd-bg/95 backdrop-blur-md flex flex-col items-center justify-center px-6">
          <div className="w-16 h-16 vd-gradient-gold rounded-2xl flex items-center justify-center mb-6 shadow-xl">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <Loader2 className="w-10 h-10 text-vd-primary animate-spin mb-4" />
          <h2 className="text-xl font-bold text-vd-text-heading mb-2">Opening Secure Payment</h2>
          <p className="text-vd-text-sub text-sm text-center max-w-xs">
            Redirecting to Cashfree — India&apos;s trusted payment gateway. Do not close this window.
          </p>
        </div>
      )}

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        {/* Back + steps */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <Link href="/premium" className="inline-flex items-center gap-2 text-sm text-vd-text-sub hover:text-vd-primary transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to plans
          </Link>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
            {['Plan', 'Payment', 'Done'].map((step, i) => (
              <span key={step} className="flex items-center gap-2">
                {i > 0 && <span className="text-vd-border">→</span>}
                <span className={i === 1 ? 'text-vd-primary' : 'text-vd-text-light'}>{step}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-8 items-start">
          {/* Left — plan details */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 space-y-6"
          >
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-vd-primary/10 border border-vd-primary/25 text-vd-primary-dark text-xs font-semibold uppercase tracking-widest mb-4">
                <Heart className="w-3.5 h-3.5 fill-vd-primary text-vd-primary" /> Vivah Dwar Premium
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-vd-text-heading leading-tight">
                Complete Your <span className="vd-gradient-text">Premium</span> Journey
              </h1>
              <p className="text-vd-text-sub text-sm mt-2 leading-relaxed">
                Invest in finding your life partner with trusted features and verified matches.
              </p>
            </div>

            <div className="rounded-3xl border border-vd-border bg-vd-bg-section p-6 shadow-sm">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 vd-gradient-gold rounded-2xl flex items-center justify-center shadow-md">
                  <PlanIcon className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-vd-text-heading">{plan.displayName || plan.plan}</h2>
                  <p className="text-xs text-vd-text-sub">{durationLabel} access</p>
                </div>
              </div>
              {plan.description && (
                <p className="text-sm text-vd-text-sub mb-4 leading-relaxed">{plan.description}</p>
              )}
              <ul className="space-y-2.5">
                {features.map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-vd-text-sub">
                    <CheckCircle className="w-4 h-4 text-vd-primary flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Trust */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Shield, label: 'SSL Secured', sub: '256-bit encryption' },
                { icon: Mail, label: 'Email Receipt', sub: 'Instant confirmation' },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="rounded-2xl border border-vd-border bg-vd-bg-section/80 p-4">
                  <Icon className="w-5 h-5 text-vd-primary mb-2" />
                  <p className="text-xs font-bold text-vd-text-heading">{label}</p>
                  <p className="text-[11px] text-vd-text-light">{sub}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right — payment card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-3"
          >
            <div className="rounded-3xl border-2 border-vd-primary/30 bg-vd-bg-section shadow-xl overflow-hidden">
              {/* Gold header strip */}
              <div className="vd-gradient-gold px-6 py-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-5 h-5" />
                    <span className="font-bold text-sm uppercase tracking-wider">Secure Checkout</span>
                  </div>
                  <img src="/logo/icon.png" alt="" className="w-8 h-8 rounded-full bg-white/20 p-1 object-contain" onError={e => { e.target.style.display = 'none'; }} />
                </div>
              </div>

              <div className="p-6 sm:p-8">
                {/* Order summary */}
                <h3 className="text-sm font-bold uppercase tracking-widest text-vd-text-light mb-4">Order Summary</h3>
                <div className="rounded-2xl bg-vd-bg-alt p-5 space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-vd-text-sub">{plan.displayName || plan.plan} · {durationLabel}</span>
                    {!pricing.isFree && <span className="font-semibold text-vd-text-heading">{formatINR(pricing.original)}</span>}
                  </div>
                  {discountPct > 0 && (
                    <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                      <span className="flex items-center gap-1"><Tag className="w-3.5 h-3.5" /> Coupon ({discountPct}% off)</span>
                      <span>− {formatINR(pricing.original - pricing.total)}</span>
                    </div>
                  )}
                  <div className="border-t border-vd-border pt-3 flex justify-between items-end">
                    <span className="font-bold text-vd-text-heading">Total Payable</span>
                    <span className="text-3xl font-black vd-gradient-text">
                      {pricing.isFree ? 'FREE' : formatINR(pricing.total)}
                    </span>
                  </div>
                </div>

                {/* Coupon */}
                <div className="mb-6">
                  <label className="text-xs font-bold uppercase tracking-wider text-vd-text-light mb-2 block">Promo Code</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vd-text-light" />
                      <input
                        value={couponCode}
                        onChange={e => { setCouponCode(e.target.value.toUpperCase()); setDiscountPct(0); }}
                        onKeyDown={e => e.key === 'Enter' && applyCoupon()}
                        placeholder="Enter code"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-vd-border bg-vd-bg text-sm font-semibold uppercase tracking-wide outline-none focus:border-vd-primary transition-colors"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => applyCoupon()}
                      disabled={couponLoading || !couponCode.trim()}
                      className="px-5 py-3 rounded-xl border border-vd-border font-bold text-sm hover:bg-vd-bg-alt disabled:opacity-50 transition-colors"
                    >
                      {couponLoading ? '…' : 'Apply'}
                    </button>
                  </div>
                </div>

                {/* Payment methods info */}
                <div className="mb-6">
                  <p className="text-xs font-bold uppercase tracking-wider text-vd-text-light mb-3">Pay via</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { icon: Smartphone, label: 'UPI' },
                      { icon: CreditCard, label: 'Cards' },
                      { icon: Building2, label: 'Net Banking' },
                      { icon: Smartphone, label: 'Wallets' },
                    ].map(({ icon: Icon, label }) => (
                      <span key={label} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-vd-bg-alt border border-vd-border text-xs font-medium text-vd-text-sub">
                        <Icon className="w-3.5 h-3.5 text-vd-primary" /> {label}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-vd-text-light mt-2 flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Powered by Cashfree Payments · PCI-DSS compliant
                  </p>
                </div>

                {/* Pay button */}
                <button
                  type="button"
                  onClick={handlePay}
                  disabled={paying || !sdkReady}
                  className="w-full py-4 rounded-2xl vd-gradient-gold text-white font-bold text-lg shadow-lg hover:opacity-95 disabled:opacity-60 transition-all flex items-center justify-center gap-3"
                >
                  {paying ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Lock className="w-5 h-5" />
                  )}
                  {pricing.isFree ? 'Activate Free Plan' : `Pay ${formatINR(pricing.total)} Securely`}
                </button>

                <p className="text-center text-[11px] text-vd-text-light mt-4 leading-relaxed">
                  By proceeding, you agree to our{' '}
                  <Link href="/terms" className="text-vd-primary hover:underline">Terms</Link> and{' '}
                  <Link href="/refund" className="text-vd-primary hover:underline">Refund Policy</Link>.
                  Receipt will be sent to <strong className="text-vd-text-sub">{session?.user?.email}</strong>.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentCheckoutPage() {
  return (
    <Suspense fallback={<SiteLoader message="Loading checkout…" />}>
      <CheckoutInner />
    </Suspense>
  );
}
