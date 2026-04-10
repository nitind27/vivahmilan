'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import { Heart, Search, Shield, Star, Users, Globe, ChevronRight, CheckCircle } from 'lucide-react';

const stats = [
  { label: 'Happy Couples', value: '5M+' },
  { label: 'Active Members', value: '20M+' },
  { label: 'Countries', value: '150+' },
  { label: 'Success Rate', value: '92%' },
];

const features = [
  { icon: Search, title: 'Smart Matching', desc: 'AI-powered recommendations based on your preferences and compatibility.' },
  { icon: Shield, title: 'Verified Profiles', desc: 'Every profile is manually verified to ensure authenticity and safety.' },
  { icon: Globe, title: 'Global Reach', desc: 'Find your partner from 150+ countries with location-based search.' },
  { icon: Heart, title: 'Real Connections', desc: 'Meaningful conversations with interest-based chat system.' },
];

const testimonials = [
  { name: 'Priya & Arjun', location: 'Mumbai, India', text: 'We found each other on Milan and got married last year. The matching algorithm was spot on!', img: 'https://randomuser.me/api/portraits/women/44.jpg' },
  { name: 'Sarah & James', location: 'London, UK', text: 'As an NRI, I was worried about finding the right match. Milan made it so easy and safe.', img: 'https://randomuser.me/api/portraits/women/68.jpg' },
  { name: 'Fatima & Omar', location: 'Dubai, UAE', text: 'The verified profiles gave us confidence. We are now happily married for 2 years!', img: 'https://randomuser.me/api/portraits/women/65.jpg' },
];

const plans = [
  { name: 'Free', price: '$0', period: 'forever', features: ['Create Profile', 'Browse Matches', 'Send 5 Interests', 'Basic Search'], cta: 'Get Started', highlight: false },
  { name: 'Gold', price: '$19', period: '/month', features: ['Unlimited Interests', 'See Contact Details', 'Advanced Filters', 'Read Receipts', 'Priority Support'], cta: 'Go Gold', highlight: true },
  { name: 'Platinum', price: '$39', period: '/month', features: ['Everything in Gold', 'Unlimited Chat', 'Profile Boost', 'AI Match Score', 'Dedicated Manager'], cta: 'Go Platinum', highlight: false },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-pink-200/30 dark:bg-pink-900/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-0 w-80 h-80 bg-purple-200/30 dark:bg-purple-900/20 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
              <div className="inline-flex items-center gap-2 bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Heart className="w-4 h-4 fill-pink-500" /> Trusted by 20M+ members worldwide
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Find Your <span className="gradient-text">Perfect</span> Life Partner
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                Join millions of happy couples who found their soulmate on Milan. Smart matching, verified profiles, and real connections across 150+ countries.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <Link href="/register" className="gradient-bg text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                  Start for Free <ChevronRight className="w-5 h-5" />
                </Link>
                <Link href="/matches" className="border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-8 py-4 rounded-2xl font-semibold text-lg hover:border-pink-400 transition-colors flex items-center justify-center gap-2">
                  <Search className="w-5 h-5" /> Browse Profiles
                </Link>
              </div>

              {/* Quick search */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-100 dark:border-gray-700">
                <p className="text-sm text-gray-500 mb-3 font-medium">Quick Search</p>
                <div className="grid grid-cols-3 gap-2">
                  {['Bride', 'Groom', 'NRI'].map(t => (
                    <Link key={t} href={`/matches?type=${t.toLowerCase()}`} className="text-center py-2 px-3 rounded-xl bg-gray-50 dark:bg-gray-700 text-sm font-medium hover:bg-pink-50 dark:hover:bg-pink-900/20 hover:text-pink-600 transition-colors">
                      {t}
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Hero image collage */}
            <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2 }} className="hidden lg:block">
              <div className="relative h-[500px]">
                <div className="absolute top-0 right-0 w-64 h-80 rounded-3xl overflow-hidden shadow-2xl">
                  <Image src="https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400" alt="couple" fill className="object-cover" />
                </div>
                <div className="absolute bottom-0 left-0 w-56 h-72 rounded-3xl overflow-hidden shadow-2xl">
                  <Image src="https://images.unsplash.com/photo-1529634806980-85c3dd6d34ac?w=400" alt="couple" fill className="object-cover" />
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-64 rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-gray-800">
                  <Image src="https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=400" alt="couple" fill className="object-cover" />
                </div>
                {/* Floating card */}
                <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 3 }} className="absolute top-8 left-8 bg-white dark:bg-gray-800 rounded-2xl p-3 shadow-xl">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 gradient-bg rounded-full flex items-center justify-center">
                      <Heart className="w-4 h-4 text-white fill-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold">New Match!</p>
                      <p className="text-xs text-gray-500">98% compatible</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }} className="text-center">
                <p className="text-4xl font-bold gradient-text mb-1">{s.value}</p>
                <p className="text-gray-500 text-sm">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Why Choose <span className="gradient-text">Milan?</span></h2>
            <p className="text-gray-500 max-w-xl mx-auto">Everything you need to find your perfect life partner, all in one place.</p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 card-hover">
                <div className="w-12 h-12 gradient-bg rounded-2xl flex items-center justify-center mb-4">
                  <f.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Success <span className="gradient-text">Stories</span></h2>
            <p className="text-gray-500">Real couples, real love stories.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div key={t.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                  <Image src={t.img} alt={t.name} width={48} height={48} className="rounded-full" />
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.location}</p>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">"{t.text}"</p>
                <div className="flex gap-1 mt-3">
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Simple <span className="gradient-text">Pricing</span></h2>
            <p className="text-gray-500">Choose the plan that works for you.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {plans.map((p, i) => (
              <motion.div key={p.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                className={`rounded-2xl p-6 border-2 relative ${p.highlight ? 'gradient-bg text-white border-transparent shadow-2xl scale-105' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'}`}>
                {p.highlight && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full">Most Popular</div>}
                <h3 className={`text-xl font-bold mb-1 ${p.highlight ? 'text-white' : ''}`}>{p.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold">{p.price}</span>
                  <span className={`text-sm ${p.highlight ? 'text-white/80' : 'text-gray-500'}`}>{p.period}</span>
                </div>
                <ul className="space-y-3 mb-6">
                  {p.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle className={`w-4 h-4 flex-shrink-0 ${p.highlight ? 'text-white' : 'text-pink-500'}`} />
                      <span className={p.highlight ? 'text-white/90' : 'text-gray-600 dark:text-gray-400'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href={p.name === 'Free' ? '/register' : '/premium'}
                  className={`block text-center py-3 rounded-xl font-semibold transition-all ${p.highlight ? 'bg-white text-pink-600 hover:bg-gray-50' : 'gradient-bg text-white hover:opacity-90'}`}>
                  {p.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 gradient-bg">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-4xl font-bold text-white mb-4">Ready to Find Your Soulmate?</h2>
            <p className="text-white/80 mb-8 text-lg">Join 20 million members and start your journey today. It's free!</p>
            <Link href="/register" className="bg-white text-pink-600 px-10 py-4 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-colors inline-flex items-center gap-2">
              Create Free Profile <Heart className="w-5 h-5 fill-pink-500" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 gradient-bg rounded-full flex items-center justify-center">
                  <Heart className="w-4 h-4 text-white fill-white" />
                </div>
                <span className="text-white font-bold text-xl">Milan</span>
              </div>
              <p className="text-sm leading-relaxed">The world's most trusted matrimonial platform connecting hearts across 150+ countries.</p>
            </div>
            {[
              { title: 'Company', links: [
                { label: 'About Us', href: '#' },
                { label: 'Careers', href: '#' },
                { label: 'Press', href: '#' },
                { label: 'Blog', href: '#' },
              ]},
              { title: 'Support', links: [
                { label: 'Help Center', href: '/help' },
                { label: 'Safety Tips', href: '/safety' },
                { label: 'Report Abuse', href: '/report-abuse' },
                { label: 'Contact Us', href: '/contact' },
              ]},
              { title: 'Legal', links: [
                { label: 'Privacy Policy', href: '#' },
                { label: 'Terms of Service', href: '#' },
                { label: 'Cookie Policy', href: '#' },
                { label: 'Refund Policy', href: '#' },
              ]},
            ].map(col => (
              <div key={col.title}>
                <h4 className="text-white font-semibold mb-4">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map(l => <li key={l.label}><a href={l.href} className="text-sm hover:text-pink-400 transition-colors">{l.label}</a></li>)}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>© 2026 Milan Matrimony. All rights reserved. Made with <Heart className="w-3 h-3 inline fill-pink-500 text-pink-500" /> for love.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
