'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import Navbar from '@/components/Navbar';
import SiteLoader, { SiteLoaderInline } from '@/components/SiteLoader';
import { normalizePlans } from '@/lib/plans.js';
import PricingPlanGrid from '@/components/PricingPlanGrid';
import HomeFaqSection from '@/components/HomeFaqSection';
import CookieManageButton from '@/components/CookieManageButton';
import SocialLinks from '@/components/SocialLinks';
import {
  Heart, Search, Shield, Star, Globe, CheckCircle, Users, Award, TrendingUp,
  Sparkles, Crown, Ticket, ArrowRight, Zap,
} from 'lucide-react';

// ── Default Data (fallback) ──────────────────────────────────────────────────
const DEFAULT_SLIDES = [
  {
    id: 1,
    tag: '🪔 Vivah Dwar — Vivah Dwar Matrimonial',
    headline: 'Find Love & Your',
    highlight: 'Life Partner',
    sub: 'India\'s trusted matrimonial platform — verified profiles, smart matching & secure chat for shaadi and marriage.',
  },
  {
    id: 2,
    tag: '✅ Verified Profiles',
    headline: 'Trusted &',
    highlight: 'Authentic Matches',
    sub: 'Every profile is reviewed by our team so you connect with real people in a safe, respectful space.',
  },
  {
    id: 3,
    tag: '🌸 Tradition Meets Trust',
    headline: 'Where Hearts',
    highlight: 'Find Home',
    sub: 'Search by community, religion, and location to find a partner who understands your culture and aspirations.',
  },
];

const DEFAULT_FEATURES = [
  { icon: Search, title: 'Search with filters', desc: 'Look by community, city, education, and the preferences that matter to your family.' },
  { icon: Shield, title: 'Profiles are reviewed', desc: 'New members are checked before their profile is shown to others.' },
  { icon: Heart, title: 'Interest, then chat', desc: 'A conversation starts only when both people choose to connect.' },
  { icon: Users, title: 'Family can help', desc: 'Share a profile, shortlist together, and move at a pace that feels right.' },
];

const DEFAULT_STATS = [
  { icon: Users, value: 0, suffix: '', label: 'Members' },
  { icon: Heart, value: 0, suffix: '', label: 'Happy Couples' },
  { icon: Globe, value: 0, suffix: '', label: 'Countries' },
  { icon: Award, value: 0, suffix: '%', label: 'Verified Profiles' },
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
  const displaySuffix = suffix ?? '';

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
      <div className="text-3xl font-bold vd-gradient-text" key={`${label}-${value}${displaySuffix}`}>
        {count}{displaySuffix}
      </div>
      <div className="text-vd-text-sub text-sm mt-1">{label}</div>
    </motion.div>
  );
}

const DURATION_OPTIONS = [
  { label: '3 Months', months: 3 },
  { label: '6 Months', months: 6 },
  { label: '12 Months', months: 12 },
];

const ICON_MAP = { Search, Shield, Globe, Heart, Users, Award, TrendingUp, Star };

export default function Home() {
  const { data: session } = useSession();
  const [pricingPlans, setPricingPlans] = useState([]);
  const [pricingPlansLoading, setPricingPlansLoading] = useState(true);
  const [selectedMonths, setSelectedMonths] = useState(3);
  const [couponCode, setCouponCode] = useState('');
  const [couponStatus, setCouponStatus] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [stories, setStories] = useState([]);
  const [storiesLoaded, setStoriesLoaded] = useState(false);
  const [storySlide, setStorySlide] = useState(0);
  const storyTimerRef = useRef(null);

  // DB-backed homepage content
  const [hpSlides, setHpSlides] = useState([]);
  const [liveStats, setLiveStats] = useState(null);
  const [hpFeatures, setHpFeatures] = useState([]);
  const [siteConfig, setSiteConfig] = useState({});
  const [contentLoaded, setContentLoaded] = useState(false);
  const [showPricingSection, setShowPricingSection] = useState(true);
  const [homeFaqs, setHomeFaqs] = useState([]);

  // Derived — fall back to defaults if DB is empty
  const SLIDES = hpSlides.length > 0 ? hpSlides : DEFAULT_SLIDES;
  const features = hpFeatures.length > 0
    ? hpFeatures.map(f => ({ ...f, icon: ICON_MAP[f.icon] || Heart }))
    : DEFAULT_FEATURES;
  const STATS = liveStats?.stats
    ? liveStats.stats.map(s => ({ ...s, icon: ICON_MAP[s.icon] || Heart }))
    : DEFAULT_STATS;

  const membersLabel = (() => {
    const membersStat = STATS.find((s) => s.label === 'Members');
    if (membersStat && (membersStat.value > 0 || membersStat.suffix)) {
      return `${membersStat.value}${membersStat.suffix} members`.replace('++', '+');
    }
    if (liveStats?.members) {
      return liveStats.members >= 100000
        ? `${Math.floor(liveStats.members / 100000)} Lakh+ members`
        : `${liveStats.members.toLocaleString('en-IN')} members`;
    }
    return 'members';
  })();

  const ctaHeading = siteConfig.cta_heading || 'Ready to Find Your Soulmate?';
  const ctaSubtext = siteConfig.cta_subtext || `Join ${membersLabel} and start your journey today. It's free!`;
  const footerTagline = siteConfig.footer_tagline || 'Find your perfect life partner with trust, safety, and love.';
  const siteName = siteConfig.site_name || 'Vivah Dwar';

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/homepage/slides').then(r => r.json()).catch(() => []),
      fetch('/api/public/stats', { cache: 'no-store' }).then(r => r.json()).catch(() => null),
      fetch('/api/admin/homepage/features').then(r => r.json()).catch(() => []),
      fetch('/api/admin/siteconfig').then(r => r.json()).catch(() => ({})),
    ]).then(([slides, statsData, feats, cfg]) => {
      if (Array.isArray(slides)) setHpSlides(slides);
      if (statsData?.stats && !statsData.error) setLiveStats(statsData);
      if (Array.isArray(feats)) setHpFeatures(feats);
      setSiteConfig(cfg || {});
      setContentLoaded(true);
    });
  }, []);

  useEffect(() => {
    fetch('/api/faq?home=1')
      .then((r) => r.json())
      .then((data) => setHomeFaqs(Array.isArray(data) ? data : []))
      .catch(() => setHomeFaqs([]));
  }, []);

  useEffect(() => {
    fetch('/api/site/display-settings')
      .then((r) => r.json())
      .then((d) => {
        const show = d.showPricingSection !== false;
        setShowPricingSection(show);
        if (!show) {
          setPricingPlansLoading(false);
          return;
        }
        fetch('/api/plans')
          .then((res) => (res.ok ? res.json() : Promise.reject()))
          .then((data) => setPricingPlans(normalizePlans(data)))
          .catch(() => setPricingPlans([]))
          .finally(() => setPricingPlansLoading(false));
      })
      .catch(() => {
        setShowPricingSection(true);
        fetch('/api/plans')
          .then((res) => (res.ok ? res.json() : Promise.reject()))
          .then((data) => setPricingPlans(normalizePlans(data)))
          .catch(() => setPricingPlans([]))
          .finally(() => setPricingPlansLoading(false));
      });
  }, []);

  useEffect(() => {
    fetch('/api/stories').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setStories(data);
    }).catch(() => {}).finally(() => setStoriesLoaded(true));
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

  // Skeleton shimmer while config loads
  if (!contentLoaded) {
    return (
      <div className="min-h-screen bg-vd-bg">
        <Navbar />
        <div className="flex items-center justify-center flex-1" style={{ minHeight: 'calc(100svh - 4rem)' }}>
          <SiteLoader message="Loading Vivah Dwar…" fullScreen={false} size="lg" />
        </div>
      </div>
    );
  }

  const heroStats = (STATS || []).filter((s) => s && s.label).slice(0, 4);

  return (
    <div className="relative min-h-screen">
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
        <img
          src="/banner/bgshadow.png"
          alt=""
          className="h-full w-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-[#FFFCF7]/55" />
      </div>

      <div className="relative z-10">
      <Navbar />

      <main id="main-content">
      <section aria-label="Vivah Dwar matrimonial hero" className="home-hero relative w-full pt-[72px]">
        <div className="relative w-full">
          <img
            src="/banner/banner1.png"
            alt="Vivah Dwar wedding banner"
            className="block h-auto w-full"
          />
          <div className="pointer-events-none absolute inset-0 hidden bg-gradient-to-r from-[#FFFCF7]/80 via-[#FFFCF7]/25 to-transparent md:block" />
          <div className="relative flex items-center px-4 py-6 sm:px-8 md:absolute md:inset-0 md:py-0 lg:px-14">
            <div className="w-full max-w-lg rounded-3xl border border-[#E8DCC8] bg-white/92 p-6 shadow-[0_12px_40px_rgba(143,107,46,0.12)] backdrop-blur-sm sm:p-8">
              <span className="home-hero-kicker mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold">
                <Sparkles className="h-3.5 w-3.5" />
                {siteName} · Trusted Matrimonial
              </span>
              <h1 className="sr-only">Vivah Dwar – Find Love and Life Partner in India</h1>
              <h2 className="font-display text-4xl font-semibold leading-[1.12] sm:text-5xl">
                Find Love &amp; Your<br />
                <span>Life Partner</span>
              </h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed sm:text-base">
                Verified profiles, smart matching, and private chat — start with real members on {siteName}.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/search" className="vd-gradient-gold inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-90">
                  <Search className="h-4 w-4" />
                  Find Your Match
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/register" className="inline-flex items-center gap-2 rounded-full border border-[#C4A35A] bg-white px-6 py-3 text-sm font-semibold text-[#8F6B2E] hover:bg-[#F8F1E3]">
                  Join Free
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-20 -mt-6 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-5xl grid-cols-2 divide-x divide-[#E8DCC8] overflow-hidden rounded-2xl border border-[#E8DCC8] bg-white shadow-lg sm:grid-cols-4">
          {heroStats.map((s) => (
            <div key={s.label} className="px-4 py-5 text-center sm:px-6">
              <p className="font-display text-2xl font-semibold text-[#8F6B2E] sm:text-3xl">{s.value}{s.suffix || ''}</p>
              <p className="mt-1 text-xs font-medium text-[#6E6254] sm:text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A67C3D]">How it works</p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-[#2C2416] sm:text-4xl">A clear path from profile to conversation</h2>
            <p className="mt-3 text-sm leading-relaxed text-[#6E6254] sm:text-base">
              {siteName} reviews profiles before they go live. You search, shortlist, and chat only with people who chose to connect.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <article key={f.title} className="rounded-2xl border border-[#E8DCC8] bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F8F1E3] text-[#8F6B2E]">
                    <f.icon className="h-5 w-5" />
                  </span>
                  <span className="font-display text-sm text-[#C4A35A]">0{i + 1}</span>
                </div>
                <h3 className="font-semibold text-[#2C2416]">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#6E6254]">{f.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {storiesLoaded && stories.length > 0 && (
      <section className="overflow-hidden px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A67C3D]">From our members</p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-[#2C2416] sm:text-4xl">Couples who met here</h2>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/stories" className="text-sm font-semibold text-vd-primary border border-vd-primary/30 px-5 py-2 rounded-full hover:bg-vd-accent-soft transition-colors">
                View All Stories
              </Link>
              <Link href="/share-story" className="text-sm font-semibold vd-gradient-gold text-white px-5 py-2 rounded-full hover:opacity-90 transition-opacity">
                Share Your Story
              </Link>
            </div>
          </div>

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
                        <article key={t.id} className="flex h-full flex-col rounded-2xl border border-[#E8DCC8] bg-white p-5 shadow-sm">
                          {t.imageUrl ? (
                            <img src={t.imageUrl} alt="" className="mb-4 h-36 w-full rounded-xl object-cover" />
                          ) : null}
                          <p className="line-clamp-4 flex-1 text-sm leading-relaxed text-[#5C4A32]">“{t.story}”</p>
                          <div className="mt-4 flex items-center gap-3 border-t border-[#F3E6C8] pt-4">
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F8F1E3] text-sm font-semibold text-[#8F6B2E]">
                              {t.coupleName?.[0] || '♥'}
                            </span>
                            <span>
                              <span className="block text-sm font-semibold text-[#2C2416]">{t.coupleName}</span>
                              <span className="block text-xs text-[#8A7A68]">{t.location}</span>
                            </span>
                          </div>
                        </article>
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
        </div>
      </section>
      )}

      {/* Pricing — admin can hide entire section */}
      {showPricingSection && (
      <section className="relative py-16 sm:py-24 overflow-hidden bg-vd-bg">
        {/* Decorative background */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute -top-24 left-1/4 w-[28rem] h-[28rem] bg-vd-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 right-1/5 w-80 h-80 bg-vd-accent/20 rounded-full blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(200,164,92,0.06),transparent_55%)]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10 sm:mb-12"
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-vd-primary/10 border border-vd-primary/25 text-vd-primary-dark dark:text-vd-primary-light text-xs font-semibold uppercase tracking-widest mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Premium Membership
            </span>
            <h2 className="font-display text-3xl font-semibold text-[#2C2416] sm:text-4xl mb-3">
              Membership that matches how you search
            </h2>
            <p className="text-[#6E6254] text-sm sm:text-base max-w-xl mx-auto mb-8">
              Start free. Upgrade when you want more contacts, visibility, and chat.
            </p>

            {/* Duration toggle */}
            <div className="inline-flex p-1.5 rounded-2xl bg-vd-bg-section/80 backdrop-blur-sm border border-vd-border shadow-sm gap-1 flex-wrap justify-center">
              {DURATION_OPTIONS.map(opt => (
                <button
                  key={opt.months}
                  type="button"
                  onClick={() => setSelectedMonths(opt.months)}
                  className={`relative px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 ${
                    selectedMonths === opt.months
                      ? 'vd-gradient-gold text-white shadow-md shadow-vd-primary/25'
                      : 'text-vd-text-sub hover:text-vd-text-heading hover:bg-vd-bg-alt'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Coupon */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-md mx-auto mb-8 sm:mb-10"
          >
            <div className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-vd-primary/35 bg-gradient-to-r from-vd-bg-section via-vd-bg-section to-vd-accent-soft/40 dark:to-vd-accent-soft/10 px-4 py-3 shadow-sm">
              <div className="w-10 h-10 rounded-xl vd-gradient-gold flex items-center justify-center flex-shrink-0">
                <Ticket className="w-5 h-5 text-white" />
              </div>
              <input
                value={couponCode}
                onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponStatus(null); }}
                onKeyDown={e => e.key === 'Enter' && validateCoupon()}
                placeholder="Enter coupon code"
                className="flex-1 min-w-0 bg-transparent text-sm outline-none placeholder:text-vd-text-light tracking-wide font-medium"
              />
              <button
                type="button"
                onClick={validateCoupon}
                disabled={couponLoading || !couponCode.trim()}
                className="text-xs font-bold px-4 py-2 vd-gradient-gold text-white rounded-xl disabled:opacity-50 transition-all hover:opacity-90 whitespace-nowrap"
              >
                {couponLoading ? '…' : 'Apply'}
              </button>
            </div>
            {couponStatus?.valid && (
              <p className="text-center text-green-600 dark:text-green-400 text-sm mt-3 font-medium">
                🎉 {couponStatus.discountPct}% off applied on all plans!
              </p>
            )}
            {couponStatus?.error && (
              <p className="text-center text-red-500 text-sm mt-3">{couponStatus.error}</p>
            )}
          </motion.div>

          {pricingPlansLoading ? (
            <SiteLoaderInline message="Loading plans…" className="py-16" />
          ) : (
            <PricingPlanGrid
              plans={pricingPlans}
              selectedMonths={selectedMonths}
              discountPct={couponStatus?.valid ? couponStatus.discountPct : 0}
              session={session}
              mode="link"
            />
          )}

          {/* Trust strip */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-10 sm:mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-vd-text-light"
          >
            <span className="inline-flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-vd-primary" /> Secure payment</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-vd-primary" /> Instant activation</span>
            <span className="inline-flex items-center gap-1.5"><Heart className="w-3.5 h-3.5 text-vd-primary" /> Trusted by couples</span>
          </motion.div>
        </div>
      </section>
      )}

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 rounded-3xl border border-[#E8DCC8] bg-white px-6 py-8 shadow-sm sm:flex-row sm:items-center sm:px-10">
          <div>
            <h2 className="font-display text-2xl font-semibold text-[#2C2416] sm:text-3xl">{ctaHeading}</h2>
            <p className="mt-2 max-w-xl text-sm text-[#6E6254] sm:text-base">{ctaSubtext}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/register" className="vd-gradient-gold inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white">
              Create Free Profile
            </Link>
            <Link href="/search" className="inline-flex items-center gap-2 rounded-full border border-[#C4A35A] bg-white px-6 py-3 text-sm font-semibold text-[#8F6B2E]">
              Browse Matches
            </Link>
          </div>
        </div>
      </section>
      </main>

      {/* General FAQs — above footer, after CTA slider */}
      <HomeFaqSection items={homeFaqs} />

      {/* Footer — matches site warm theme (vd-*) */}
      <footer className="border-t border-[#E8DCC8] bg-[#FFFCF7] text-vd-text-sub">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          {/* Trust cards */}
          <ul className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
            {[
              { icon: Shield, label: 'Verified Profiles', desc: 'Every profile reviewed for authenticity' },
              { icon: CheckCircle, label: 'Safe & Private', desc: 'Your data stays protected' },
              { icon: Users, label: 'Real Support', desc: 'We help you at every step' },
            ].map(({ icon: Icon, label, desc }) => (
              <li
                key={label}
                className="flex items-center gap-3 rounded-2xl bg-vd-bg-section border border-vd-border px-4 py-3.5 shadow-sm"
              >
                <span className="w-10 h-10 rounded-xl vd-gradient-gold flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-white" strokeWidth={2} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-vd-text-heading">{label}</p>
                  <p className="text-xs text-vd-text-light">{desc}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-10 border-b border-vd-border">
            {/* Brand */}
            <div className="lg:col-span-4">
              <Link href="/" className="inline-block mb-4 group" aria-label={siteName}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo/logo.png"
                  alt={siteName}
                  className="h-14 w-auto object-contain transition-opacity group-hover:opacity-90"
                />
              </Link>
              <p className="text-sm leading-relaxed text-vd-text-sub max-w-xs mb-5">
                {footerTagline}
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white vd-gradient-gold hover:opacity-90 transition-opacity shadow-sm"
              >
                Join Free <Heart className="w-4 h-4 fill-white" />
              </Link>
            </div>

            {/* Links */}
            <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-8">
              {[
                {
                  title: 'Company',
                  links: [
                    { label: 'About Us', href: '/about' },
                    { label: 'How It Works', href: '/#how-it-works' },
                    { label: 'Success Stories', href: '/stories' },
                    { label: 'Blog', href: '/blog' },
                  ],
                },
                {
                  title: 'Support',
                  links: [
                    { label: 'Help Center', href: '/help' },
                    { label: 'Safety Tips', href: '/safety' },
                    { label: 'Contact Us', href: '/contact' },
                    { label: 'Report Abuse', href: '/report-abuse' },
                  ],
                },
                {
                  title: 'Legal',
                  links: [
                    { label: 'Privacy Policy', href: '/privacy' },
                    { label: 'Terms of Service', href: '/terms' },
                    { label: 'Refund Policy', href: '/refund' },
                    { label: 'Cookie Policy', href: '/cookies' },
                    { label: 'Child Safety', href: '/child-safety' },
                  ],
                  manageCookies: true,
                },
              ].map(col => (
                <div key={col.title}>
                  <h4 className="text-sm font-semibold text-vd-text-heading mb-3">{col.title}</h4>
                  <ul className="space-y-2">
                    {col.links.map(l => (
                      <li key={l.label}>
                        <Link
                          href={l.href}
                          className="text-sm text-vd-text-sub hover:text-vd-primary-dark transition-colors"
                        >
                          {l.label}
                        </Link>
                      </li>
                    ))}
                    {col.manageCookies && (
                      <li>
                        <CookieManageButton />
                      </li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Social + tagline */}
          <div className="pt-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <p className="text-sm text-vd-text-light">
              Connect with us
            </p>
            <SocialLinks />
          </div>
        </div>

        {/* Bottom — warm tone, not cold slate */}
        <div className="bg-vd-bg-alt border-t border-vd-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-vd-text-light">
            <p>
              © {new Date().getFullYear()} {siteName}. All rights reserved.
            </p>
            <p className="flex items-center gap-1">
              Made with <Heart className="w-3 h-3 fill-vd-primary text-vd-primary" /> in India
            </p>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}
