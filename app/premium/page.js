'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import SiteLoader, { SiteLoaderInline } from '@/components/SiteLoader';
import { normalizePlans, parsePlanPermissions } from '@/lib/plans.js';
import {
  CheckCircle, Star, Zap, Shield, MessageCircle,
  Eye, TrendingUp, Lock, Crown, Sparkles, ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import EarlyBirdOfferCard from '@/components/EarlyBirdOfferCard';

const PERKS = [
  { icon: MessageCircle, title: 'Unlimited Chat', desc: 'Chat freely with all your matches.' },
  { icon: Eye, title: 'See Contact Details', desc: 'View phone numbers and emails.' },
  { icon: TrendingUp, title: 'Profile Boost', desc: 'Get featured at the top of search results.' },
  { icon: Shield, title: 'Verified Badge', desc: 'Stand out with a premium verified badge.' },
  { icon: Zap, title: 'AI Match Score', desc: 'Compatibility scores powered by AI.' },
  { icon: Star, title: 'Priority Support', desc: '24/7 dedicated support.' },
];

export default function PremiumPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);

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

  const [couponCode, setCouponCode] = useState('');
  const [discountData, setDiscountData] = useState(null);
  const [verifyingCoupon, setVerifyingCoupon] = useState(false);

  const goToCheckout = (planName) => {
    const params = new URLSearchParams({ plan: planName, months: String(selectedMonths) });
    if (discountData && couponCode.trim()) params.set('coupon', couponCode.trim());
    router.push(`/payment/checkout?${params.toString()}`);
  };

  const getFeaturesList = (perms) => {
    const list = [];
    if (perms.canChat) list.push('Unlimited Chat');
    if (perms.interestLimit === -1) list.push('Unlimited Interests');
    else list.push(`Send ${perms.interestLimit} Interests / month`);
    if (perms.canSeeContact) list.push('View Contact Details');
    if (perms.canSeeWhoViewed) list.push('See Who Viewed You');
    if (perms.canBoostProfile) list.push('Profile Boost');
    if (perms.aiMatchScore) list.push('AI Match Score');
    return list;
  };

  const DURATION_OPTIONS = [
    { label: '3 Months', months: 3 },
    { label: '6 Months', months: 6 },
    { label: '12 Months', months: 12 },
    { label: 'Lifetime', months: 0 },  // 0 = lifetime
  ];

  const [selectedMonths, setSelectedMonths] = useState(3);
  
  function formatINR(amount) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  }

  const validateCoupon = async () => {
    if (!couponCode.trim()) return;
    setVerifyingCoupon(true);
    setDiscountData(null);
    try {
      // Just check validity against a dummy plan to get the percentage
      // Our apply-coupon endpoint requires a planId. Let's just use the first plan.
      const firstPlan = plans[0]?.plan || 'GOLD';
      const res = await fetch('/api/payment/apply-coupon', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim(), planId: firstPlan })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Invalid coupon code');
      } else {
        toast.success(`Coupon applied! ${data.discountPct}% off`);
        setDiscountData(data); // Using this as the global discount
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
      <section className="pt-24 pb-16 bg-vd-bg">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Crown className="w-4 h-4 fill-yellow-500" /> Premium Membership
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              Unlock Your <span className="vd-gradient-text">Perfect Match</span>
            </h1>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Get unlimited access to all features and find your life partner faster.
            </p>
            {session?.user?.isPremium && (
              <div className="mt-4 inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-4 py-2 rounded-full text-sm font-medium">
                <CheckCircle className="w-4 h-4" /> You have an active Premium plan ({session.user.premiumPlan})
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Plans */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <EarlyBirdOfferCard className="mb-10 max-w-4xl mx-auto" />

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
            <h2 className="text-4xl font-bold mb-4">Simple <span className="vd-gradient-text">Pricing</span></h2>
            <p className="text-vd-text-sub mb-6">Choose the plan that works for you.</p>
            {/* Duration Tabs */}
            <div className="inline-flex bg-vd-bg-section border border-vd-border rounded-2xl p-1 gap-1 flex-wrap justify-center shadow-sm">
              {DURATION_OPTIONS.map(opt => (
                <button key={opt.months} onClick={() => setSelectedMonths(opt.months)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedMonths === opt.months ? 'vd-gradient-gold text-white shadow' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Coupon Input */}
          <div className="flex justify-center mb-10">
            <div className="flex items-center gap-2 bg-vd-bg-section border border-vd-border shadow-sm rounded-2xl px-4 py-2 w-full max-w-sm">
              <input
                value={couponCode}
                onChange={e => { setCouponCode(e.target.value.toUpperCase()); setDiscountData(null); }}
                onKeyDown={e => e.key === 'Enter' && validateCoupon()}
                placeholder="Have a coupon code?"
                className="flex-1 bg-transparent text-sm outline-none text-gray-900 dark:text-white placeholder:text-gray-400 tracking-widest uppercase font-semibold"
              />
              <button onClick={validateCoupon} disabled={verifyingCoupon || !couponCode.trim()}
                className="text-xs font-semibold px-3 py-1.5 vd-gradient-gold text-white rounded-xl disabled:opacity-50 transition-all shadow-md">
                {verifyingCoupon ? '...' : 'Apply'}
              </button>
            </div>
          </div>
          {discountData && (
            <p className="text-center text-green-500 dark:text-green-400 text-sm mb-6 font-semibold">
              🎉 Coupon applied! {discountData.discountPct}% off on all plans
            </p>
          )}

          {loadingPlans ? (
            <SiteLoaderInline message="Loading plans…" className="py-20" />
          ) : plans.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <Crown className="w-10 h-10 mx-auto mb-3 text-vd-primary/40" />
              <p className="font-medium text-gray-700 dark:text-gray-300">No premium plans available right now.</p>
              <p className="text-sm mt-1">Please check back later or contact support.</p>
            </div>
          ) : (
            <div className={`grid gap-6 max-w-5xl mx-auto ${plans.length <= 2 ? 'md:grid-cols-2' : plans.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-4'}`}>
              {plans.map((p, i) => {
                const userPlan = session?.user?.premiumPlan;
                const isActive = p.plan === userPlan && session?.user?.isPremium;
                const isHighlight = p.plan === 'GOLD';
                
                const basePrice = Number(p.price || 0);
                const baseDays = Number(p.durationDays || 30);
                const pricePerDay = baseDays > 0 ? basePrice / baseDays : 0;
                
                const isLifetime = selectedMonths === 0;
                const isFree = basePrice === 0;
                const totalDays = isLifetime ? 0 : selectedMonths * 30;
                
                let totalPrice = isFree ? 0 : isLifetime ? 4999 : Math.round(pricePerDay * totalDays);
                const discount = discountData ? discountData.discountPct : 0;
                const discountedPrice = isFree ? 0 : Math.round(totalPrice * (1 - discount / 100));
                
                const perms = parsePlanPermissions(p.permissions);
                const features = getFeaturesList(perms);
                
                return (
                  <motion.div key={p.plan} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.12, duration: 0.5 }} viewport={{ once: true }}
                    className={`rounded-3xl p-6 border-2 relative flex flex-col h-full shadow-lg transition-all ${
                      isActive 
                        ? 'border-vd-primary ring-2 ring-green-500 scale-105 z-10 bg-vd-bg-section dark:bg-vd-bg-card' 
                        : isHighlight 
                          ? 'vd-gradient-gold text-white border-transparent scale-105 z-10' 
                          : 'bg-vd-bg-section dark:bg-vd-bg-card border-vd-border hover:border-vd-primary/50'
                    }`}>
                    
                    {isActive && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1 shadow-md whitespace-nowrap">
                        <CheckCircle className="w-3.5 h-3.5" /> Active Plan
                      </div>
                    )}
                    {!isActive && isHighlight && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-md">Most Popular</div>}
                    {!isActive && isLifetime && !isFree && <div className="absolute -top-3 right-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-md">Best Value</div>}
                    
                    <h3 className={`text-xl font-bold mb-1 mt-2 ${!isActive && isHighlight ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{p.displayName || p.plan}</h3>
                    {p.description && <p className={`text-xs mb-3 ${!isActive && isHighlight ? 'text-white/80' : 'text-gray-500'}`}>{p.description}</p>}
                    
                    <div className="flex items-baseline gap-2 mb-1">
                      {isFree ? (
                        <span className="text-4xl font-black">Free</span>
                      ) : (
                        <>
                          {discount > 0 && <span className={`text-lg line-through font-semibold ${!isActive && isHighlight ? 'text-white/60' : 'text-gray-400'}`}>{formatINR(totalPrice)}</span>}
                          <span className={`text-4xl font-black ${!isActive && isHighlight ? 'text-white' : 'text-vd-primary'}`}>{formatINR(discountedPrice)}</span>
                        </>
                      )}
                    </div>
                    {!isFree && (
                      <p className={`text-xs mb-6 font-medium ${!isActive && isHighlight ? 'text-white/80' : 'text-gray-500'}`}>
                        {isLifetime ? 'one-time payment for lifetime access' : `for ${selectedMonths} month${selectedMonths > 1 ? 's' : ''}`}
                        {discount > 0 && <span className="ml-1 text-green-400 font-bold">({discount}% off)</span>}
                      </p>
                    )}
                    {isFree && <p className={`text-xs mb-6 ${!isActive && isHighlight ? 'text-white/80' : 'text-gray-500'}`}>forever</p>}
                    
                    <ul className="space-y-3 mb-8 flex-1">
                      {features.map(f => (
                        <li key={f} className="flex items-start gap-2 text-sm font-medium">
                          <CheckCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${!isActive && isHighlight ? 'text-white' : 'text-vd-primary'}`} />
                          <span className={!isActive && isHighlight ? 'text-white/95' : 'text-gray-700 dark:text-gray-300'}>{f}</span>
                        </li>
                      ))}
                    </ul>
                    
                    {(() => {
                      const hasAnyPlan = session?.user?.isPremium;
                      const userPlanObj = plans.find(pl => pl.plan === userPlan);
                      const userBasePrice = userPlanObj ? Number(userPlanObj.price || 0) : 0;
                      const currentBasePrice = Number(p.price || 0);

                      let btnText = `Get ${p.displayName || p.plan}`;
                      let btnIcon = <Lock className="w-4 h-4" />;
                      
                      if (hasAnyPlan) {
                        if (isActive) {
                          btnText = `Extend Plan`;
                          btnIcon = <CheckCircle className="w-4 h-4" />;
                        } else if (currentBasePrice > userBasePrice) {
                          btnText = `Upgrade to ${p.displayName || p.plan}`;
                          btnIcon = <TrendingUp className="w-4 h-4" />;
                        } else {
                          btnText = `Switch to ${p.displayName || p.plan}`;
                          btnIcon = <Crown className="w-4 h-4" />;
                        }
                      }

                      return (
                        <button
                          onClick={() => {
                            if (!session) { router.push('/login'); return; }
                            if (discountedPrice === 0) {
                              setLoadingPlan(p.plan);
                              fetch('/api/payment/create-order', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  plan: p.plan,
                                  couponCode: discountData ? couponCode : null,
                                  durationDays: isLifetime ? 36500 : selectedMonths * 30,
                                }),
                              }).then(r => r.json()).then(data => {
                                if (data.instantActivation) {
                                  toast.success('Premium activated!');
                                  window.location.reload();
                                } else toast.error('Activation failed');
                              }).finally(() => setLoadingPlan(null));
                            } else {
                              goToCheckout(p.plan);
                            }
                          }}
                          disabled={loadingPlan === p.plan}
                          className={`w-full py-3 mt-auto rounded-2xl font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 ${
                            !isActive && isHighlight
                              ? 'bg-white text-vd-primary hover:bg-gray-50'
                              : 'vd-gradient-gold text-white hover:opacity-90'
                          } disabled:opacity-70 disabled:cursor-not-allowed`}>
                          {loadingPlan === p.plan ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            btnIcon
                          )} {btnText}
                        </button>
                      );
                    })()}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
