'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import SiteFooter from '@/components/SiteFooter';
import {
  Heart, Shield, Users, Star, Globe, Award, Sparkles, CheckCircle,
  ArrowRight, Target, Eye,
} from 'lucide-react';

const ICON_MAP = { Heart, Shield, Users, Star, Globe, Award, Sparkles, CheckCircle };

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 0.45 },
};

export default function AboutPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/about')
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const s = data?.settings || {};
  const values = data?.values || [];
  const milestones = data?.milestones || [];
  const stats = data?.stats || [];

  return (
    <div className="min-h-screen bg-vd-bg flex flex-col">
      <Navbar />

      {/* Hero */}
      <section
        className="relative pt-24 pb-20 px-4 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #7A5A2E 0%, #A67C3D 35%, #C8A45C 70%, #D4AF37 100%)' }}
      >
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-10 w-80 h-80 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block px-4 py-1.5 rounded-full bg-white/15 text-white/95 text-xs font-semibold tracking-wide mb-4 backdrop-blur-sm"
          >
            {loading ? '…' : s.hero_tag || '🪔 Vivah Dwar Matrimonial'}
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-3xl sm:text-5xl font-black text-white mb-3 leading-tight"
          >
            {loading ? 'About Us' : s.hero_title || 'Bringing Hearts Together'}
            <br />
            <span className="text-white/90">{loading ? '' : s.hero_highlight || 'With Trust & Tradition'}</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-white/85 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed"
          >
            {loading
              ? 'Loading our story…'
              : s.hero_subtitle || "India's trusted matrimonial platform for verified profiles and meaningful connections."}
          </motion.p>
        </div>
      </section>

      {/* Stats strip */}
      {stats.length > 0 && (
        <section className="relative -mt-8 px-4 z-10">
          <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {stats.map((stat, i) => {
              const Icon = ICON_MAP[stat.icon] || Heart;
              return (
                <motion.div
                  key={i}
                  {...fadeUp}
                  transition={{ delay: i * 0.05 }}
                  className="bg-vd-bg-section dark:bg-vd-bg-card rounded-2xl border border-vd-border p-4 sm:p-5 text-center shadow-lg"
                >
                  <Icon className="w-5 h-5 text-vd-primary mx-auto mb-2" />
                  <p className="text-xl sm:text-2xl font-black vd-gradient-text">
                    {stat.value}{stat.suffix}
                  </p>
                  <p className="text-xs text-vd-text-sub mt-0.5 font-medium">{stat.label}</p>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-14 sm:py-16 space-y-16 sm:space-y-20">

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-6">
          <motion.div {...fadeUp} className="bg-vd-bg-section rounded-3xl border border-vd-border p-6 sm:p-8 shadow-sm relative overflow-hidden group hover:border-vd-primary/30 transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-vd-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform" />
            <div className="w-12 h-12 rounded-2xl vd-gradient-gold flex items-center justify-center mb-4">
              <Target className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-vd-text-heading mb-3">{s.mission_title || 'Our Mission'}</h2>
            <p className="text-vd-text-sub text-sm leading-relaxed whitespace-pre-wrap">
              {s.mission_content || 'To make finding a life partner simple, safe, and dignified for every Indian family.'}
            </p>
          </motion.div>

          <motion.div {...fadeUp} transition={{ delay: 0.08 }} className="bg-vd-bg-section rounded-3xl border border-vd-border p-6 sm:p-8 shadow-sm relative overflow-hidden group hover:border-vd-primary/30 transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-vd-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform" />
            <div className="w-12 h-12 rounded-2xl vd-gradient-gold flex items-center justify-center mb-4">
              <Eye className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-vd-text-heading mb-3">{s.vision_title || 'Our Vision'}</h2>
            <p className="text-vd-text-sub text-sm leading-relaxed whitespace-pre-wrap">
              {s.vision_content || "To become India's most trusted matrimonial destination."}
            </p>
          </motion.div>
        </div>

        {/* Our Story */}
        <motion.section {...fadeUp} className="relative">
          <div className="bg-gradient-to-br from-vd-accent-soft/60 to-vd-bg-section rounded-3xl border border-vd-border p-6 sm:p-10 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-start gap-6">
              <div className="w-14 h-14 rounded-2xl vd-gradient-gold flex items-center justify-center shrink-0 shadow-md">
                <Heart className="w-7 h-7 text-white fill-white/30" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-vd-text-heading mb-4">{s.story_title || 'Our Story'}</h2>
                <p className="text-vd-text-sub text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                  {s.story_content || 'Vivah Dwar was built to help families find trustworthy matrimonial connections.'}
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Core Values */}
        {values.length > 0 && (
          <motion.section {...fadeUp}>
            <div className="text-center mb-8">
              <span className="text-xs font-bold uppercase tracking-widest text-vd-primary">What We Stand For</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-vd-text-heading mt-2">Our Core Values</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
              {values.map((v, i) => {
                const Icon = ICON_MAP[v.icon] || Heart;
                return (
                  <motion.div
                    key={v.id || i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06 }}
                    className="group p-5 sm:p-6 bg-vd-bg-section rounded-2xl border border-vd-border hover:border-vd-primary/40 hover:shadow-md transition-all"
                  >
                    <div className="w-11 h-11 rounded-xl bg-vd-accent-soft dark:bg-vd-accent/20 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5 text-vd-primary" />
                    </div>
                    <h3 className="font-bold text-vd-text-heading mb-2">{v.title}</h3>
                    <p className="text-sm text-vd-text-sub leading-relaxed">{v.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* Timeline */}
        {milestones.length > 0 && (
          <motion.section {...fadeUp}>
            <div className="text-center mb-10">
              <span className="text-xs font-bold uppercase tracking-widest text-vd-primary">Our Journey</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-vd-text-heading mt-2">Milestones</h2>
            </div>
            <div className="relative">
              <div className="absolute left-4 sm:left-1/2 top-0 bottom-0 w-0.5 bg-vd-border sm:-translate-x-px" />
              <div className="space-y-8">
                {milestones.map((m, i) => (
                  <motion.div
                    key={m.id || i}
                    initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className={`relative flex flex-col sm:flex-row gap-4 sm:gap-8 ${i % 2 === 0 ? 'sm:flex-row' : 'sm:flex-row-reverse'}`}
                  >
                    <div className="hidden sm:block sm:w-1/2" />
                    <div className="absolute left-4 sm:left-1/2 w-3 h-3 rounded-full vd-gradient-gold border-2 border-vd-bg -translate-x-1/2 mt-6 z-10 shadow" />
                    <div className={`sm:w-1/2 pl-10 sm:pl-0 ${i % 2 === 0 ? 'sm:pr-10 sm:text-right' : 'sm:pl-10'}`}>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-2 ${
                          m.year === 'Soon'
                            ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700'
                            : 'vd-gradient-gold text-white'
                        }`}
                      >
                        {m.year === 'Soon' ? 'Coming Soon' : m.year}
                      </span>
                      <h3 className="font-bold text-vd-text-heading mb-1">{m.title}</h3>
                      <p className="text-sm text-vd-text-sub leading-relaxed">{m.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>
        )}

        {/* Trust badges */}
        <motion.section {...fadeUp} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: Shield, label: 'Verified Profiles' },
            { icon: Users, label: 'Family Trusted' },
            { icon: Sparkles, label: 'Launching 2026' },
            { icon: Award, label: 'Free Registration' },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center text-center p-4 rounded-2xl border border-vd-border bg-vd-bg-section">
              <item.icon className="w-6 h-6 text-vd-primary mb-2" />
              <p className="text-xs font-semibold text-vd-text-heading">{item.label}</p>
            </div>
          ))}
        </motion.section>

        {/* CTA */}
        <motion.section {...fadeUp} className="blog-cta-banner rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden">
          <Sparkles className="w-8 h-8 mx-auto mb-4 text-white opacity-80 relative z-10" />
          <h2 className="blog-cta-title text-2xl sm:text-3xl font-bold mb-3 relative z-10">
            {s.cta_title || 'Free Registration Is Open'}
          </h2>
          <p className="blog-cta-sub text-sm max-w-md mx-auto mb-6 relative z-10">
            {s.cta_subtitle || 'Create your free profile today. Be among the first members before our full platform launch in 2026.'}
          </p>
          <div className="flex flex-wrap justify-center gap-3 relative z-10">
            <Link
              href="/register"
              className="blog-cta-btn inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold text-sm shadow-lg hover:scale-[1.02] transition-all"
            >
              Create Free Profile <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white border border-white/30 px-6 py-3 rounded-2xl font-semibold text-sm hover:bg-white/25 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </motion.section>
      </div>

      <SiteFooter />
    </div>
  );
}
