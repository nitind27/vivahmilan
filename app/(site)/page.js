'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import Navbar from '@/components/Navbar';
import SiteLoader, { SiteLoaderInline } from '@/components/SiteLoader';
import { normalizePlans } from '@/lib/plans.js';
import PricingPlanGrid from '@/components/PricingPlanGrid';
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
  { icon: Search, title: 'Smart Matching', desc: 'AI-powered recommendations based on your preferences and compatibility.' },
  { icon: Shield, title: 'Verified Profiles', desc: 'Every profile is manually verified to ensure authenticity and safety.' },
  { icon: Globe, title: 'Global Reach', desc: 'Find your partner from 150+ countries with location-based search.' },
  { icon: Heart, title: 'Real Connections', desc: 'Meaningful conversations with interest-based chat system.' },
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
];

const ICON_MAP = { Search, Shield, Globe, Heart, Users, Award, TrendingUp, Star };

/** CTA background slider — matrimony-themed (Unsplash) */
const CTA_BG_SLIDES = [
  {
    id: 1,
    image: '/slide/sl1.png',
    caption: 'Where two hearts become one',
  },
  {
    id: 2,
    image: '/slide/sl5.png',
    caption: 'Tradition, trust & true connection',
  },
  {
    id: 3,
    image: '/slide/sl4.png',
    caption: 'Your forever begins here',
  },
  {
    id: 4,
    image: '/slide/sl2.png',
    caption: 'Celebrate love with confidence',
  },
];

export default function Home() {
  const [slide, setSlide] = useState(0);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const { data: session } = useSession();
  const [pricingPlans, setPricingPlans] = useState([]);
  const [pricingPlansLoading, setPricingPlansLoading] = useState(true);
  const [selectedMonths, setSelectedMonths] = useState(3);
  const [couponCode, setCouponCode] = useState('');
  const [couponStatus, setCouponStatus] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [stories, setStories] = useState([]);
  const [storySlide, setStorySlide] = useState(0);
  const storyTimerRef = useRef(null);
  const [ctaBgSlide, setCtaBgSlide] = useState(0);
  const ctaTimerRef = useRef(null);

  // DB-backed homepage content
  const [hpSlides, setHpSlides] = useState([]);
  const [liveStats, setLiveStats] = useState(null);
  const [hpFeatures, setHpFeatures] = useState([]);
  const [siteConfig, setSiteConfig] = useState({});
  const [contentLoaded, setContentLoaded] = useState(false);
  const [showPricingSection, setShowPricingSection] = useState(true);

  // Derived — fall back to defaults if DB is empty
  const SLIDES = hpSlides.length > 0 ? hpSlides : DEFAULT_SLIDES;
  const features = hpFeatures.length > 0
    ? hpFeatures.map(f => ({ ...f, icon: ICON_MAP[f.icon] || Heart }))
    : DEFAULT_FEATURES;
  const STATS = liveStats?.stats
    ? liveStats.stats.map(s => ({ ...s, icon: ICON_MAP[s.icon] || Heart }))
    : DEFAULT_STATS;

  const membersLabel = liveStats?.members
    ? `${liveStats.members >= 100000 ? `${Math.floor(liveStats.members / 100000)} Lakh+` : liveStats.members.toLocaleString('en-IN')} members`
    : 'members';

  const ctaHeading = siteConfig.cta_heading || 'Ready to Find Your Soulmate?';
  const ctaSubtext = siteConfig.cta_subtext || `Join ${membersLabel} and start your journey today. It's free!`;
  const footerTagline = siteConfig.footer_tagline || 'Find your perfect life partner with trust, safety, and love.';
  const siteName = siteConfig.site_name || 'Vivah Dwar';

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/homepage/slides').then(r => r.json()).catch(() => []),
      fetch('/api/public/stats').then(r => r.json()).catch(() => null),
      fetch('/api/admin/homepage/features').then(r => r.json()).catch(() => []),
      fetch('/api/admin/siteconfig').then(r => r.json()).catch(() => ({})),
    ]).then(([slides, statsData, feats, cfg]) => {
      if (Array.isArray(slides)) setHpSlides(slides);
      if (statsData?.stats) setLiveStats(statsData);
      if (Array.isArray(feats)) setHpFeatures(feats);
      setSiteConfig(cfg || {});
      setContentLoaded(true);
    });
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
  }, [SLIDES.length]);

  useEffect(() => {
    ctaTimerRef.current = setInterval(() => {
      setCtaBgSlide(s => (s + 1) % CTA_BG_SLIDES.length);
    }, 5500);
    return () => clearInterval(ctaTimerRef.current);
  }, []);

  // Swap video src based on screen width — runs after content is loaded so videoRef is mounted
  useEffect(() => {
    if (!contentLoaded) return;

    const tryPlay = (vid) => {
      if (!vid) return;
      // If already playing, skip
      if (!vid.paused && !vid.ended && vid.readyState > 2) return;
      vid.play().catch(() => {});
    };

    const setVideoSrc = () => {
      const vid = videoRef.current;
      if (!vid) return;
      const isMobile = window.innerWidth <= 768;
      const desired = isMobile ? '/video/mobile.mp4' : '/video/banner.mp4';
      if (vid.getAttribute('data-src') !== desired) {
        vid.setAttribute('data-src', desired);
        vid.src = desired;
        vid.load();
        vid.addEventListener('canplay', () => tryPlay(vid), { once: true });
      } else {
        // Same src but video might be stalled/paused (e.g. after refresh)
        tryPlay(vid);
      }
    };

    setVideoSrc();
    window.addEventListener('resize', setVideoSrc);

    // Resume video when tab becomes visible again
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') tryPlay(videoRef.current);
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.removeEventListener('resize', setVideoSrc);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [contentLoaded]);

  const current = SLIDES[slide] || SLIDES[0];

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

  return (
    <div className="min-h-screen">
      <Navbar />

      <main id="main-content">
      {/* ══════════════════════════════════════════
          HERO — full-screen video background
      ══════════════════════════════════════════ */}
      <section
        aria-label="Vivah Dwar matrimonial hero"
        className="relative flex items-end overflow-hidden isolate"
        style={{ height: '100svh', minHeight: '560px', maxHeight: '1080px' }}
        data-hero-cinematic
      >

        {/* ── VIDEO ── */}
        <motion.div
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="absolute inset-0 z-0"
        >
          {/* Keep video in DOM always so videoRef stays valid; hide on error */}
          <video
            ref={videoRef}
            autoPlay muted loop playsInline preload="auto"
            onError={() => setVideoError(true)}
            className="w-full h-full object-cover"
            style={{ display: videoError ? 'none' : 'block' }}
          />
          {videoError && (
            <div className="w-full h-full bg-gradient-to-br from-vd-bg via-vd-bg-alt to-vd-bg-section" />
          )}
        </motion.div>

        {/* ── CINEMATIC OVERLAYS (same rich look in light & dark — no white wash) ── */}
        <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-black/70 to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-4/5 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 left-0 w-3/5 bg-gradient-to-r from-black/55 to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-vd-primary-dark/15 z-10 pointer-events-none" />

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

        {/* ── MAIN CONTENT (always dark-mode hero typography) ── */}
        <div className="hero-section relative z-40 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.97 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-2xl text-white"
            >
              <motion.span
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="inline-block !text-white bg-white/15 backdrop-blur-sm text-sm font-medium px-4 py-1.5 rounded-full mb-4 border border-white/25 shadow-lg shadow-black/20"
              >
                {current.tag}
              </motion.span>
              <h1 className="sr-only">
                Vivah Dwar – Vivah Dwar Matrimonial | Find Love & Life Partner in India
              </h1>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="!text-white text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-4 drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)]"
              >
                {current.headline}{' '}
                <span className="vd-gradient-text drop-shadow-none">{current.highlight}</span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="!text-white/90 text-lg sm:text-xl leading-relaxed mb-8 max-w-xl drop-shadow-[0_1px_8px_rgba(0,0,0,0.35)]"
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
                  className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl font-semibold !text-white text-base border border-white/35 hover:bg-white/15 transition-all backdrop-blur-sm"
                >
                  <Heart className="w-4 h-4 !text-white" />
                  Join Free
                </Link>
              </motion.div>
            </motion.div>
          </AnimatePresence>

          {/* Slide indicators */}
          <div className="flex gap-2 mt-10">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSlide(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === slide
                    ? 'w-7 bg-vd-primary shadow-[0_0_8px_rgba(200,164,92,0.6)]'
                    : 'w-2 bg-white/40 hover:bg-white/70'
                }`}
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
            <h2 className="text-4xl font-bold mb-4">Why Choose <span className="vd-gradient-text">{siteName}?</span></h2>
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
            <p className="text-vd-text-sub mb-4">Real couples, real love stories.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/stories" className="text-sm font-semibold text-vd-primary border border-vd-primary/30 px-5 py-2 rounded-full hover:bg-vd-accent-soft transition-colors">
                View All Stories
              </Link>
              <Link href="/share-story" className="text-sm font-semibold vd-gradient-gold text-white px-5 py-2 rounded-full hover:opacity-90 transition-opacity">
                Share Your Story
              </Link>
            </div>
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
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 text-balance">
              Find Love with the <span className="vd-gradient-text">Right Plan</span>
            </h2>
            <p className="text-vd-text-sub text-sm sm:text-base max-w-xl mx-auto mb-8">
              Unlock better matches, connect freely, and take your matrimony journey to the next level.
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

      {/* CTA — image slider + glass panel (cinematic text in all themes) */}
      <section className="relative min-h-[32rem] sm:min-h-[36rem] overflow-hidden isolate" data-cta-cinematic>
        {/* Background slides */}
        <div className="absolute inset-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={CTA_BG_SLIDES[ctaBgSlide].id}
              initial={{ opacity: 0, scale: 1.06 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.1, ease: 'easeInOut' }}
              className="absolute inset-0"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={CTA_BG_SLIDES[ctaBgSlide].image}
                alt=""
                className="w-full h-full object-cover"
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/65 to-black/40 z-[1]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 z-[1]" />
        <div className="absolute inset-0 bg-vd-primary/10 mix-blend-overlay z-[1] pointer-events-none" />

        {/* Prev / Next */}
        <button
          type="button"
          aria-label="Previous slide"
          onClick={() => {
            clearInterval(ctaTimerRef.current);
            setCtaBgSlide(s => (s - 1 + CTA_BG_SLIDES.length) % CTA_BG_SLIDES.length);
          }}
          className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/10 backdrop-blur-md border border-white/25 text-white hover:bg-white/20 transition-colors flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <button
          type="button"
          aria-label="Next slide"
          onClick={() => {
            clearInterval(ctaTimerRef.current);
            setCtaBgSlide(s => (s + 1) % CTA_BG_SLIDES.length);
          }}
          className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/10 backdrop-blur-md border border-white/25 text-white hover:bg-white/20 transition-colors flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
        </button>

        <div className="hero-section relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            {/* Content pane */}
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.65 }}
              viewport={{ once: true }}
              className="rounded-3xl border border-white/20 bg-white/10 backdrop-blur-xl p-8 sm:p-10 shadow-2xl text-white"
            >
              <AnimatePresence mode="wait">
                <motion.p
                  key={ctaBgSlide}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="hero-accent inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest mb-4"
                >
                  <Heart className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                  {CTA_BG_SLIDES[ctaBgSlide].caption}
                </motion.p>
              </AnimatePresence>
              <h2 className="!text-white text-3xl sm:text-4xl lg:text-[2.65rem] font-bold leading-tight mb-4">
                {ctaHeading}
              </h2>
              <p className="!text-white/85 text-base sm:text-lg leading-relaxed mb-8 max-w-lg">
                {ctaSubtext}
              </p>
              <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl font-bold !text-gray-900 dark:!text-white bg-white hover:bg-gray-50 dark:bg-white/10 dark:border dark:border-white/35 dark:hover:bg-white/15 transition-colors shadow-lg dark:shadow-none text-base"
                >
                  Create Free Profile
                  <Heart className="w-5 h-5 fill-vd-primary text-vd-primary dark:fill-white dark:text-white" />
                </Link>
                <Link
                  href="/search"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl font-semibold !text-white border border-white/35 hover:bg-white/10 transition-colors text-base"
                >
                  <Search className="w-5 h-5 !text-white" />
                  Browse Matches
                </Link>
              </div>
              <div className="hero-muted flex flex-wrap gap-4 mt-8 pt-6 border-t border-white/15 text-xs">
                <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-amber-300" /> Verified profiles</span>
                <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-amber-300" /> {membersLabel}</span>
              </div>
            </motion.div>

            {/* Image preview pane (desktop) */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.65, delay: 0.1 }}
              viewport={{ once: true }}
              className="hidden lg:block relative text-white"
            >
              <div className="absolute -inset-3 rounded-[1.75rem] bg-gradient-to-br from-amber-400/40 to-rose-400/20 blur-2xl opacity-60" />
              <div className="relative rounded-2xl overflow-hidden border-2 border-white/25 shadow-2xl aspect-[5/4]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`pane-${CTA_BG_SLIDES[ctaBgSlide].id}`}
                    initial={{ opacity: 0, scale: 1.03 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.9 }}
                    className="absolute inset-0"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={CTA_BG_SLIDES[ctaBgSlide].image}
                      alt={CTA_BG_SLIDES[ctaBgSlide].caption}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                </AnimatePresence>
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <p className="!text-white font-semibold text-lg">{CTA_BG_SLIDES[ctaBgSlide].caption}</p>
                  <p className="hero-muted text-sm mt-1">{siteName} — trusted matrimony</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Slide dots */}
          <div className="flex justify-center gap-2 mt-10">
            {CTA_BG_SLIDES.map((s, i) => (
              <button
                key={s.id}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => {
                  clearInterval(ctaTimerRef.current);
                  setCtaBgSlide(i);
                }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === ctaBgSlide
                    ? 'w-7 bg-[#E5C88B] shadow-[0_0_8px_rgba(229,200,139,0.6)]'
                    : 'w-2 bg-white/35 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        </div>
      </section>
      </main>

      {/* Footer — matches site warm theme (vd-*) */}
      <footer className="relative bg-vd-bg text-vd-text-sub">
        {/* Wave: gold CTA → cream footer */}
        <div className="pointer-events-none -mt-px leading-[0]">
          <svg viewBox="0 0 1440 48" className="w-full block fill-vd-bg" preserveAspectRatio="none">
            <path d="M0,24 C480,48 960,0 1440,24 L1440,48 L0,48 Z" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12">
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
            <div className="lg:col-span-4 flex flex-col items-center text-center">
              <Link href="/" className="inline-block mb-4 group" aria-label={siteName}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo/logo.png"
                  alt={siteName}
                  className="h-16 sm:h-[4.5rem] w-auto object-contain mx-auto transition-opacity group-hover:opacity-90"
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
              © {new Date().getFullYear()}{' '}
              <span className="text-vd-text-sub font-medium">Vivah Dwar</span> (Vivah Dwar) — Indian Matrimonial &amp; Find Love Platform. All rights reserved.
            </p>
            <p className="flex items-center gap-1">
              Made with <Heart className="w-3 h-3 fill-vd-primary text-vd-primary" /> in India
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
