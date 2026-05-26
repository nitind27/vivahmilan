'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import SiteLoader, { SiteLoaderInline } from '@/components/SiteLoader';
import {
  CheckCircle, Star, Zap, Shield, MessageCircle,
  Eye, TrendingUp, Lock, Crown, Sparkles, ChevronDown,
  Tag, X
} from 'lucide-react';
import toast from 'react-hot-toast';

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
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  // Coupon state
  const [showCheckout, setShowCheckout] = useState(null); // holds the plan object
  const [couponCode, setCouponCode] = useState('');
  const [discountData, setDiscountData] = useState(null);
  const [verifyingCoupon, setVerifyingCoupon] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    fetch('/api/plans') // Need to create this endpoint or use /api/admin/plans without auth? Wait, users need an endpoint.
      .then(r => r.json())
      .then(d => { setPlans(Array.isArray(d) ? d.filter(p => p.isActive) : []); setLoadingPlans(false); })
      .catch(() => setLoadingPlans(false));
  }, []);

  // Load Cashfree JS SDK
  useEffect(() => {
    if (document.getElementById('cashfree-sdk')) { setSdkLoaded(true); return; }
    const script = document.createElement('script');
    script.id = 'cashfree-sdk';
    const env = process.env.NEXT_PUBLIC_CASHFREE_ENV || 'sandbox';
    script.src = env === 'production'
      ? 'https://sdk.cashfree.com/js/v3/cashfree.js'
      : 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.onload = () => setSdkLoaded(true);
    document.head.appendChild(script);
  }, []);

  const applyCoupon = async () => {
    if (!couponCode) return;
    setVerifyingCoupon(true);
    try {
      const res = await fetch('/api/payment/apply-coupon', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, planId: showCheckout.plan })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Invalid coupon');
        setDiscountData(null);
      } else {
        toast.success(`Coupon applied! ${data.discountPct}% off`);
        setDiscountData(data);
      }
    } catch (e) {
      toast.error('Failed to verify coupon');
    } finally {
      setVerifyingCoupon(false);
    }
  };

  const handleProceedToPay = async (planToCheckout = showCheckout) => {
    if (!session) { router.push('/login'); return; }
    if (session.user.isPremium) { toast('You already have an active premium plan!'); return; }

    const plan = planToCheckout;
    setLoadingPlan(plan.plan);
    try {
      // Step 1: Create order on backend (pass the calculated price via duration param if API supports it, 
      // but the API create-order recalculates it from DB. I need to pass customAmount and durationDays to create-order so it can use them)
      const res = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          plan: plan.plan, 
          couponCode: discountData ? couponCode : null,
          customAmount: plan.calculatedPrice,
          durationDays: plan.calculatedDays
        }),
      });

      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed to create order'); return; }

      // If price was 0 (100% discount), it activates instantly without cashfree
      if (data.instantActivation) {
        toast.success('Subscription activated successfully!');
        window.location.reload();
        return;
      }

      const { paymentSessionId } = data;

      // Step 2: Open Cashfree checkout
      if (!window.Cashfree) { toast.error('Payment SDK not loaded. Please refresh.'); return; }

      const cashfree = await window.Cashfree({
        mode: process.env.NEXT_PUBLIC_CASHFREE_ENV === 'production' ? 'production' : 'sandbox',
      });

      const checkoutOptions = {
        paymentSessionId,
        redirectTarget: '_self',
      };

      cashfree.checkout(checkoutOptions);
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoadingPlan(null);
      setShowCheckout(null);
    }
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
                
                const perms = p.permissions ? JSON.parse(p.permissions) : {};
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
                            const checkoutPlan = { ...p, calculatedPrice: discountedPrice, calculatedDays: isLifetime ? 36500 : selectedMonths * 30 };
                            if (discountedPrice === 0) {
                              setShowCheckout(checkoutPlan);
                              handleProceedToPay(checkoutPlan); 
                            } else {
                              setShowCheckout(checkoutPlan);
                            }
                          }}
                          disabled={!sdkLoaded}
                          className={`w-full py-3 mt-auto rounded-2xl font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 ${
                            !isActive && isHighlight
                              ? 'bg-white text-vd-primary hover:bg-gray-50'
                              : 'vd-gradient-gold text-white hover:opacity-90'
                          } disabled:opacity-70 disabled:cursor-not-allowed`}>
                          {btnIcon} {btnText}
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

      {/* Perks & FAQ Sections unchanged ... */}
      
      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-vd-bg-card border border-vd-border rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setShowCheckout(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white bg-gray-800 rounded-full p-1"><X className="w-5 h-5"/></button>
            <h3 className="text-2xl font-bold mb-2 flex items-center gap-2"><Star className="w-5 h-5 text-yellow-500 fill-yellow-500"/> Checkout</h3>
            <p className="text-sm text-gray-400 mb-6">You are purchasing the <strong className="text-white">{showCheckout.displayName}</strong> plan for {showCheckout.durationDays} days.</p>
            
            <div className="bg-gray-900 rounded-2xl p-4 mb-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Plan Duration</span>
                <span className="font-semibold text-white">{showCheckout.calculatedDays >= 3650 ? 'Lifetime' : `${showCheckout.calculatedDays / 30} Months`}</span>
              </div>
              {discountData && (
                <div className="flex justify-between text-sm text-green-400">
                  <span>Discount ({discountData.discountPct}%)</span>
                </div>
              )}
              <div className="border-t border-gray-700 pt-3 flex justify-between font-bold text-lg">
                <span>Total Amount</span>
                <span className="text-vd-primary">₹{showCheckout.calculatedPrice.toLocaleString()}</span>
              </div>
            </div>

            <div className="mb-6">
              <label className="text-xs font-semibold text-gray-400 mb-2 block uppercase tracking-wider">Have a Coupon Code?</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} placeholder="ENTER CODE" 
                    className="w-full pl-9 pr-3 py-3 bg-gray-900 border border-gray-700 rounded-xl text-sm font-semibold uppercase focus:outline-none focus:border-vd-primary" />
                </div>
                <button onClick={applyCoupon} disabled={!couponCode || verifyingCoupon} className="px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-bold text-sm text-white disabled:opacity-50 transition-colors">
                  {verifyingCoupon ? '...' : 'Apply'}
                </button>
              </div>
            </div>

            <button onClick={() => handleProceedToPay(showCheckout)} disabled={loadingPlan} className="w-full py-4 vd-gradient-gold text-white rounded-xl font-bold text-lg shadow-lg hover:opacity-90 flex items-center justify-center gap-2">
              {loadingPlan ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Lock className="w-5 h-5" />}
              Proceed to Pay ₹{showCheckout.calculatedPrice.toLocaleString()}
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
