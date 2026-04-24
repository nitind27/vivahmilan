'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import {
  Heart, Search, Shield, Star, Globe, CheckCircle, Users, Award, TrendingUp
} from 'lucide-react';

// ── Data ──────────────────────────────────────────────────────────────────────
const SLIDES = [
  {
    id: 1,
    tag: '💑 5M+ Happy Couples',
    headline: 'Find Your',
    highlight: 'Perfect Match',
    sub: 'Join 20M+ members and discover your soulmate across 150+ countries with smart AI matching.',
  },
  {
    id: 2,
    tag: '✅ 100% Verified Profiles',
    headline: 'Verified &',
    highlight: 'Trusted Profiles',
    sub: 'Every profile is manually verified by our team. Your safety and authenticity is our priority.',
  },
  {
    id: 3,
    tag: '🌍 150+ Countries',
    headline: 'Love Knows',
    highlight: 'No Boundaries',
    sub: 'NRI, Hindu, Muslim, Christian — find your perfect partner regardless of location or religion.',
  },
];

const PROFILES = [
  { name: 'Priya S.', age: 26, city: 'Mumbai', match: '98%', img: 'https://randomuser.me/api/portraits/women/44.jpg' },
  { name: 'Ananya R.', age: 24, city: 'Delhi', match: '95%', img: 'https://randomuser.me/api/portraits/women/68.jpg' },
  { name: 'Meera K.', age: 27, city: 'Bangalore', match: '92%', img: 'https://randomuser.me/api/portraits/women/65.jpg' },
];

const features = [
  { icon: Search, title: 'Smart Matching', desc: 'AI-powered recommendations based on your preferences and compatibility.' },
  { icon: Shield, title: 'Verified Profiles', desc: 'Every profile is manually verified to ensure authenticity and safety.' },
  { icon: Globe, title: 'Global Reach', desc: 'Find your partner from 150+ countries with location-based search.' },
  { icon: Heart, title: 'Real Connections', desc: 'Meaningful conversations with interest-based chat system.' },
];

const STATS = [
  { icon: Users, value: 20, suffix: 'M+', label: 'Members' },
  { icon: Heart, value: 5, suffix: 'M+', label: 'Happy Couples' },
  { icon: Globe, value: 150, suffix: '+', label: 'Countries' },
  { icon: Award, value: 98, suffix: '%', label: 'Success Rate' },
];

// Animated counter hook
function useCounter(target, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

function StatCard({ icon: Icon, value, suffix, label, delay }) {
  const [inView, setInView] = useState(false);
  const ref = useRef(null);
  const count = useCounter(value, 1800, inView);

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      viewport={{ once: true }}
      whileHover={{ scale: 1.05, y: -4 }}
      className="bg-vd-bg-section rounded-2xl p-6 border border-vd-border text-center shadow-sm"
    >
      <div className="w-12 h-12 vd-gradient-gold rounded-2xl flex items-center justify-center mx-auto mb-3">
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="text-3xl font-bold vd-gradient-text">{count}{suffix}</div>
      <div className="text-vd-text-sub text-sm mt-1">{label}</div>
    </motion.div>
  );
}

const DURATION_OPTIONS = [
  { label: '3 Months', months: 3 },
  { label: '6 Months', months: 6 },
  { label: '12 Months', months: 12 },
  { label: 'Lifetime', months: 0 },  // 0 = lifetime
];

function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

export default function Home() {
  const [slide, setSlide] = useState(0);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [pricingPlans, setPricingPlans] = useState([]);
  const [selectedMonths, setSelectedMonths] = useState(3);
  const [couponCode, setCouponCode] = useState('');
  const [couponStatus, setCouponStatus] = useState(null); // null | { valid, discountPct, code } | { error }
  const [couponLoading, setCouponLoading] = useState(false);
  const [stories, setStories] = useState([]);
  const [storySlide, setStorySlide] = useState(0);
  const storyTimerRef = useRef(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    fetch('/api/admin/plans').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setPricingPlans(data.filter(p => p.isActive !== false));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/stories').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setStories(data);
    }).catch(() => {});
  }, []);

  // Auto-slide stories every 4s
  useEffect(() => {
    if (stories.length <= 1) return;
    storyTimerRef.current = setInterval(() => {
      setStorySlide(s => (s + 1) % stories.length);
    }, 4000);
    return () => clearInterval(storyTimerRef.current);
  }, [stories.length]);

  const validateCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponStatus(null);
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim() }),
      });
      const data = await res.json();
      setCouponStatus(res.ok ? { valid: true, discountPct: data.discountPct, code: data.code } : { error: data.error });
    } catch { setCouponStatus({ error: 'Something went wrong' }); }
    finally { setCouponLoading(false); }
  };

  // Play audio once per session
  useEffect(() => {
    if (sessionStorage.getItem('vd_tune_played')) return;
    sessionStorage.setItem('vd_tune_played', '1');
    const audio = new Audio('/audio/audio.mp3');
    audio.volume = 0.5;
    const stopTimer = setTimeout(() => { audio.pause(); audio.currentTime = 0; }, 5000);
    audio.play().catch(() => {});
    return () => { clearTimeout(stopTimer); audio.pause(); };
  }, []);

  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % SLIDES.length), 5000);
    return () => clearInterval(t);
  }, []);

  const current = SLIDES[slide];

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* ══════════════════════════════════════════
          HERO — full-screen video background
      ══════════════════════════════════════════ */}
      <section className="relative flex items-end overflow-hidden" style={{ height: '100svh', minHeight: '560px', maxHeight: '1080px' }}>

        {/* ── VIDEO ── */}
        <motion.div
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="absolute inset-0 z-0"
        >
          {!videoError ? (
            <video
              ref={videoRef}
              src="/video/banner.mp4"
              autoPlay muted loop playsInline preload="auto"
              onError={() => setVideoError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-vd-bg via-vd-bg-alt to-vd-bg-section" />
          )}
        </motion.div>

        {/* ── CINEMATIC OVERLAYS ── */}
        {/* Top navbar fade */}
        <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-black/75 to-transparent z-10 pointer-events-none" />
        {/* Bottom content vignette */}
        <div className="absolute inset-x-0 bottom-0 h-4/5 bg-gradient-to-t from-black/92 via-black/55 to-transparent z-10 pointer-events-none" />
        {/* Left text readability */}
        <div className="absolute inset-y-0 left-0 w-3/5 bg-gradient-to-r from-black/45 to-transparent z-10 pointer-events-none" />
        {/* Warm tint */}
        <div className="absolute inset-0 bg-gradient-to-br from-vd-bg/25 via-transparent to-vd-bg-section/15 z-10 pointer-events-none" />

        {/* ── PARTICLES ── */}
        {[...Array(14)].map((_, i) => (
          <motion.span key={i}
            className="absolute rounded-full pointer-events-none z-20"
            style={{
              width: 2 + (i % 4),
              height: 2 + (i % 4),
              left: `${5 + i * 7}%`,
              top: `${10 + (i % 6) * 13}%`,
              background: i % 3 === 0
                ? 'rgba(200,164,92,0.8)'
                : i % 3 === 1
                ? 'rgba(255,255,255,0.55)'
                : 'rgba(232,180,184,0.7)',
            }}
            animate={{ y: [0, -(20 + i * 5), 0], opacity: [0.1, 1, 0.1], scale: [1, 1.4, 1] }}
            transition={{ duration: 3.5 + i * 0.6, repeat: Infinity, delay: i * 0.3, ease: 'easeInOut' }}
          />
        ))}

        {/* ── FLOATING HEARTS ── */}
        {mounted && [...Array(6)].map((_, i) => (
          <motion.div key={`heart-${i}`}
            className="absolute pointer-events-none z-20"
            style={{ left: `${10 + i * 15}%`, bottom: '15%' }}
            animate={{ y: [0, -(120 + i * 30)], opacity: [0, 0.7, 0], scale: [0.5, 1, 0.3] }}
            transition={{ duration: 4 + i * 0.8, repeat: Infinity, delay: i * 1.2, ease: 'easeOut' }}
          >
            <Heart className="w-4 h-4 fill-rose-400/60 text-rose-400/60" />
          </motion.div>
        ))}

        {/* ── MAIN CONTENT ── */}
        <div className="relative z-40 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.97 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-2xl"
            >
              <motion.span
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="inline-block bg-white/15 backdrop-blur-sm text-white text-sm font-medium px-4 py-1.5 rounded-full mb-4 border border-white/20"
              >
                {current.tag}
              </motion.span>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-4"
              >
                {current.headline}{' '}
                <span className="vd-gradient-text">{current.highlight}</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-white/90 text-lg sm:text-xl leading-relaxed mb-8 max-w-xl"
              >
                {current.sub}
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-wrap gap-4 items-center"
              >
                <Link
                  href="/search"
                  className="vd-gradient-gold inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-white text-lg hover:opacity-90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  <Search className="w-5 h-5" />
                  Find Your Match
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl font-semibold text-white text-base border border-white/30 hover:bg-white/10 transition-all backdrop-blur-sm"
                >
                  <Heart className="w-4 h-4" />
                  Join Free
                </Link>
              </motion.div>
            </motion.div>
          </AnimatePresence>

          {/* Slide indicators */}
          <div className="flex gap-2 mt-10">
            {SLIDES.map((_, i) => (
              <button key={i} onClick={() => setSlide(i)}
                className="transition-all duration-300 rounded-full"
                style={{ width: i === slide ? 28 : 8, height: 8, background: i === slide ? 'rgba(200,164,92,1)' : 'rgba(255,255,255,0.4)' }}
              />
            ))}
          </div>
        </div>

        {/* BOTTOM WAVE */}
        <div className="absolute bottom-0 left-0 right-0 z-30 pointer-events-none">
          <svg viewBox="0 0 1440 60" className="w-full fill-vd-bg block" preserveAspectRatio="none" style={{ display: 'block', marginBottom: -1 }}>
            <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" />
          </svg>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-vd-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((s, i) => (
              <StatCard key={s.label} {...s} delay={i * 0.1} />
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-vd-bg-alt">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Why Choose <span className="vd-gradient-text">Vivah Dwar?</span></h2>
            <p className="text-vd-text-sub max-w-xl mx-auto">Everything you need to find your perfect life partner, all in one place.</p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.12, duration: 0.5 }} viewport={{ once: true }}
                whileHover={{ y: -6, scale: 1.02 }}
                className="bg-vd-bg-section rounded-2xl p-6 shadow-sm border border-vd-border cursor-default">
                <motion.div
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.4 }}
                  className="w-12 h-12 vd-gradient-gold rounded-2xl flex items-center justify-center mb-4">
                  <f.icon className="w-6 h-6 text-white" />
                </motion.div>
                <h3 className="font-semibold text-vd-text-heading mb-2">{f.title}</h3>
                <p className="text-vd-text-sub text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-vd-bg-section overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Success <span className="vd-gradient-text">Stories</span></h2>
            <p className="text-vd-text-sub">Real couples, real love stories.</p>
          </motion.div>

          {stories.length === 0 ? (
            <p className="text-center text-vd-text-sub py-8">Loading stories…</p>
          ) : (
            <div className="relative">
              {/* Slides */}
              <div className="overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={storySlide}
                    initial={{ opacity: 0, x: 60 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -60 }}
                    transition={{ duration: 0.45, ease: 'easeInOut' }}
                    className="grid md:grid-cols-3 gap-6"
                  >
                    {[0, 1, 2].map(offset => {
                      const t = stories[(storySlide + offset) % stories.length];
                      if (!t) return null;
                      return (
                        <div key={t.id} className="bg-vd-bg-alt rounded-2xl p-6 border border-vd-border">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full vd-gradient-gold flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                              {t.coupleName?.[0] || '♥'}
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{t.coupleName}</p>
                              <p className="text-xs text-vd-text-sub">{t.location}</p>
                            </div>
                          </div>
                          <p className="text-vd-text-sub text-sm leading-relaxed">"{t.story}"</p>
                          <div className="flex gap-1 mt-3">
                            {[...Array(5)].map((_, j) => (
                              <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Prev / Next */}
              <button onClick={() => { clearInterval(storyTimerRef.current); setStorySlide(s => (s - 1 + stories.length) % stories.length); }}
                className="absolute -left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-vd-bg-alt border border-vd-border flex items-center justify-center text-vd-text-sub hover:text-vd-primary hover:border-vd-primary transition-colors shadow-md z-10">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
              <button onClick={() => { clearInterval(storyTimerRef.current); setStorySlide(s => (s + 1) % stories.length); }}
                className="absolute -right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-vd-bg-alt border border-vd-border flex items-center justify-center text-vd-text-sub hover:text-vd-primary hover:border-vd-primary transition-colors shadow-md z-10">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              </button>

              {/* Dots */}
              <div className="flex justify-center gap-2 mt-8">
                {stories.map((_, i) => (
                  <button key={i} onClick={() => { clearInterval(storyTimerRef.current); setStorySlide(i); }}
                    className="transition-all duration-300 rounded-full"
                    style={{ width: i === storySlide ? 24 : 8, height: 8, background: i === storySlide ? 'rgba(200,164,92,1)' : 'rgba(150,150,150,0.3)' }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-vd-bg-alt">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
            <h2 className="text-4xl font-bold mb-4">Simple <span className="vd-gradient-text">Pricing</span></h2>
            <p className="text-vd-text-sub mb-6">Choose the plan that works for you.</p>
            {/* Duration Tabs */}
            <div className="inline-flex bg-vd-bg-section border border-vd-border rounded-2xl p-1 gap-1 flex-wrap justify-center">
              {DURATION_OPTIONS.map(opt => (
                <button key={opt.months} onClick={() => setSelectedMonths(opt.months)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedMonths === opt.months ? 'vd-gradient-gold text-white shadow' : 'text-vd-text-sub hover:text-white'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Coupon Input */}
          <div className="flex justify-center mb-10">
            <div className="flex items-center gap-2 bg-vd-bg-section border border-vd-border rounded-2xl px-4 py-2 w-full max-w-sm">
              <input
                value={couponCode}
                onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponStatus(null); }}
                onKeyDown={e => e.key === 'Enter' && validateCoupon()}
                placeholder="Have a coupon code?"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-vd-text-sub tracking-widest"
              />
              <button onClick={validateCoupon} disabled={couponLoading || !couponCode.trim()}
                className="text-xs font-semibold px-3 py-1.5 vd-gradient-gold text-white rounded-xl disabled:opacity-50 transition-all">
                {couponLoading ? '…' : 'Apply'}
              </button>
            </div>
          </div>
          {couponStatus?.valid && (
            <p className="text-center text-green-400 text-sm mb-6 font-medium">
              🎉 Coupon applied! {couponStatus.discountPct}% off on all plans
            </p>
          )}
          {couponStatus?.error && (
            <p className="text-center text-red-400 text-sm mb-6">{couponStatus.error}</p>
          )}

          {pricingPlans.length === 0 ? (
            <div className="text-center text-vd-text-sub py-10">Loading plans…</div>
          ) : (
            <div className={`grid gap-6 max-w-5xl mx-auto ${pricingPlans.length <= 2 ? 'md:grid-cols-2' : pricingPlans.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-4'}`}>
              {pricingPlans.map((p, i) => {
                const basePrice = Number(p.price || 0);
                const baseDays = Number(p.durationDays || 30);
                const pricePerDay = baseDays > 0 ? basePrice / baseDays : 0;
                const isLifetime = selectedMonths === 0;
                const isFree = basePrice === 0;
                // Lifetime = fixed ₹4999 for paid plans
                const totalDays = isLifetime ? 0 : selectedMonths * 30;
                let totalPrice = isFree ? 0 : isLifetime ? 4999 : Math.round(pricePerDay * totalDays);
                // Apply coupon discount
                const discount = couponStatus?.valid ? couponStatus.discountPct : 0;
                const discountedPrice = isFree ? 0 : Math.round(totalPrice * (1 - discount / 100));
                const isHighlight = p.plan === 'GOLD';
                const perms = (() => { try { return JSON.parse(p.permissions || '{}'); } catch { return {}; } })();
                const features = [
                  perms.canChat && 'Unlimited Chat',
                  perms.canSeeContact && 'See Contact Details',
                  perms.canBoostProfile && 'Profile Boost',
                  perms.canSeeWhoViewed && 'See Who Viewed You',
                  perms.unlimitedInterests && 'Unlimited Interests',
                  perms.aiMatchScore && 'AI Match Score',
                  !perms.unlimitedInterests && perms.interestLimit > 0 && `Send ${perms.interestLimit} Interests`,
                  'Browse Matches',
                  'Create Profile',
                ].filter(Boolean);

                return (
                  <motion.div key={p.plan} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.12, duration: 0.5 }} viewport={{ once: true }}
                    whileHover={{ y: -6, scale: isHighlight ? 1.04 : 1.02 }}
                    className={`rounded-2xl p-6 border-2 relative ${isHighlight ? 'vd-gradient-gold text-white border-transparent shadow-2xl scale-105' : 'bg-vd-bg-section border-vd-border'}`}>
                    {isHighlight && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">Most Popular</div>}
                    {isLifetime && !isFree && <div className="absolute -top-3 right-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">Best Value</div>}
                    <h3 className={`text-xl font-bold mb-1 ${isHighlight ? 'text-white' : ''}`}>{p.displayName || p.plan}</h3>
                    {p.description && <p className={`text-xs mb-3 ${isHighlight ? 'text-white/70' : 'text-vd-text-sub'}`}>{p.description}</p>}
                    <div className="flex items-baseline gap-1 mb-1">
                      {isFree ? (
                        <span className="text-4xl font-bold">Free</span>
                      ) : (
                        <>
                          {discount > 0 && <span className={`text-lg line-through ${isHighlight ? 'text-white/50' : 'text-vd-text-sub'}`}>{formatINR(totalPrice)}</span>}
                          <span className="text-4xl font-bold">{formatINR(discountedPrice)}</span>
                        </>
                      )}
                    </div>
                    {!isFree && (
                      <p className={`text-xs mb-5 ${isHighlight ? 'text-white/70' : 'text-vd-text-sub'}`}>
                        {isLifetime ? 'one-time · lifetime access' : `for ${selectedMonths} month${selectedMonths > 1 ? 's' : ''}`}
                        {discount > 0 && <span className="ml-1 text-green-400 font-semibold">({discount}% off)</span>}
                      </p>
                    )}
                    {isFree && <p className={`text-xs mb-5 ${isHighlight ? 'text-white/70' : 'text-vd-text-sub'}`}>forever</p>}
                    <ul className="space-y-3 mb-6">
                      {features.map(f => (
                        <li key={f} className="flex items-center gap-2 text-sm">
                          <CheckCircle className={`w-4 h-4 flex-shrink-0 ${isHighlight ? 'text-white' : 'text-vd-primary'}`} />
                          <span className={isHighlight ? 'text-white/90' : 'text-vd-text-sub'}>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href={isFree ? '/register' : '/premium'}
                      className={`block text-center py-3 rounded-xl font-semibold transition-all ${isHighlight ? 'bg-white text-vd-primary hover:bg-gray-50' : 'vd-gradient-gold text-white hover:opacity-90'}`}>
                      {isFree ? 'Get Started' : `Get ${p.displayName || p.plan}`}
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 vd-gradient-gold relative overflow-hidden">
        {/* Animated background circles */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-white/20 pointer-events-none"
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-white/15 pointer-events-none"
        />
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }}>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Ready to Find Your Soulmate?</h2>
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              className="inline-block mb-4"
            >
              <Heart className="w-12 h-12 fill-red-500 text-red-500 mx-auto" />
            </motion.div>
            <p className="text-gray-800 mb-8 text-lg">Join 20 million members and start your journey today. It&apos;s free!</p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
              <Link href="/register" className="bg-white text-vd-primary px-10 py-4 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-colors inline-flex items-center gap-2 shadow-xl">
                Create Free Profile <Heart className="w-5 h-5 fill-vd-primary" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-vd-bg text-vd-text-sub py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Image src="/logo/logo.png" alt="Vivah Dwar" width={32} height={32} className="rounded-full object-contain" />
                <span className="text-vd-text-heading font-bold text-xl">Vivah Dwar</span>
              </div>
              <p className="text-sm leading-relaxed">The world&apos;s most trusted matrimonial platform connecting hearts across 150+ countries.</p>
              <div className="flex items-center gap-3 mt-4">
                {[
                  { href: 'https://facebook.com', label: 'Facebook', svg: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /> },
                  { href: 'https://instagram.com', label: 'Instagram', svg: <><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></> },
                  { href: 'https://twitter.com', label: 'X / Twitter', svg: <path d="M4 4l16 16M4 20L20 4" strokeLinecap="round" /> },
                  { href: 'https://youtube.com', label: 'YouTube', svg: <><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/></> },
                  { href: 'https://wa.me', label: 'WhatsApp', svg: <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /> },
                ].map(({ href, label, svg }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                    className="w-8 h-8 rounded-full bg-vd-bg-section border border-vd-border flex items-center justify-center text-vd-text-sub hover:text-vd-primary hover:border-vd-primary transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {svg}
                    </svg>
                  </a>
                ))}
              </div>
            </div>
            {[
              { title: 'Company', links: [{ label: 'About Us', href: '#' }, { label: 'Careers', href: '#' }, { label: 'Press', href: '#' }, { label: 'Blog', href: '#' }] },
              { title: 'Support', links: [{ label: 'Help Center', href: '/help' }, { label: 'Safety Tips', href: '/safety' }, { label: 'Report Abuse', href: '/report-abuse' }, { label: 'Contact Us', href: '/contact' }] },
              { title: 'Legal', links: [{ label: 'Privacy Policy', href: '/privacy' }, { label: 'Terms of Service', href: '/terms' }, { label: 'Cookie Policy', href: '/cookies' }, { label: 'Refund Policy', href: '/refund' }] },
            ].map(col => (
              <div key={col.title}>
                <h4 className="text-vd-text-heading font-semibold mb-4">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map(l => (
                    <li key={l.label}><Link href={l.href} className="text-sm hover:text-vd-primary transition-colors">{l.label}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-vd-border pt-8 text-center text-sm">
            <p>© 2026 Vivah Dwar Matrimony. All rights reserved. Made with <Heart className="w-3 h-3 inline fill-vd-primary text-vd-primary" /> for love.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}