'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, Search, HelpCircle, User, Heart, MessageCircle, CreditCard, Shield, Bell, Settings, BookOpen, Star, ArrowRight, Sparkles,
} from 'lucide-react';
import { groupFaqsByCategory } from '@/lib/faqShared';

const ICON_MAP = {
  HelpCircle, User, Heart, MessageCircle, CreditCard, Shield, Bell, Settings, BookOpen, Star,
};

const CATEGORY_COLORS = {
  General: 'from-amber-500/20 to-orange-500/10 border-amber-200/60 text-amber-700 dark:text-amber-300',
  'Account & Profile': 'from-blue-500/15 to-blue-500/5 border-blue-200/60 text-blue-700 dark:text-blue-300',
  'Matches & Interests': 'from-rose-500/15 to-rose-500/5 border-rose-200/60 text-rose-700 dark:text-rose-300',
  'Chat & Messaging': 'from-indigo-500/15 to-indigo-500/5 border-indigo-200/60 text-indigo-700 dark:text-indigo-300',
  'Subscription & Payments': 'from-yellow-500/15 to-yellow-500/5 border-yellow-200/60 text-yellow-800 dark:text-yellow-300',
  'Safety & Privacy': 'from-emerald-500/15 to-emerald-500/5 border-emerald-200/60 text-emerald-700 dark:text-emerald-300',
};

function FaqRow({ question, answer, open, onToggle, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.03 }}
      className={`rounded-2xl border transition-all duration-200 ${
        open
          ? 'border-vd-primary/40 bg-white dark:bg-vd-bg-card shadow-md shadow-vd-primary/5'
          : 'border-vd-border/80 bg-vd-bg-section/80 dark:bg-vd-bg-card/50 hover:border-vd-primary/25'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-start justify-between gap-4 px-4 sm:px-5 py-4 text-left"
      >
        <span className={`font-semibold text-sm sm:text-[15px] leading-snug pr-2 ${open ? 'text-vd-primary' : 'text-vd-text-heading'}`}>
          {question}
        </span>
        <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${open ? 'vd-gradient-gold text-white' : 'bg-vd-bg-alt text-vd-text-light'}`}>
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <p className="text-vd-text-sub text-sm leading-relaxed px-4 sm:px-5 pb-4 pt-0 whitespace-pre-wrap border-t border-vd-border/50 mx-4 sm:mx-5 mt-0 pt-3">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function HomeFaqSection({ items = [] }) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [openId, setOpenId] = useState(null);

  const grouped = useMemo(() => groupFaqsByCategory(items), [items]);
  const categories = grouped.map((g) => ({ name: g.category, count: g.faqs.length, icon: g.faqs[0]?.icon }));

  const filtered = useMemo(() => {
    let list = items;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((f) => f.question?.toLowerCase().includes(q) || f.answer?.toLowerCase().includes(q));
    }
    if (activeCategory !== 'all') {
      list = list.filter((f) => f.category === activeCategory);
    }
    return list;
  }, [items, search, activeCategory]);

  if (!items.length) return null;

  return (
    <section id="faqs" className="relative py-16 sm:py-24 overflow-hidden bg-vd-bg">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute -top-20 right-1/4 w-72 h-72 bg-vd-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/6 w-96 h-96 bg-vd-accent/15 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 sm:mb-12"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-vd-primary/10 border border-vd-primary/25 text-vd-primary-dark dark:text-vd-primary-light text-xs font-semibold uppercase tracking-widest mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            General FAQs
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-vd-text-heading mb-3">
            Questions? <span className="vd-gradient-text">We&apos;ve Got Answers</span>
          </h2>
          <p className="text-vd-text-sub text-sm sm:text-base max-w-2xl mx-auto">
            Everything you need to know about profiles, matching, premium plans, and staying safe on Vivah Dwar.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-6 lg:gap-8 items-start">
          {/* Sidebar */}
          <aside className="lg:sticky lg:top-24 space-y-4">
            <div className="rounded-2xl border border-vd-border bg-vd-bg-section dark:bg-vd-bg-card p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-2xl vd-gradient-gold flex items-center justify-center shadow-sm">
                  <HelpCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-vd-text-heading text-sm">Help at a glance</p>
                  <p className="text-xs text-vd-text-sub">{items.length} answers · {categories.length} topics</p>
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vd-text-light" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search questions…"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-vd-border bg-vd-bg text-sm focus:outline-none focus:border-vd-primary focus:ring-2 focus:ring-vd-accent-soft"
                />
              </div>
            </div>

            <nav className="rounded-2xl border border-vd-border bg-vd-bg-section dark:bg-vd-bg-card p-3 shadow-sm space-y-1 max-h-[320px] overflow-y-auto">
              <p className="text-[10px] font-bold uppercase tracking-wider text-vd-text-light px-2 py-1">Browse by topic</p>
              <button
                type="button"
                onClick={() => setActiveCategory('all')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeCategory === 'all'
                    ? 'vd-gradient-gold text-white shadow-sm'
                    : 'text-vd-text-sub hover:bg-vd-bg-alt hover:text-vd-text-heading'
                }`}
              >
                <span>All Topics</span>
                <span className="text-xs opacity-80">{items.length}</span>
              </button>
              {categories.map((cat) => {
                const Icon = ICON_MAP[cat.icon] || HelpCircle;
                const color = CATEGORY_COLORS[cat.name] || CATEGORY_COLORS.General;
                const active = activeCategory === cat.name;
                return (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => setActiveCategory(cat.name)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                      active ? 'ring-2 ring-vd-primary/30 bg-vd-primary/10 text-vd-primary' : 'text-vd-text-sub hover:bg-vd-bg-alt'
                    }`}
                  >
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border bg-gradient-to-br ${color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <span className="flex-1 min-w-0 truncate">{cat.name}</span>
                    <span className="text-xs opacity-60">{cat.count}</span>
                  </button>
                );
              })}
            </nav>

            <Link
              href="/help"
              className="flex items-center justify-between gap-2 rounded-2xl border border-vd-border bg-vd-bg-section dark:bg-vd-bg-card px-4 py-3.5 text-sm font-semibold text-vd-primary hover:border-vd-primary/40 hover:bg-vd-accent-soft/50 transition-colors group"
            >
              <span>Full Help Center</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </aside>

          {/* FAQ list */}
          <div className="min-w-0 space-y-3">
            {filtered.length === 0 ? (
              <div className="text-center py-16 rounded-3xl border border-dashed border-vd-border bg-vd-bg-section/50">
                <HelpCircle className="w-10 h-10 text-vd-text-light mx-auto mb-3" />
                <p className="text-sm text-vd-text-sub">No matching questions. Try another topic or search term.</p>
              </div>
            ) : (
              filtered.map((faq, i) => (
                <FaqRow
                  key={faq.id || i}
                  index={i}
                  question={faq.question}
                  answer={faq.answer}
                  open={openId === (faq.id || i)}
                  onToggle={() => setOpenId(openId === (faq.id || i) ? null : (faq.id || i))}
                />
              ))
            )}

            <p className="text-center pt-4 text-sm text-vd-text-sub">
              Still need help?{' '}
              <Link href="/contact" className="text-vd-primary font-semibold hover:underline">Contact our team</Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
