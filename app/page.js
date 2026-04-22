'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import {
  Heart, Search, Shield, Star, Globe, CheckCircle,
  Sparkles, ArrowRight, MapPin, BadgeCheck, Play, Pause
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

const testimonials = [
  { name: 'Priya & Arjun', location: 'Mumbai, India', text: 'We found each other on Vivah Dwar and got married last year. The matching algorithm was spot on!', img: 'https://randomuser.me/api/portraits/women/44.jpg' },
  { name: 'Sarah & James', location: 'London, UK', text: 'As an NRI, I was worried about finding the right match. Vivah Dwar made it so easy and safe.', img: 'https://randomuser.me/api/portraits/women/68.jpg' },
  { name: 'Fatima & Omar', location: 'Dubai, UAE', text: 'The verified profiles gave us confidence. We are now happily married for 2 years!', img: 'https://randomuser.me/api/portraits/women/65.jpg' },
];

const plans = [
  { name: 'Free', price: '$0', period: 'forever', features: ['Create Profile', 'Browse Matches', 'Send 5 Interests', 'Basic Search'], cta: 'Get Started', highlight: false },
  { name: 'Gold', price: '$19', period: '/month', features: ['Unlimited Interests', 'See Contact Details', 'Advanced Filters', 'Read Receipts', 'Priority Support'], cta: 'Go Gold', highlight: true },
  { name: 'Platinum', price: '$39', period: '/month', features: ['Everything in Gold', 'Unlimited Chat', 'Profile Boost', 'AI Match Score', 'Dedicated Manager'], cta: 'Go Platinum', highlight: false },
];

export default function Home() {
  const [slide, setSlide] = useState(0);
  const [videoError, setVideoError] = useState(false);
  const [paused, setPaused] = useState(false);
  const videoRef = useRef(null);

  // Play audio/audio.mp3 once per session (resets on refresh)
  useEffect(() => {
    if (sessionStorage.getItem('vd_tune_played')) return;
    sessionStorage.setItem('vd_tune_played', '1');
    const audio = new Audio('/audio/audio.mp3');
    audio.volume = 0.5;
    // Stop after 5 seconds
    const stopTimer = setTimeout(() => {
      audio.pause();
      audio.currentTime = 0;
    }, 5000);
    audio.play().catch(() => {});
    return () => {
      clearTimeout(stopTimer);
      audio.pause();
    };
  }, []);

  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % SLIDES.length), 5000);
    return () => clearInterval(t);
  }, []);

  const toggleVideo = () => {
    if (!videoRef.current) return;
    if (paused) { videoRef.current.play(); setPaused(false); }
    else { videoRef.current.pause(); setPaused(true); }
  };

  const current = SLIDES[slide];

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* ══════════════════════════════════════════
          HERO — full-screen video background
      ══════════════════════════════════════════ */}
      <section className="relative h-screen min-h-[640px] max-h-[1080px] flex items-end overflow-hidden">

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
        {[...Array(10)].map((_, i) => (
          <motion.span key={i}
            className="absolute rounded-full pointer-events-none z-20"
            style={{
              width: 2 + (i % 3),
              height: 2 + (i % 3),
              left: `${7 + i * 9}%`,
              top: `${12 + (i % 5) * 15}%`,
              background: i % 3 === 0
                ? 'rgba(200,164,92,0.75)'
                : i % 3 === 1
                ? 'rgba(255,255,255,0.5)'
                : 'rgba(232,180,184,0.65)',
            }}
            animate={{ y: [0, -(18 + i * 4), 0], opacity: [0.1, 0.9, 0.1] }}
            transition={{ duration: 4 + i * 0.65, repeat: Infinity, delay: i * 0.38, ease: 'easeInOut' }}
          />
        ))}

        {/* ── MAIN CONTENT ── */}
        <div className="relative z-40 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="max-w-2xl"
            >
              <span className="inline-block bg-white/15 backdrop-blur-sm text-white text-sm font-medium px-4 py-1.5 rounded-full mb-4 border border-white/20">
                {current.tag}
              </span>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-4">
                {current.headline}{' '}
                <span className="vd-gradient-text">{current.highlight}</span>
              </h1>
              <p className="text-white/90 text-lg sm:text-xl leading-relaxed mb-8 max-w-xl">
                {current.sub}
              </p>
              <Link
                href="/search"
                className="vd-gradient-gold inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-white text-lg hover:opacity-90 transition-opacity shadow-lg"
              >
                <Search className="w-5 h-5" />
                Find Your Match
              </Link>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* BOTTOM WAVE */}
        <div className="absolute bottom-0 left-0 right-0 z-30 pointer-events-none">
          <svg viewBox="0 0 1440 60" className="w-full fill-vd-bg" preserveAspectRatio="none">
            <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" />
          </svg>
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
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                className="bg-vd-bg-section rounded-2xl p-6 shadow-sm border border-vd-border card-hover">
                <div className="w-12 h-12 vd-gradient-gold rounded-2xl flex items-center justify-center mb-4">
                  <f.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-vd-text-sub text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-vd-bg-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Success <span className="vd-gradient-text">Stories</span></h2>
            <p className="text-vd-text-sub">Real couples, real love stories.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div key={t.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                className="bg-vd-bg-alt rounded-2xl p-6 border border-vd-border">
                <div className="flex items-center gap-3 mb-4">
                  <Image src={t.img} alt={t.name} width={48} height={48} className="rounded-full" />
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-vd-text-sub">{t.location}</p>
                  </div>
                </div>
                <p className="text-vd-text-sub text-sm leading-relaxed">"{t.text}"</p>
                <div className="flex gap-1 mt-3">
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-vd-bg-alt">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Simple <span className="vd-gradient-text">Pricing</span></h2>
            <p className="text-vd-text-sub">Choose the plan that works for you.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {plans.map((p, i) => (
              <motion.div key={p.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                className={`rounded-2xl p-6 border-2 relative ${p.highlight ? 'vd-gradient-gold text-white border-transparent shadow-2xl scale-105' : 'bg-vd-bg-section border-vd-border'}`}>
                {p.highlight && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full">Most Popular</div>}
                <h3 className={`text-xl font-bold mb-1 ${p.highlight ? 'text-white' : ''}`}>{p.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold">{p.price}</span>
                  <span className={`text-sm ${p.highlight ? 'text-white/80' : 'text-vd-text-sub'}`}>{p.period}</span>
                </div>
                <ul className="space-y-3 mb-6">
                  {p.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle className={`w-4 h-4 flex-shrink-0 ${p.highlight ? 'text-white' : 'text-vd-primary'}`} />
                      <span className={p.highlight ? 'text-white/90' : 'text-vd-text-sub'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href={p.name === 'Free' ? '/register' : '/premium'}
                  className={`block text-center py-3 rounded-xl font-semibold transition-all ${p.highlight ? 'bg-white text-vd-primary hover:bg-gray-50' : 'vd-gradient-gold text-white hover:opacity-90'}`}>
                  {p.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 vd-gradient-gold">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-4xl font-bold text-white mb-4">Ready to Find Your Soulmate?</h2>
            <p className="text-white mb-8 text-lg">Join 20 million members and start your journey today. It&apos;s free!</p>
            <Link href="/register" className="bg-white text-vd-primary px-10 py-4 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-colors inline-flex items-center gap-2">
              Create Free Profile <Heart className="w-5 h-5 fill-vd-primary" />
            </Link>
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
