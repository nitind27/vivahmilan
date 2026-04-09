'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import {
  CheckCircle, Star, Zap, Shield, MessageCircle,
  Eye, TrendingUp, Lock, Crown, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

const PLANS = [
  {
    id: 'SILVER',
    name: 'Silver',
    price: 749,
    period: '/month',
    color: 'from-gray-400 to-gray-500',
    badge: null,
    features: [
      '50 Interests per month',
      'View 10 contact details',
      'Advanced search filters',
      'Read receipts',
      'Priority in search',
    ],
  },
  {
    id: 'GOLD',
    name: 'Gold',
    price: 1499,
    period: '/month',
    color: 'from-yellow-400 to-orange-500',
    badge: 'Most Popular',
    features: [
      'Unlimited Interests',
      'View all contact details',
      'Advanced search filters',
      'Read receipts',
      'Chat with matches',
      'Profile boost (2x/month)',
    ],
  },
  {
    id: 'PLATINUM',
    name: 'Platinum',
    price: 2999,
    period: '/month',
    color: 'from-purple-500 to-pink-600',
    badge: 'Best Value',
    features: [
      'Everything in Gold',
      'Unlimited Chat',
      'Weekly profile boost',
      'AI Match Score',
      'Dedicated manager',
      'Video call feature',
    ],
  },
];

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
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [sdkLoaded, setSdkLoaded] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

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

  const handleBuy = async (plan) => {
    if (!session) { router.push('/login'); return; }
    if (session.user.isPremium) { toast('You already have an active premium plan!'); return; }

    setLoadingPlan(plan.id);
    try {
      // Step 1: Create order on backend
      const res = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: plan.id }),
      });

      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed to create order'); return; }

      const { paymentSessionId, orderId } = data;

      // Step 2: Open Cashfree checkout
      if (!window.Cashfree) { toast.error('Payment SDK not loaded. Please refresh.'); return; }

      const cashfree = await window.Cashfree({
        mode: process.env.NEXT_PUBLIC_CASHFREE_ENV === 'production' ? 'production' : 'sandbox',
      });

      const checkoutOptions = {
        paymentSessionId,
        redirectTarget: '_self', // redirect in same tab
      };

      cashfree.checkout(checkoutOptions);
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />

      {/* Hero */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-pink-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Crown className="w-4 h-4 fill-yellow-500" /> Premium Membership
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              Unlock Your <span className="gradient-text">Perfect Match</span>
            </h1>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Get unlimited access to all features and find your life partner faster.
            </p>
            {session?.user?.isPremium && (
              <div className="mt-4 inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-4 py-2 rounded-full text-sm font-medium">
                <CheckCircle className="w-4 h-4" /> You have an active Premium plan
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Plans */}
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map((plan, i) => (
              <motion.div key={plan.id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className={`relative bg-white dark:bg-gray-800 rounded-3xl p-6 border-2 shadow-sm transition-all hover:shadow-lg ${plan.badge === 'Most Popular' ? 'border-pink-500 shadow-pink-100 dark:shadow-pink-900/20 scale-105' : 'border-gray-100 dark:border-gray-700'}`}>

                {plan.badge && (
                  <div className={`absolute -top-4 left-1/2 -translate-x-1/2 text-white text-xs font-bold px-4 py-1.5 rounded-full ${plan.badge === 'Most Popular' ? 'gradient-bg' : 'bg-gradient-to-r from-purple-500 to-pink-600'}`}>
                    {plan.badge === 'Most Popular' ? '⭐ ' : '💎 '}{plan.badge}
                  </div>
                )}

                {/* Plan header */}
                <div className={`w-12 h-12 bg-gradient-to-br ${plan.color} rounded-2xl flex items-center justify-center mb-4`}>
                  <Star className="w-6 h-6 text-white fill-white" />
                </div>
                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-5">
                  <span className="text-3xl font-bold">₹{plan.price.toLocaleString()}</span>
                  <span className="text-gray-400 text-sm">{plan.period}</span>
                </div>

                {/* Features */}
                <ul className="space-y-2.5 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-pink-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-600 dark:text-gray-400">{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => handleBuy(plan)}
                  disabled={loadingPlan === plan.id || !sdkLoaded || session?.user?.isPremium}
                  className={`w-full py-3 rounded-2xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                    plan.badge === 'Most Popular'
                      ? 'gradient-bg text-white hover:opacity-90'
                      : 'border-2 border-gray-200 dark:border-gray-600 hover:border-pink-400 hover:text-pink-500'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}>
                  {loadingPlan === plan.id ? (
                    <><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Processing…</>
                  ) : session?.user?.isPremium ? (
                    <><CheckCircle className="w-4 h-4" /> Active Plan</>
                  ) : (
                    <><Lock className="w-4 h-4" /> Get {plan.name} — ₹{plan.price.toLocaleString()}</>
                  )}
                </button>
              </motion.div>
            ))}
          </div>

          {/* Trust badges */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="flex flex-wrap justify-center gap-6 mt-8 text-sm text-gray-400">
            <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-green-500" /> 100% Secure Payment</span>
            <span className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-yellow-500" /> Instant Activation</span>
            <span className="flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-pink-500" /> 7-day Refund Policy</span>
            <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-purple-500" /> Powered by Cashfree</span>
          </motion.div>
        </div>
      </section>

      {/* Perks */}
      <section className="py-12 px-4 bg-white dark:bg-gray-900">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-10">Everything Premium Includes</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {PERKS.map((p, i) => (
              <motion.div key={p.title}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }} viewport={{ once: true }}
                className="flex gap-4 p-5 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center flex-shrink-0">
                  <p.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">{p.title}</h4>
                  <p className="text-gray-500 text-sm">{p.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 px-4 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Common Questions</h2>
          <div className="space-y-4">
            {[
              { q: 'Is my payment secure?', a: 'Yes. All payments are processed by Cashfree, a PCI-DSS compliant payment gateway trusted by 5 lakh+ businesses.' },
              { q: 'Can I cancel anytime?', a: 'Yes. You can cancel your subscription anytime. Your premium access continues until the end of the billing period.' },
              { q: 'What payment methods are accepted?', a: 'UPI, Credit/Debit Cards, Net Banking, Wallets (Paytm, PhonePe, etc.) — all via Cashfree.' },
              { q: 'How quickly is premium activated?', a: 'Instantly after successful payment. You will receive a confirmation notification.' },
            ].map((faq, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} viewport={{ once: true }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
                <p className="font-semibold text-sm mb-1.5">{faq.q}</p>
                <p className="text-gray-500 text-sm">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
