'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, Search, HelpCircle, User, Heart, MessageCircle, CreditCard, Shield, Bell, Settings, BookOpen, Star,
} from 'lucide-react';
import { groupFaqsByCategory } from '@/lib/faqShared';

const ICON_MAP = {
  HelpCircle, User, Heart, MessageCircle, CreditCard, Shield, Bell, Settings, BookOpen, Star,
};

const CATEGORY_COLORS = {
  General: 'bg-vd-accent-soft dark:bg-vd-accent/20 text-vd-primary border-vd-primary/20',
  'Account & Profile': 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  'Matches & Interests': 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800',
  'Chat & Messaging': 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
  'Subscription & Payments': 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  'Safety & Privacy': 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
};

function FaqRow({ question, answer, open, onToggle }) {
  return (
    <div className="border-b border-vd-border last:border-0">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between py-4 text-left gap-4 group"
      >
        <span className={`font-medium text-sm leading-snug transition-colors ${open ? 'text-vd-primary' : 'text-vd-text-heading group-hover:text-vd-primary'}`}>
          {question}
        </span>
        <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform ${open ? 'rotate-180 text-vd-primary' : 'text-vd-text-light'}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="text-vd-text-sub text-sm pb-4 leading-relaxed whitespace-pre-wrap">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function BlogFaqSection({ items = [], title = 'Frequently Asked Questions', subtitle = 'Quick answers about matrimony, profiles & Vivah Dwar' }) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [openId, setOpenId] = useState(null);

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

  const grouped = useMemo(() => groupFaqsByCategory(items), [items]);
  const categories = grouped.map((g) => ({ name: g.category, count: g.faqs.length, icon: g.faqs[0]?.icon }));

  if (!items.length) return null;

  return (
    <section className="mt-16 lg:mt-20">
      <div className="rounded-3xl border border-vd-border bg-vd-bg-section dark:bg-vd-bg-card overflow-hidden shadow-sm">
        <div className="px-5 sm:px-8 py-6 sm:py-8 border-b border-vd-border bg-gradient-to-r from-vd-accent-soft/50 to-transparent dark:from-vd-accent/10">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-2xl vd-gradient-gold flex items-center justify-center shrink-0 shadow-sm">
              <HelpCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-vd-text-heading">{title}</h2>
              <p className="text-sm text-vd-text-sub mt-1">{subtitle}</p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-8">
          <div className="lg:grid lg:grid-cols-[minmax(200px,240px)_1fr] gap-6 lg:gap-8">
            {/* Sidebar categories */}
            <aside className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vd-text-light" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search FAQs…"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-vd-border bg-vd-bg text-sm text-vd-text-heading focus:outline-none focus:border-vd-primary focus:ring-2 focus:ring-vd-accent-soft"
                />
              </div>

              <nav className="space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-vd-text-light px-3 mb-2">Categories</p>
                <button
                  type="button"
                  onClick={() => setActiveCategory('all')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                    activeCategory === 'all'
                      ? 'bg-vd-primary/15 text-vd-primary border border-vd-primary/30'
                      : 'text-vd-text-sub hover:bg-vd-bg-alt hover:text-vd-text-heading border border-transparent'
                  }`}
                >
                  <span>All Topics</span>
                  <span className="text-xs opacity-70">{items.length}</span>
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
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left border ${
                        active
                          ? 'bg-vd-primary/15 text-vd-primary border-vd-primary/30'
                          : 'text-vd-text-sub hover:bg-vd-bg-alt hover:text-vd-text-heading border-transparent'
                      }`}
                    >
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </span>
                      <span className="flex-1 min-w-0 truncate">{cat.name}</span>
                      <span className="text-xs opacity-60 shrink-0">{cat.count}</span>
                    </button>
                  );
                })}
              </nav>
            </aside>

            {/* FAQ list */}
            <div className="min-w-0">
              {filtered.length === 0 ? (
                <div className="text-center py-12 rounded-2xl border border-dashed border-vd-border">
                  <HelpCircle className="w-8 h-8 text-vd-text-light mx-auto mb-2" />
                  <p className="text-sm text-vd-text-sub">No matching questions. Try another category or search term.</p>
                </div>
              ) : (
                <div className="rounded-2xl border border-vd-border bg-vd-bg dark:bg-vd-bg-alt/30 px-4 sm:px-5">
                  {filtered.map((faq, i) => (
                    <FaqRow
                      key={faq.id || i}
                      question={faq.question}
                      answer={faq.answer}
                      open={openId === (faq.id || i)}
                      onToggle={() => setOpenId(openId === (faq.id || i) ? null : (faq.id || i))}
                    />
                  ))}
                </div>
              )}

              <p className="text-center mt-6 text-sm text-vd-text-sub">
                Still have questions?{' '}
                <Link href="/help" className="text-vd-primary font-semibold hover:underline">
                  Visit Help Center
                </Link>
                {' · '}
                <Link href="/contact" className="text-vd-primary font-semibold hover:underline">
                  Contact Us
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
